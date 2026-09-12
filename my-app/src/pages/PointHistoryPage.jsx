import { useState } from "react";
import WalletLayout, { WalletFeedback } from "../components/WalletLayout";
import PointHistoryList from "../components/PointHistoryList";
import useWallet from "../hooks/useWallet";

export default function PointHistoryPage() {
  const state = useWallet();
  const [filter, setFilter] = useState("all");
  const filters = { all: "전체", earned: "적립", spent: "사용" };
  return <WalletLayout title="포인트 내역" description="내가 모으고 사용한 포인트를 확인해요.">
    <WalletFeedback {...state} />
    {state.wallet && <>
      <div className="wallet-filters" aria-label="포인트 내역 필터">{Object.entries(filters).map(([key, label]) => (
        <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
      ))}</div>
      <section className="wallet-card"><PointHistoryList transactions={state.wallet.transactions.filter((item) => filter === "all" || item.type === filter)} /></section>
    </>}
  </WalletLayout>;
}
