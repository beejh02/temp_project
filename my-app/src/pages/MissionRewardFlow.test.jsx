import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import MissionDemoProvider from "../components/MissionDemoProvider";
import { demoMission } from "../test/missionDemoFixture";
import MissionDetailPage from "./MissionDetailPage";
import MyPage from "./MyPage";

afterEach(() => { vi.unstubAllGlobals(); });

it("보상 수령 응답 후 마이페이지에서 실제 잔액과 적립 내역을 확인한다", async () => {
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
    if (url === "/api/wallet") return response({
      nickname: "시장탐험가", balance: 5, totalEarned: 5, totalSpent: 0,
      transactions: [{ id: "mission:27", type: "earned", title: "점포 방문 보상", amount: 5,
        balanceAfter: 5, occurredAt: "2026-09-11T01:00:00Z" }],
    });
    throw new Error(`예상하지 않은 요청: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter initialEntries={["/missions/27"]}>
      <MissionDemoProvider><Routes>
        <Route path="/missions/:missionId" element={<MissionDetailPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes></MissionDemoProvider>
    </MemoryRouter>,
  );

  fireEvent.click(await screen.findByRole("button", { name: "보상 받기" }));
  expect(screen.getByRole("button", { name: "처리 중..." })).toBeDisabled();
  expect(screen.queryByRole("link", { name: "내 포인트 보기" })).not.toBeInTheDocument();
  await act(async () => {
    mission = { ...mission, status: "claimed" };
    finishClaim(response(mission));
  });
  expect(screen.getByText("5 NP를 받았어요!")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "내 포인트 보기" }));

  expect(await screen.findByRole("region", { name: "사용 가능한 포인트" })).toHaveTextContent("5 NP");
  expect(screen.getByText("점포 방문 보상")).toBeInTheDocument();
  expect(screen.getByText("+5 NP")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/wallet",
    expect.objectContaining({ credentials: "include" }));
  expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/claim"))).toHaveLength(1);
});
