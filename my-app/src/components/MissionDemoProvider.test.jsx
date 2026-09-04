import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MissionDemoProvider from "./MissionDemoProvider";
import useMissionDemo from "../hooks/useMissionDemo";

function MissionCount() {
  const { missions } = useMissionDemo();
  return <span>미션 {missions.length}개</span>;
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
});
