import { render, screen, waitFor } from "@testing-library/react";
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
    apiFetchMock.mockResolvedValue({
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
        expect.objectContaining({ credentials: "same-origin" }),
      );
    });
  });
});
