import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import PointExchangePage from "./PointExchangePage";
import MyCouponsPage from "./MyCouponsPage";
import MyPage from "./MyPage";
import PointHistoryPage from "./PointHistoryPage";

vi.mock("../hooks/useMissionDemo", () => ({ default: () => ({ loadStatus: "success" }) }));
// jsdom에는 dialog의 브라우저 표시 동작이 없어 open 상태만 대체한다.
const originalShowModal = HTMLDialogElement.prototype.showModal;
beforeAll(() => { HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); }; });
afterAll(() => { HTMLDialogElement.prototype.showModal = originalShowModal; });
const benefits = [
  { id: "snack", title: "시장 간식 500원 할인", cost: 10, description: "간식 혜택", demo: true },
  { id: "character", title: "누리고 캐릭터 키링", cost: 30, description: "캐릭터 선물", demo: true },
];
const coupon = { id: "coupon-1", benefitId: "snack", title: benefits[0].title, cost: 10,
  issuedAt: "2026-09-11T01:00:00Z", expiresAt: "2026-10-11T01:00:00Z", status: "available", demo: true };
let wallet;
let exchangeHandler;
let fetchMock;
const response = (data) => ({ ok: true, json: async () => data });
const issue = () => {
  wallet = { ...wallet, balance: 5, totalSpent: 10, coupons: [coupon], transactions: [
    { id: "exchange:1", type: "spent", title: "시장 간식 500원 할인 교환", amount: -10, balanceAfter: 5, occurredAt: coupon.issuedAt },
  ] };
  return response({ wallet, coupon });
};
beforeEach(() => {
  sessionStorage.clear();
  wallet = { nickname: "탐험가", balance: 15, totalEarned: 15, totalSpent: 0, transactions: [], coupons: [] };
  exchangeHandler = async () => issue();
  fetchMock = vi.fn(async (url, options) => {
    if (url === "/api/wallet") return response(wallet);
    if (url === "/api/wallet/benefits") return response(benefits);
    if (url === "/api/wallet/exchanges") return exchangeHandler(options);
    throw new Error(`예상하지 않은 요청: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear(); });
function app(path = "/mypage/exchange") {
  return <MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/mypage" element={<MyPage />} />
    <Route path="/mypage/exchange" element={<PointExchangePage />} />
    <Route path="/mypage/coupons" element={<MyCouponsPage />} />
    <Route path="/mypage/coupons/:couponId" element={<MyCouponsPage />} />
    <Route path="/mypage/points" element={<PointHistoryPage />} />
  </Routes></MemoryRouter>;
}
const exchangeCalls = () => fetchMock.mock.calls.filter(([url]) => url === "/api/wallet/exchanges");

it("잔액이 부족한 혜택을 안내하고 확인 전에는 교환을 요청하지 않는다", async () => {
  render(app());
  expect(await screen.findByRole("button", { name: "15 NP 더 모으면 교환" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "교환하기" }));
  const dialog = within(screen.getByRole("dialog"));
  expect(dialog.getByText("교환 후 잔액").nextElementSibling).toHaveTextContent("5 NP");
  expect(exchangeCalls()).toHaveLength(0);
  fireEvent.click(dialog.getByRole("button", { name: "닫기" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(exchangeCalls()).toHaveLength(0);
});

it("교환 확정부터 쿠폰 보관과 사용 내역까지 이어지고 중복 클릭을 막는다", async () => {
  let finish;
  exchangeHandler = () => new Promise((resolve) => { finish = resolve; });
  render(app());
  fireEvent.click(await screen.findByRole("button", { name: "교환하기" }));
  fireEvent.click(screen.getByRole("button", { name: "10 NP로 교환 확정" }));
  const pendingButton = screen.getByRole("button", { name: "교환 확인 중..." });
  expect(pendingButton).toBeDisabled();
  fireEvent.click(pendingButton);
  expect(exchangeCalls()).toHaveLength(1);
  await act(async () => finish(issue()));
  expect(await screen.findByRole("heading", { name: "교환 완료!" })).toBeInTheDocument();
  expect(screen.getByText("남은 포인트 5 NP")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "내 쿠폰 전체 보기" }));
  expect(await screen.findByRole("link", { name: "쿠폰 상세 보기" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "← 마이페이지" }));
  expect(await screen.findByText("1장 →")).toBeInTheDocument();
  expect(screen.getByText("-10 NP")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "전체 보기 →" }));
  expect(await screen.findByText("시장 간식 500원 할인 교환")).toBeInTheDocument();
  expect(JSON.parse(exchangeCalls()[0][1].body)).toEqual({ benefitId: "snack", requestId: expect.any(String) });
});

it("응답 유실 뒤 새로 진입해도 같은 요청 번호로 결과를 확인한다", async () => {
  exchangeHandler = async () => { issue(); throw new Error("응답 연결이 끊겼어요."); };
  const first = render(app());
  fireEvent.click(await screen.findByRole("button", { name: "교환하기" }));
  fireEvent.click(screen.getByRole("button", { name: "10 NP로 교환 확정" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("응답 연결");
  const originalBody = exchangeCalls()[0][1].body;
  first.unmount();
  exchangeHandler = async () => response({ wallet, coupon });
  render(app());
  fireEvent.click(await screen.findByRole("button", { name: "이전 교환 결과 확인" }));
  fireEvent.click(screen.getByRole("button", { name: "같은 요청으로 다시 확인" }));
  expect(await screen.findByRole("heading", { name: "교환 완료!" })).toBeInTheDocument();
  expect(exchangeCalls()[1][1].body).toBe(originalBody);
  expect(screen.getByText("남은 포인트 5 NP")).toBeInTheDocument();
  expect(sessionStorage.getItem("nurigo.pending-exchange.v1")).toBeNull();
});

it("서버가 잔액 부족을 알리면 성공을 표시하지 않고 최신 잔액으로 갱신한다", async () => {
  exchangeHandler = async () => {
    wallet = { ...wallet, balance: 0 };
    return { ok: false, status: 409, json: async () => ({ message: "사용 가능한 포인트가 부족해요." }) };
  };
  render(app());
  fireEvent.click(await screen.findByRole("button", { name: "교환하기" }));
  fireEvent.click(screen.getByRole("button", { name: "10 NP로 교환 확정" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("부족해요");
  expect(screen.getByRole("button", { name: "10 NP로 교환 확정" })).toBeDisabled();
  expect(screen.queryByText("교환 완료!")).not.toBeInTheDocument();
  expect(sessionStorage.getItem("nurigo.pending-exchange.v1")).toBeNull();
});

it("쿠폰이 없거나 만료된 상태를 구분한다", async () => {
  const first = render(app("/mypage/coupons"));
  expect(await screen.findByText("아직 교환한 쿠폰이 없어요.")).toBeInTheDocument();
  first.unmount();
  wallet = { ...wallet, coupons: [{ ...coupon, status: "expired" }] };
  render(app("/mypage/coupons"));
  expect(await screen.findByText("기간 만료")).toBeInTheDocument();
  expect(screen.getByText("실제 할인·상품 수령에는 사용할 수 없어요.")).toBeInTheDocument();
});
