import { useEffect, useId, useRef, useState } from "react";

export default function CharacterModelViewer() {
  const [attempt, setAttempt] = useState(0);
  return <ViewerSession key={attempt} onRetry={() => setAttempt((value) => value + 1)} />;
}

function ViewerSession({ onRetry }) {
  const hostRef = useRef(null);
  const viewerRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const hintId = useId();

  useEffect(() => {
    const host = hostRef.current;
    const controller = new AbortController();
    let disposed = false;
    let viewer;
    (async () => {
      try {
        // Three.js and the model are only requested after the detail dialog opens.
        const [module, buffer] = await Promise.all([
          import("../lib/characterModelViewer"),
          fetch(`${import.meta.env.BASE_URL}models/kkumdori.stl`, { signal: controller.signal }).then(async (response) => {
            if (!response.ok) throw new Error("3D 모델을 불러오지 못했어요. 다시 시도해 주세요.");
            return response.arrayBuffer();
          }),
        ]);
        if (disposed) return;
        viewer = module.createCharacterModelViewer(host, buffer, () => {
          if (disposed) return;
          viewerRef.current = null;
          viewer?.dispose();
          setError("3D 화면 연결이 끊겼어요. 다시 시도해 주세요.");
          setStatus("error");
        });
        viewerRef.current = viewer;
        setStatus("ready");
      } catch (cause) {
        if (disposed || cause.name === "AbortError") return;
        setError(cause.message?.includes("어요") ? cause.message : "3D 미리보기를 열지 못했어요. 다시 시도하거나 다른 브라우저에서 열어 주세요.");
        setStatus("error");
      }
    })();
    return () => {
      disposed = true;
      controller.abort();
      viewerRef.current = null;
      viewer?.dispose();
    };
  }, []);

  const ready = status === "ready";
  return <div className="character-viewer">
    <div className="character-viewer__stage" aria-busy={status === "loading"}>
      <span className="character-viewer__badge" aria-hidden="true"><span />3D 미리보기</span>
      <div className="character-viewer__canvas" ref={hostRef} aria-describedby={hintId} />
      {status === "loading" && <div className="character-viewer__overlay" role="status"><span className="character-viewer__spinner" aria-hidden="true" /><p>키링을 불러오고 있어요.</p></div>}
      {status === "error" && <div className="character-viewer__overlay">
        <p role="alert">{error}</p><button type="button" className="wallet-button wallet-button--light" onClick={onRetry}>다시 시도</button>
      </div>}
      <p className="character-viewer__hint" id={hintId}>드래그로 회전 · 스크롤 또는 두 손가락으로 확대</p>
    </div>
    <div className="character-viewer__toolbar" role="group" aria-label="3D 모델 조작">
      <button type="button" disabled={!ready} onClick={() => viewerRef.current?.rotate(-1)} aria-label="왼쪽으로 회전">↶</button>
      <button type="button" disabled={!ready} onClick={() => viewerRef.current?.rotate(1)} aria-label="오른쪽으로 회전">↷</button>
      <span className="character-viewer__divider" aria-hidden="true" />
      <button type="button" disabled={!ready} onClick={() => viewerRef.current?.zoom(1.2)} aria-label="축소">−</button>
      <button type="button" disabled={!ready} onClick={() => viewerRef.current?.zoom(1 / 1.2)} aria-label="확대">+</button>
      <button type="button" disabled={!ready} className="character-viewer__reset" onClick={() => viewerRef.current?.reset()}>처음으로</button>
    </div>
  </div>;
}
