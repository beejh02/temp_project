import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MissionRankingsPage from "./MissionRankingsPage";

const { apiFetchMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
}));

vi.mock("../hooks/useMissionDemo", () => ({
  default: () => ({ loadStatus: "success", errorMessage: "" }),
}));

vi.mock("../utils/api", () => ({
  apiFetch: apiFetchMock,
}));

describe("MissionRankingsPage", () => {
  beforeEach(() => {
    apiFetchMock.mockReset().mockResolvedValue({
      ok: true,
      json: async () => ({
        label: "주간",
        period: "9.1 - 9.7",
        currentUser: {
          rank: 3,
          nickname: "시장탐험가",
          points: 120,
        },
        leaders: [
          { rank: 1, nickname: "골목대장", points: 300 },
        ],
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("공통 API 클라이언트로 주간 랭킹을 조회한다", async () => {
    render(
      <MemoryRouter>
        <MissionRankingsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("시장탐험가")).toBeInTheDocument();
    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/api/missions/rankings?period=weekly",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });
  });

  it("랭킹 조회 실패 후 다시 시도해 정상 상태로 복구한다", async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ message: "랭킹 서버 점검 중입니다." }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          label: "주간",
          period: "9.1 - 9.7",
          currentUser: {
            rank: 1,
            nickname: "시장탐험가",
            points: 120,
          },
          leaders: [],
        }),
      });

    render(
      <MemoryRouter>
        <MissionRankingsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "랭킹 서버 점검 중입니다.",
    );
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("집계된 참여자가 아직 없어요."))
      .toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
  });
});
