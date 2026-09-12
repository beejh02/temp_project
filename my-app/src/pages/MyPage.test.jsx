import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import MyPage from "./MyPage";
import PointHistoryPage from "./PointHistoryPage";

const { apiFetchMock, session } = vi.hoisted(() => ({ apiFetchMock: vi.fn(), session: { loadStatus: "success" } }));
vi.mock("../hooks/useMissionDemo", () => ({ default: () => session }));
vi.mock("../utils/api", () => ({ apiFetch: apiFetchMock }));
const history = [
  { id: "2", title: "시장 쿠폰 교환", type: "spent", amount: -10, balanceAfter: 5, occurredAt: "2026-09-11T02:00:00Z" },
  { id: "1", title: "시장 방문 보상", type: "earned", amount: 15, balanceAfter: 15, occurredAt: "2026-09-11T01:00:00Z" },
];
const wallet = { nickname: "시장탐험가", balance: 5, totalEarned: 15, totalSpent: 10, transactions: history };
const response = (data) => ({ ok: true, json: async () => data });
beforeEach(() => { session.loadStatus = "success"; apiFetchMock.mockReset().mockResolvedValue(response(wallet)); });

it("사용 가능한 포인트와 누적 적립·사용을 구분한다", async () => {
  render(<MemoryRouter><MyPage /></MemoryRouter>);
  const card = within(await screen.findByRole("region", { name: "사용 가능한 포인트" }));
  expect(card.getByText("5 NP")).toBeInTheDocument();
  expect(card.getByText("15 NP")).toBeInTheDocument();
  expect(card.getByText("10 NP")).toBeInTheDocument();
  expect(screen.getByText("시장 방문 보상")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "전체 보기 →" })).toHaveAttribute("href", "/mypage/points");
});

it("익명 세션 준비가 끝난 뒤에만 지갑을 조회한다", async () => {
  session.loadStatus = "loading";
  const view = render(<MemoryRouter><MyPage /></MemoryRouter>);
  expect(screen.getByRole("status")).toHaveTextContent("불러오고 있어요");
  expect(apiFetchMock).not.toHaveBeenCalled();
  session.loadStatus = "success";
  view.rerender(<MemoryRouter><MyPage /></MemoryRouter>);
  expect(await screen.findByText("시장탐험가님")).toBeInTheDocument();
  expect(apiFetchMock).toHaveBeenCalledTimes(1);
});

it("조회 실패 후 재시도하고 0 포인트와 빈 내역을 표시한다", async () => {
  apiFetchMock.mockRejectedValueOnce(new Error("연결을 확인해 주세요."))
    .mockResolvedValue(response({ ...wallet, balance: 0, totalEarned: 0, totalSpent: 0, transactions: [] }));
  render(<MemoryRouter><MyPage /></MemoryRouter>);
  expect(await screen.findByRole("alert")).toHaveTextContent("연결을 확인해 주세요.");
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  expect(await screen.findByText(/아직 포인트 내역이 없어요/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /미션으로 포인트 모으기/ })).toHaveAttribute("href", "/missions");
});

it("전체 내역에서 적립과 사용을 각각 확인한다", async () => {
  render(<MemoryRouter><PointHistoryPage /></MemoryRouter>);
  await screen.findByText("시장 방문 보상");
  fireEvent.click(screen.getByRole("button", { name: "사용" }));
  expect(screen.getByText("시장 쿠폰 교환")).toBeInTheDocument();
  expect(screen.queryByText("시장 방문 보상")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "적립" }));
  expect(screen.getByText("시장 방문 보상")).toBeInTheDocument();
  expect(screen.queryByText("시장 쿠폰 교환")).not.toBeInTheDocument();
});

it("화면을 다시 표시하면 최신 잔액을 조회하고 실패해도 기존 내역을 보존한다", async () => {
  render(<MemoryRouter><MyPage /></MemoryRouter>);
  await screen.findByText("시장탐험가님");
  apiFetchMock.mockRejectedValueOnce(new Error("잠시 후 다시 시도해 주세요."));
  await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(await screen.findByRole("alert")).toHaveTextContent("잠시 후");
  expect(screen.getByText("시장 방문 보상")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
});
