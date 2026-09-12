import { formatPoints, formatPointDate } from "../utils/points";

export default function PointHistoryList({ transactions, emptyMessage }) {
  if (!transactions.length) return <p className="wallet-empty">{emptyMessage || <>아직 포인트 내역이 없어요.<br />미션을 완료하고 첫 보상을 받아 보세요.</>}</p>;
  return <ul className="point-history">{transactions.map((item) => (
    <li key={item.id}>
      <span className={`point-history__icon ${item.type === "spent" ? "is-spent" : ""}`} aria-hidden="true">{item.amount > 0 ? "+" : "−"}</span>
      <div className="point-history__details"><strong>{item.title}</strong>
        <time dateTime={item.occurredAt}>{formatPointDate(item.occurredAt)}</time></div>
      <div className="point-history__amount"><strong className={item.amount > 0 ? "is-earned" : ""}>{item.amount > 0 ? "+" : ""}{formatPoints(item.amount)}</strong>
        <small>잔액 {formatPoints(item.balanceAfter)}</small></div>
    </li>
  ))}</ul>;
}
