import { Link } from "react-router-dom";
import "../pages/Wallet.css";

export default function WalletLayout({ title, description, back = true, children }) {
  return (
    <section className="wallet-page">
      <div className="wallet-content">
        <header className="wallet-header">
          {back && <Link className="wallet-back" to="/mypage">← 마이페이지</Link>}
          <span className="wallet-eyebrow">MY NURIGO</span>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </header>
        {children}
        <p className="wallet-note">현재 브라우저에서 모은 기록이에요. 서버가 재시작되면 포인트와 쿠폰이 초기화돼요.</p>
      </div>
    </section>
  );
}

export function WalletFeedback({ wallet, error, refresh }) {
  if (error) return <div className="wallet-feedback" role="alert"><p>{error}</p>
    <button className="wallet-button wallet-button--light" onClick={refresh}>다시 시도</button></div>;
  if (!wallet) return <p className="wallet-feedback" role="status">내 포인트를 불러오고 있어요.</p>;
  return null;
}
