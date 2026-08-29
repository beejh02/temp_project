import { useEffect, useRef, useState } from "react";
import { apiUrl } from "../utils/api";
import MissionIcon from "../components/MissionIcon";
import MissionPageHeader from "../components/MissionPageHeader";
import { MISSION_STATUS, MISSION_STATUS_LABEL } from "../data/missionConstants";

import "./MissionSubpage.css";

const CHALLENGE_POLLING_MS = 7500;

async function requestJson(url, options) {
  const response = await fetch(apiUrl, {
    credentials: "same-origin",
    ...options,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `도전 기록 요청 실패: ${response.status}`);
  }

  return data;
}

function MissionChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingChallengeId, setPendingChallengeId] = useState(null);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    let disposed = false;
    let timerId = null;
    let abortController = null;
    let loading = false;
    let hasLoaded = false;

    const scheduleNext = () => {
      if (!disposed) {
        timerId = window.setTimeout(loadChallenges, CHALLENGE_POLLING_MS);
      }
    };

    const loadChallenges = async () => {
      if (loading) {
        return;
      }

      if (document.visibilityState === "hidden") {
        scheduleNext();
        return;
      }

      loading = true;
      const requestVersion = ++requestVersionRef.current;
      abortController = new AbortController();

      try {
        const data = await requestJson("/api/missions/challenges", {
          signal: abortController.signal,
        });

        if (!Array.isArray(data)) {
          throw new Error("도전 기록 응답 형식이 올바르지 않습니다.");
        }

        if (!disposed && requestVersion === requestVersionRef.current) {
          setChallenges(data);
          setStatus("success");
          setErrorMessage("");
          hasLoaded = true;
        }
      } catch (error) {
        if (!disposed && error.name !== "AbortError") {
          setErrorMessage(error.message || "도전 기록을 불러오지 못했습니다.");

          if (!hasLoaded) {
            setStatus("error");
          }
        }
      } finally {
        loading = false;
        scheduleNext();
      }
    };

    loadChallenges();

    return () => {
      disposed = true;
      window.clearTimeout(timerId);
      abortController?.abort();
    };
  }, []);

  const handleClaim = async (challengeId) => {
    ++requestVersionRef.current;
    setPendingChallengeId(challengeId);
    setErrorMessage("");

    try {
      const updated = await requestJson(
        `/api/missions/challenges/${challengeId}/claim`,
        { method: "POST" },
      );

      ++requestVersionRef.current;
      setChallenges((current) =>
        current.map((challenge) =>
          challenge.id === updated.id ? updated : challenge,
        ),
      );
    } catch (error) {
      setErrorMessage(error.message || "도전 보상을 받지 못했습니다.");
    } finally {
      setPendingChallengeId(null);
    }
  };

  return (
    <main className="mission-subpage">
      <div className="mission-subpage__content">
        <MissionPageHeader
          eyebrow="CHALLENGE RECORD"
          title="도전 기록"
          description="데일리 미션과 별도로 여러 날의 누적 진행을 확인해요."
        />

        {status === "loading" && (
          <section className="mission-empty-card" aria-live="polite">
            <MissionIcon type="clock" />
            <p>도전 기록을 불러오고 있어요.</p>
          </section>
        )}

        {status === "error" && (
          <section className="mission-empty-card" role="alert">
            <MissionIcon type="info" />
            <p>{errorMessage}</p>
          </section>
        )}

        {status === "success" &&
          challenges.map((challenge) => (
            <ChallengeRecord
              challenge={challenge}
              key={challenge.id}
              pending={pendingChallengeId === challenge.id}
              onClaim={handleClaim}
            />
          ))}

        {status === "success" && errorMessage && (
          <p className="challenge-error" role="alert">
            {errorMessage}
          </p>
        )}

        <aside className="challenge-tip">
          <MissionIcon type="info" />
          <p>
            데모에서는 이전 이틀 기록을 준비하고, 오늘 시장 방문을 서버가
            확인하면 3일차가 완성됩니다. 서버를 다시 시작하면 기록도
            초기화됩니다.
          </p>
        </aside>
      </div>
    </main>
  );
}

function ChallengeRecord({ challenge, pending, onClaim }) {
  const progress = Math.min(100, (challenge.current / challenge.target) * 100);
  const canClaim = challenge.status === MISSION_STATUS.COMPLETED;

  return (
    <article className="challenge-record">
      <div className="challenge-record__top">
        <span>
          <MissionIcon type="flag" />
        </span>
        <span className={`mission-status is-${challenge.status}`}>
          {MISSION_STATUS_LABEL[challenge.status]}
        </span>
      </div>
      <h2>{challenge.title}</h2>
      <p>{challenge.description}</p>

      <div className="challenge-record__count">
        <strong>{challenge.current}</strong>
        <span>/ {challenge.target}일</span>
      </div>
      <div className="challenge-record__progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="challenge-visit-days">
        {challenge.visits.map((visit) => (
          <div
            className={visit.completed ? "is-completed" : ""}
            key={visit.day}
          >
            <span>
              {visit.completed ? (
                <MissionIcon type="check" />
              ) : (
                visit.day.slice(0, 1)
              )}
            </span>
            <strong>{visit.day}</strong>
            <small>{visit.date}</small>
          </div>
        ))}
      </div>

      <div className="challenge-record__reward">
        <span>완주 보상</span>
        <strong>
          <MissionIcon type="coin" />
          {challenge.reward.toLocaleString()} NP
        </strong>
      </div>

      <button
        type="button"
        className="challenge-claim-action"
        disabled={!canClaim || pending}
        onClick={() => onClaim(challenge.id)}
      >
        {pending
          ? "처리 중..."
          : challenge.status === MISSION_STATUS.CLAIMED
            ? "보상 수령 완료"
            : canClaim
              ? "완주 보상 받기"
              : "오늘 방문 기록 대기"}
      </button>
    </article>
  );
}

export default MissionChallengesPage;
