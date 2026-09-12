import { Link, useLocation, useParams } from "react-router-dom";
import WalletLayout, { WalletFeedback } from "../components/WalletLayout";
import useWallet from "../hooks/useWallet";
import { formatPoints, formatPointDate } from "../utils/points";

export default function MyCouponsPage() {
  const state = useWallet();
  const { couponId } = useParams();
  const { state: navigationState } = useLocation();
  const coupons = state.wallet?.coupons || [];
  const selected = coupons.find((coupon) => coupon.id === couponId);
  const success = navigationState?.exchanged && selected;
  return <WalletLayout title={success ? "교환 완료!" : couponId ? "쿠폰 상세" : "내 쿠폰"}
    description={success ? "모은 포인트가 새로운 즐거움이 되었어요." : "포인트로 교환한 혜택을 모아 보세요."}>
    <WalletFeedback {...state} />
    {state.wallet && <>
      {success && <div className="coupon-success" role="status"><span aria-hidden="true">✓</span><p>쿠폰이 내 쿠폰함에 담겼어요.</p><strong>남은 포인트 {formatPoints(state.wallet.balance)}</strong></div>}
      {couponId && !selected ? <p className="wallet-empty">쿠폰을 찾을 수 없어요. 현재 브라우저의 쿠폰함을 확인해 주세요.</p>
        : !couponId && !coupons.length ? <div className="wallet-empty"><p>아직 교환한 쿠폰이 없어요.</p><p>미션으로 포인트를 모아 첫 혜택을 받아 보세요.</p></div>
          : <div className="coupon-list">{(couponId ? [selected] : coupons).map((coupon) => <CouponCard key={coupon.id} coupon={coupon} detail={Boolean(couponId)} />)}</div>}
      <Link className="wallet-button" to={couponId ? "/mypage/coupons" : "/mypage/exchange"}>{couponId ? "내 쿠폰 전체 보기" : "교환할 혜택 보기"}</Link>
      {couponId && <Link className="wallet-button wallet-button--light" to="/mypage/exchange">다른 혜택 둘러보기</Link>}
    </>}
  </WalletLayout>;
}

function CouponCard({ coupon, detail }) {
  return <article className={`coupon-card ${coupon.status === "expired" ? "is-expired" : ""}`}>
    <div className="wallet-section-heading"><span className="coupon-badge">시연용</span><span className="coupon-status">{coupon.status === "expired" ? "기간 만료" : "보관 중"}</span></div>
    <h2>{coupon.title}</h2><p>{formatPoints(coupon.cost)}로 교환</p>
    <div className="coupon-dates"><span>발급 {formatPointDate(coupon.issuedAt)}</span><span>보관 기한 {formatPointDate(coupon.expiresAt)}</span></div>
    <p className="coupon-disclaimer">실제 할인·상품 수령에는 사용할 수 없어요.</p>
    {detail ? <p className="coupon-id">쿠폰 번호 {coupon.id}</p> : <Link className="wallet-button wallet-button--light" to={`/mypage/coupons/${coupon.id}`}>쿠폰 상세 보기</Link>}
  </article>;
}
