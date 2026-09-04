import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MissionDemoProvider from "./MissionDemoProvider";
import useMissionDemo from "../hooks/useMissionDemo";

function MissionCount() {
  const { missions } = useMissionDemo();
  return <span>미션 {missions.length}개</span>;
}

function MissionState() {
  const {
    missions,
    loadStatus,
    errorMessage,
    refreshMissions,
  } = useMissionDemo();

  return (
    <>
      <span data-testid="mission-state">
        {loadStatus}/{missions.length}/{errorMessage || "정상"}
      </span>
      <button type="button" onClick={() => refreshMissions()}>
        미션 다시 시도
      </button>
    </>
  );
}

function LocationActions() {
  const { recordMissionLocation } = useMissionDemo();

  const record = (latitude) => {
    recordMissionLocation({
      latitude,
      longitude: 127.43,
      accuracy: 5,
      recordedAt: "2026-09-04T12:00:00.000Z",
    }).catch(() => {});
  };

  return (
    <>
      <button type="button" onClick={() => record(36.33)}>첫 위치</button>
      <button type="button" onClick={() => record(36.34)}>다음 위치</button>
    </>
  );
}

describe("MissionDemoProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("화면이 보이는 동안 미션 공동 상태를 주기적으로 갱신한다", async () => {
    const view = render(
      <MissionDemoProvider>
        <MissionCount />
      </MissionDemoProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText("미션 0개")).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      "/api/missions/daily",
      expect.objectContaining({ credentials: "include" }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(7500);
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      "/api/missions/daily",
      expect.objectContaining({ credentials: "include" }),
    );
    view.unmount();
  });

  it("빠르게 들어온 위치 판정 요청을 입력 순서대로 처리한다", async () => {
    let resolveFirstLocation;
    const firstLocationResponse = new Promise((resolve) => {
      resolveFirstLocation = resolve;
    });
    let locationRequestCount = 0;

    globalThis.fetch.mockImplementation((url) => {
      if (url === "/api/missions/daily") {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }

      locationRequestCount += 1;

      if (locationRequestCount === 1) {
        return firstLocationResponse;
      }

      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });

    render(
      <MissionDemoProvider>
        <LocationActions />
      </MissionDemoProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("button", { name: "첫 위치" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 위치" }));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(locationRequestCount).toBe(1);

    await act(async () => {
      resolveFirstLocation({
        ok: true,
        json: async () => [],
      });
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(locationRequestCount).toBe(2);
    const locationCalls = globalThis.fetch.mock.calls.filter(
      ([url]) => url === "/api/missions/location",
    );

    expect(JSON.parse(locationCalls[0][1].body).latitude).toBe(36.33);
    expect(JSON.parse(locationCalls[1][1].body).latitude).toBe(36.34);
  });

  it("백그라운드 갱신 실패 시 기존 미션을 유지하고 재시도로 복구한다", async () => {
    let dailyRequestCount = 0;
    const mission = { id: "mission-1" };

    globalThis.fetch.mockImplementation((url) => {
      if (url !== "/api/missions/daily") {
        throw new Error(`예상하지 않은 요청: ${url}`);
      }

      dailyRequestCount += 1;

      if (dailyRequestCount === 2) {
        return Promise.resolve({
          ok: false,
          status: 503,
          json: async () => ({ message: "미션 서버 점검 중입니다." }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => [mission],
      });
    });

    render(
      <MissionDemoProvider>
        <MissionState />
      </MissionDemoProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByTestId("mission-state")).toHaveTextContent(
      "success/1/정상",
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(7500);
    });
    expect(screen.getByTestId("mission-state")).toHaveTextContent(
      "success/1/미션 서버 점검 중입니다.",
    );

    fireEvent.click(screen.getByRole("button", { name: "미션 다시 시도" }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("mission-state")).toHaveTextContent(
      "success/1/정상",
    );
  });

  it("위치 판정 실패 후에도 다음 위치 요청을 계속 처리한다", async () => {
    let locationRequestCount = 0;

    globalThis.fetch.mockImplementation((url) => {
      if (url === "/api/missions/daily") {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }

      locationRequestCount += 1;

      if (locationRequestCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 503,
          json: async () => ({ message: "위치 판정에 실패했습니다." }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => [{ id: "mission-2" }],
      });
    });

    render(
      <MissionDemoProvider>
        <LocationActions />
        <MissionState />
      </MissionDemoProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("button", { name: "첫 위치" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 위치" }));

    await act(async () => {
      for (let index = 0; index < 8; index += 1) {
        await Promise.resolve();
      }
    });

    expect(locationRequestCount).toBe(2);
    expect(screen.getByTestId("mission-state")).toHaveTextContent(
      "success/1/정상",
    );
  });
});
