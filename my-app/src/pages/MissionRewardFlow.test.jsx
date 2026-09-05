import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import MissionDemoProvider from "../components/MissionDemoProvider";
import { demoMission } from "../test/missionDemoFixture";
import MissionDetailPage from "./MissionDetailPage";
import MissionRankingsPage from "./MissionRankingsPage";

afterEach(() => { vi.unstubAllGlobals(); });

it("보상 수령 응답 후 랭킹으로 이동해 서버의 누적 포인트를 확인한다", async () => {
  let mission = { ...demoMission, status: "completed",
    progress: { current: 1, target: 1, label: "방문 완료" },
  };
  let finishClaim;
  const response = (data) => ({ ok: true, json: async () => data });
  const fetchMock = vi.fn(async (url) => {
    if (url === "/api/missions/daily") return response([mission]);
    if (url === "/api/missions/27/claim") {
      return new Promise((resolve) => { finishClaim = resolve; });
    }
    if (url === "/api/missions/rankings?period=weekly") return response({
      label: "주간", period: "9.1 - 9.7",
      currentUser: { rank: 3, nickname: "시장탐험가", points: 125 },
      leaders: [],
    });
    throw new Error(`예상하지 않은 요청: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter initialEntries={["/missions/27"]}>
      <MissionDemoProvider><Routes>
        <Route path="/missions/:missionId" element={<MissionDetailPage />} />
        <Route path="/missions/rankings" element={<MissionRankingsPage />} />
      </Routes></MissionDemoProvider>
    </MemoryRouter>,
  );

  fireEvent.click(await screen.findByRole("button", { name: "보상 받기" }));
  expect(screen.getByRole("button", { name: "처리 중..." })).toBeDisabled();
  expect(screen.queryByRole("link", { name: "내 포인트·순위 보기" })).not.toBeInTheDocument();
  await act(async () => {
    mission = { ...mission, status: "claimed" };
    finishClaim(response(mission));
  });
  expect(screen.getByText("5 NP를 받았어요!")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "내 포인트·순위 보기" }));

  expect(await screen.findByText("125 NP")).toBeInTheDocument();
  expect(screen.getByText("3위")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/missions/rankings?period=weekly",
    expect.objectContaining({ credentials: "include" }));
  expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/claim"))).toHaveLength(1);
});
