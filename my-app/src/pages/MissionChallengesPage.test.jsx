import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MissionChallengesPage from "./MissionChallengesPage";

describe("MissionChallengesPage", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "three-day-streak",
          title: "3일 연속 시장 방문",
          description: "시장 방문 기록",
          status: "in_progress",
          current: 2,
          target: 3,
          reward: 5,
          visits: [
            { day: "1일차", date: "8.27", completed: true },
            { day: "2일차", date: "8.28", completed: true },
            { day: "3일차", date: "8.29", completed: false },
          ],
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("서버 도전 기록과 보상 대기 상태를 표시한다", async () => {
    render(
      <MemoryRouter>
        <MissionChallengesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("3일 연속 시장 방문"))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "오늘 방문 기록 대기" }))
      .toBeDisabled();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/missions/challenges",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("도전 기록 조회 실패 후 다시 시도해 빈 상태로 복구한다", async () => {
    globalThis.fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ message: "도전 기록 서버 점검 중입니다." }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(
      <MemoryRouter>
        <MissionChallengesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "도전 기록 서버 점검 중입니다.",
    );
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("진행 중인 도전 기록이 없어요."))
      .toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("보상 수령 실패 후 버튼을 다시 활성화해 재시도할 수 있다", async () => {
    const completedChallenge = {
      id: "three-day-streak",
      title: "3일 연속 시장 방문",
      description: "시장 방문 기록",
      status: "completed",
      current: 3,
      target: 3,
      reward: 5,
      visits: [
        { day: "1일차", date: "8.27", completed: true },
        { day: "2일차", date: "8.28", completed: true },
        { day: "3일차", date: "8.29", completed: true },
      ],
    };
    const claimedChallenge = { ...completedChallenge, status: "claimed" };

    globalThis.fetch.mockImplementation((url) => {
      if (url === "/api/missions/challenges") {
        return Promise.resolve({
          ok: true,
          json: async () => [completedChallenge],
        });
      }

      const claimCalls = globalThis.fetch.mock.calls.filter(
        ([requestUrl]) => requestUrl.includes("/claim"),
      ).length;

      if (claimCalls === 1) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({ message: "보상 수령에 실패했습니다." }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => claimedChallenge,
      });
    });

    render(
      <MemoryRouter>
        <MissionChallengesPage />
      </MemoryRouter>,
    );

    const claimButton = await screen.findByRole("button", {
      name: "완주 보상 받기",
    });
    fireEvent.click(claimButton);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "보상 수령에 실패했습니다.",
    );
    expect(claimButton).toBeEnabled();

    fireEvent.click(claimButton);

    expect(await screen.findByRole("button", { name: "보상 수령 완료" }))
      .toBeDisabled();
  });
});
