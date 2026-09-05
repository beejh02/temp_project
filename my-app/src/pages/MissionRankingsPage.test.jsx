import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

  it("내 순위와 기간별 획득 포인트를 표시하고 지도·미션으로 연결한다", async () => {
    render(<MemoryRouter><MissionRankingsPage /></MemoryRouter>);
    const summary = within(await screen.findByRole("region", { name: "내 참여 순위" }));
    expect(summary.getByText("주간 획득 포인트")).toBeInTheDocument();
    expect(summary.getByText("120 NP")).toBeInTheDocument();
    expect(summary.getByText("3위")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "지도에서 미션 이어가기" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "오늘의 미션 보기" })).toHaveAttribute("href", "/missions");

    apiFetchMock.mockResolvedValue({ ok: true, json: async () => ({
      label: "월간 랭킹", period: "2026.9",
      currentUser: { rank: 2, nickname: "시장탐험가", points: 405 }, leaders: [],
    }) });
    fireEvent.click(screen.getByRole("tab", { name: "월간 순위" }));
    const monthly = within(await screen.findByRole("region", { name: "내 참여 순위" }));
    expect(monthly.getByText("월간 획득 포인트")).toBeInTheDocument();
    expect(monthly.getByText("405 NP")).toBeInTheDocument();
    expect(monthly.getByText("2위")).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenLastCalledWith("/api/missions/rankings?period=monthly",
      expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });
});
