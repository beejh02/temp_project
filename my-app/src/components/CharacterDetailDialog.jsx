import { useEffect, useId, useRef } from "react";
import CharacterModelViewer from "./CharacterModelViewer";
import { formatPoints } from "../utils/points";
import "./CharacterDetailDialog.css";

export default function CharacterDetailDialog({ benefit, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  const dismissBackdrop = (event) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  };

  return <dialog ref={dialogRef} className="character-detail" aria-labelledby={titleId}
    onClick={dismissBackdrop} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className="character-detail__header">
      <div><span className="character-detail__eyebrow">360° PREVIEW</span>
        <h2 id={titleId}>{benefit.title} 자세히보기</h2></div>
      <button type="button" className="character-detail__close" aria-label="자세히보기 닫기" onClick={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </header>
    <CharacterModelViewer />
    <div className="character-detail__info">
      <div className="character-detail__summary"><div><span className="coupon-badge">시연용 혜택</span><p>{benefit.description}</p></div>
        <strong>{formatPoints(benefit.cost)}</strong></div>
      <p className="character-detail__note">모양을 살펴보는 3D 미리보기예요. 색상과 재질은 실제 제품과 다를 수 있어요.</p>
    </div>
  </dialog>;
}
