import { useEffect, useState } from "react";
import loadingImage from "../assets/nurigo-loading.png";
import useStartup from "../hooks/useStartup";
import "./StartupSplash.css";

const MIN_DISPLAY_MS = 1800;
const MAX_WAIT_MS = 8000;
const COMPLETION_HOLD_MS = 500;
const EXIT_DURATION_MS = 350;

const pendingMessages = {
  image: "우리 동네를 펼치고 있어요",
  map: "탐험할 지도를 준비하고 있어요",
  markets: "정겨운 시장을 찾고 있어요",
  stores: "골목 속 가게를 찾고 있어요",
  missions: "오늘의 미션을 준비하고 있어요",
};

function StartupSplash({ onComplete }) {
  const { tasks, reportTask } = useStartup();
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [completionShown, setCompletionShown] = useState(false);
  const readyCount = tasks.filter((task) => task.status === "ready").length;
  const progress = Math.round((readyCount / tasks.length) * 100);
  const pendingTask = tasks.find((task) => task.status === "pending");
  const hasErrors = tasks.some((task) => task.status === "error");
  const allSettled = !pendingTask;
  const isLeaving = minimumElapsed && (completionShown || timedOut);
  let message = pendingTask
    ? pendingMessages[pendingTask.id]
    : "준비 완료! 우리 동네로 출발해요";

  if (timedOut && pendingTask) {
    message = "조금 늦어지고 있어요. 먼저 화면을 열게요";
  } else if (!pendingTask && hasErrors) {
    message = "일부 정보는 화면에서 다시 불러올 수 있어요";
  }

  useEffect(() => {
    const minimumTimer = window.setTimeout(() => setMinimumElapsed(true), MIN_DISPLAY_MS);
    const deadlineTimer = window.setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => {
      window.clearTimeout(minimumTimer);
      window.clearTimeout(deadlineTimer);
    };
  }, []);

  useEffect(() => {
    if (!allSettled) return;
    const completionTimer = window.setTimeout(() => setCompletionShown(true), COMPLETION_HOLD_MS);
    return () => window.clearTimeout(completionTimer);
  }, [allSettled]);

  useEffect(() => {
    if (!isLeaving) return;
    const exitTimer = window.setTimeout(onComplete, EXIT_DURATION_MS);
    return () => window.clearTimeout(exitTimer);
  }, [isLeaving, onComplete]);

  return (
    <section
      className={`startup-splash${isLeaving ? " is-leaving" : ""}`}
      aria-label="누리고 시작 화면"
      style={{ "--splash-exit-duration": `${EXIT_DURATION_MS}ms` }}
    >
      <img
        className="startup-splash__background"
        src={loadingImage}
        alt="누리고, 전통시장에서 만나는 우리 동네의 즐거움"
        width="1308"
        height="681"
        fetchPriority="high"
        draggable="false"
        onLoad={() => reportTask("image", "ready")}
        onError={() => reportTask("image", "error")}
      />
      <div className="startup-splash__shade" aria-hidden="true" />

      <div className="startup-splash__loader">
        <div className="startup-splash__character" aria-hidden="true">
          <img src="/nurigo-location.png" alt="" width="88" height="106" draggable="false" />
          <span className="startup-splash__character-shadow" />
        </div>
        <div
          className="startup-splash__track"
          role="progressbar"
          aria-label="누리고 로딩 진행률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-valuetext={`${tasks.length}개 준비 단계 중 ${readyCount}개 완료`}
        >
          <span className="startup-splash__progress" style={{ width: `${progress}%` }} />
        </div>
        <div className="startup-splash__caption" aria-hidden="true">
          <span>{progress === 100 ? "READY" : "LOADING"}</span>
          <span>{progress}%</span>
        </div>
        <p className="startup-splash__sr-only" role="status">{message}</p>
      </div>
    </section>
  );
}

export default StartupSplash;
