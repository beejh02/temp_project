import { Link } from "react-router-dom";
import WalletLayout, { WalletFeedback } from "../components/WalletLayout";
import PointHistoryList from "../components/PointHistoryList";
import { formatPoints } from "../utils/points";
import useWallet from "../hooks/useWallet";

export default function MyPage() {
  const state = useWallet();
  const { wallet } = state;
  return <WalletLayout title="마이페이지" description="시장을 누빈 만큼, 차곡차곡 모이는 즐거움" back={false}>
    <WalletFeedback {...state} />
    {wallet && <>
      <section className="wallet-balance" aria-labelledby="wallet-balance-title">
        <div className="wallet-balance__top"><div><p>{wallet.nickname}님</p>
          <h2 id="wallet-balance-title">사용 가능한 포인트</h2>
          <strong className="wallet-balance__number">{formatPoints(wallet.balance)}</strong></div>
          <img src="/nurigo-location.png" alt="" width="76" height="89" /></div>
        <dl className="wallet-totals"><div><dt>누적 적립</dt><dd>{formatPoints(wallet.totalEarned)}</dd></div>
          <div><dt>누적 사용</dt><dd>{formatPoints(wallet.totalSpent)}</dd></div></dl>
      </section>
      <Link className="wallet-button wallet-button--exchange" to="/mypage/exchange">포인트로 혜택 교환하기 <span aria-hidden="true">→</span></Link>
      <div className="wallet-shortcuts"><Link to="/mypage/coupons"><span>내 쿠폰</span><strong>{(wallet.coupons || []).filter((coupon) => coupon.status === "available").length}장 →</strong></Link>
        <Link to="/missions"><span>다음 포인트 모으기</span><strong>미션 둘러보기 →</strong></Link></div>
      <section className="wallet-card" aria-labelledby="recent-points-title">
        <div className="wallet-section-heading"><h2 id="recent-points-title">최근 포인트 내역</h2><Link to="/mypage/points">전체 보기 →</Link></div>
        <PointHistoryList transactions={wallet.transactions.slice(0, 3)} />
      </section>
      {wallet.balance === 0 && <Link className="wallet-button wallet-button--light" to="/missions">미션으로 포인트 모으기 →</Link>}
    </>}
  </WalletLayout>;
}
