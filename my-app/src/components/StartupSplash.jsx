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
      <header className="startup-splash__header">
        <span className="startup-splash__brand">
          <svg viewBox="0 0 32 36" fill="none" aria-hidden="true">
            <path d="M29 14c0 10-13 20-13 20S3 24 3 14a13 13 0 0 1 26 0Z" fill="currentColor" />
            <path d="m10 14 4 4 8-9" stroke="#fff8e9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>누리고<small>NURIGO</small></span>
        </span>
        <span className="startup-splash__edition">우리 동네를 누리는 시간</span>
      </header>

      <div className="startup-splash__body">
        <div className="startup-splash__art">
          <img
            className="startup-splash__image"
            src={loadingImage}
            alt="누리고, 전통시장에서 만나는 우리 동네의 즐거움"
            width="1308"
            height="681"
            fetchPriority="high"
            draggable="false"
            onLoad={() => reportTask("image", "ready")}
            onError={() => reportTask("image", "error")}
          />
          <span className="startup-splash__art-caption" aria-hidden="true">
            익숙한 골목에서 만나는 새로운 발견
          </span>
        </div>

        <div className="startup-splash__intro">
          <p className="startup-splash__eyebrow"><span /> LET’S GO LOCAL</p>
          <h1>골목마다 발견하는<br /><em>작은 즐거움.</em></h1>
          <p className="startup-splash__description">
            정겨운 시장부터 새로운 단골 가게까지.<br />
            걷고, 발견하고, 오늘의 미션을 누려보세요.
          </p>

          <div className="startup-splash__loading">
            <div className="startup-splash__loading-heading">
              <span>{timedOut || (allSettled && hasErrors)
                ? "기본 화면으로 이동 중"
                : allSettled ? "탐험 준비 완료" : "동네 탐험 준비 중"}</span>
              <strong className="startup-splash__percent">{progress}<small>%</small></strong>
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
            <p className="startup-splash__status" role="status">{message}</p>
            <ol className="startup-splash__steps" aria-label="시작 준비 단계">
              {tasks.map((task) => (
                <li key={task.id} className={`is-${task.status}${task.id === pendingTask?.id ? " is-current" : ""}`}>
                  <span className="startup-splash__step-icon" aria-hidden="true">
                    {task.status === "ready" ? "✓" : task.status === "error" ? "!" : ""}
                  </span>
                  <span>{task.label}</span>
                  <span className="startup-splash__sr-only">
                    {task.status === "ready" ? " 완료" : task.status === "error" ? " 연결 실패" : " 준비 중"}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <footer className="startup-splash__footer">
        <span>발걸음이 닿는 곳마다, 누리고</span>
        <span className="startup-splash__footer-line" aria-hidden="true" />
        <span>YOUR NEIGHBORHOOD, REDISCOVERED</span>
      </footer>
    </section>
  );
}

export default StartupSplash;
