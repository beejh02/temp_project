import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MissionDemoProvider from "./MissionDemoProvider";
import useMissionDemo from "../hooks/useMissionDemo";

function MissionCount() {
  const { missions } = useMissionDemo();
  return <span>미션 {missions.length}개</span>;
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
});
