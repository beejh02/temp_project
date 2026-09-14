import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import WalletLayout, { WalletFeedback } from "../components/WalletLayout";
import CharacterDetailDialog from "../components/CharacterDetailDialog";
import useWallet from "../hooks/useWallet";
import { apiFetch } from "../utils/api";
import { formatPoints } from "../utils/points";
import { readPendingExchange, savePendingExchange } from "../utils/exchangeRequest";

export default function PointExchangePage() {
  const state = useWallet();
  const navigate = useNavigate();
  const [benefits, setBenefits] = useState(null);
  const [catalogError, setCatalogError] = useState("");
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(readPendingExchange);
  const requestRef = useRef(pendingRequest);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    (async () => {
      try {
        const response = await apiFetch("/api/wallet/benefits", { signal: controller.signal });
        const data = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(data)) throw new Error(data?.message || "교환 혜택을 불러오지 못했어요.");
        if (!disposed) { setBenefits(data); setCatalogError(""); }
      } catch (cause) {
        if (!disposed && cause.name !== "AbortError") setCatalogError(cause.message);
      }
    })();
    return () => { disposed = true; controller.abort(); };
  }, [reload]);

  const updateRequest = (value) => {
    requestRef.current = value;
    savePendingExchange(value);
    setPendingRequest(value);
  };

  const exchange = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const request = requestRef.current || { benefitId: selected.id, requestId: crypto.randomUUID() };
      updateRequest(request);
      const response = await apiFetch("/api/wallet/exchanges", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) updateRequest(null);
        throw new Error(data?.message || "교환 결과를 확인하지 못했어요. 같은 요청으로 다시 확인해 주세요.");
      }
      if (!data?.coupon?.id) throw new Error("교환 결과를 확인하지 못했어요. 다시 확인해 주세요.");
      updateRequest(null);
      navigate(`/mypage/coupons/${data.coupon.id}`, { state: { exchanged: true } });
    } catch (cause) {
      setError(cause.message || "연결이 끊겼어요. 같은 요청으로 다시 확인해 주세요.");
      state.refresh();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const outstanding = benefits?.find((item) => item.id === pendingRequest?.benefitId);
  return <WalletLayout title="포인트 교환" description="시장 탐험으로 모은 포인트를 혜택으로 바꿔요.">
    <aside className="wallet-demo-notice"><strong>시연용 교환소</strong><p>교환 흐름을 체험하는 예시 혜택이에요. 실제 할인이나 상품 수령에는 사용할 수 없어요.</p></aside>
    <WalletFeedback {...state} />
    {state.wallet && <div className="exchange-balance"><span>사용 가능한 포인트</span><strong>{formatPoints(state.wallet.balance)}</strong></div>}
    {pendingRequest && <div className="wallet-feedback" role="status"><p>이전 교환 결과를 먼저 확인해 주세요. 같은 요청을 다시 확인해도 중복 차감되지 않아요.</p>
      {outstanding && <button className="wallet-button wallet-button--light" onClick={() => { setSelected(outstanding); setError(""); }}>이전 교환 결과 확인</button>}</div>}
    {catalogError ? <div className="wallet-feedback" role="alert"><p>{catalogError}</p><button className="wallet-button wallet-button--light" onClick={() => setReload((value) => value + 1)}>혜택 다시 불러오기</button></div>
      : !benefits && <p className="wallet-feedback" role="status">교환 혜택을 불러오고 있어요.</p>}
    {benefits?.length === 0 && <p className="wallet-empty">준비된 교환 혜택이 없어요.</p>}
    <div className="benefit-list">{benefits?.map((benefit, index) => {
      const shortage = Math.max(0, benefit.cost - (state.wallet?.balance || 0));
      return <article className="benefit-card" key={benefit.id}>
        <div className={`benefit-art benefit-art--${index}`} aria-hidden="true">{benefit.id === "character" ? <img src="/nurigo-location.png" alt="" /> : <span>NP</span>}</div>
        <div className="benefit-card__body"><span className="coupon-badge">시연용</span><h2>{benefit.title}</h2><p>{benefit.description}</p><strong>{formatPoints(benefit.cost)}</strong>
          {benefit.id === "character" && <button type="button" className="wallet-button benefit-detail-button" aria-haspopup="dialog"
            onClick={() => setPreview(benefit)}>자세히보기 <span aria-hidden="true">↗</span></button>}
          <button className="wallet-button wallet-button--light" disabled={!state.wallet || Boolean(state.error) || shortage > 0 || Boolean(pendingRequest)}
            onClick={() => { setSelected(benefit); setError(""); }}>
            {shortage > 0 ? `${formatPoints(shortage)} 더 모으면 교환` : "교환하기"}</button></div>
      </article>;
    })}</div>
    <Link className="wallet-button wallet-button--light" to="/mypage/coupons">내 쿠폰 보기</Link>
    {preview && <CharacterDetailDialog benefit={preview} onClose={() => setPreview(null)} />}
    {selected && state.wallet && <ExchangeDialog benefit={selected} balance={state.wallet.balance} busy={busy}
      retry={Boolean(pendingRequest)} error={error} onConfirm={exchange} onClose={() => { if (!busyRef.current) setSelected(null); }} />}
  </WalletLayout>;
}

function ExchangeDialog({ benefit, balance, busy, retry, error, onConfirm, onClose }) {
  const dialog = useRef(null);
  useEffect(() => { dialog.current.showModal(); }, []);
  return <dialog ref={dialog} className="exchange-dialog" aria-labelledby="exchange-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <span className="coupon-badge">시연용 혜택</span><h2 id="exchange-title">{retry ? "교환 결과를 확인할까요?" : "이 혜택으로 교환할까요?"}</h2>
    <p>{benefit.title}</p>
    <dl className="exchange-summary"><div><dt>교환 포인트</dt><dd>{formatPoints(benefit.cost)}</dd></div>
      {!retry && <div><dt>교환 후 잔액</dt><dd>{formatPoints(Math.max(0, balance - benefit.cost))}</dd></div>}</dl>
    <p className="wallet-note">발급 후 30일 동안 내 쿠폰에서 확인할 수 있어요. 실제 매장에서는 사용할 수 없는 시연용 쿠폰이에요.</p>
    {error && <p className="exchange-error" role="alert">{error}</p>}
    <button className="wallet-button" disabled={busy || (!retry && balance < benefit.cost)} onClick={onConfirm}>{busy ? "교환 확인 중..." : retry ? "같은 요청으로 다시 확인" : `${formatPoints(benefit.cost)}로 교환 확정`}</button>
    <button className="wallet-button wallet-button--light" disabled={busy} onClick={onClose}>닫기</button>
  </dialog>;
}
