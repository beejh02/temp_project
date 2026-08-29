import { useEffect, useState } from "react";

import MissionIcon from "../components/MissionIcon";
import MissionPageHeader from "../components/MissionPageHeader";
import useMissionDemo from "../hooks/useMissionDemo";

import "./MissionSubpage.css";

const RANKING_PERIODS = {
  weekly: "주간",
  monthly: "월간",
};

const RANKING_POLLING_MS = 7500;

function MissionRankingsPage() {
  const [periodType, setPeriodType] = useState("weekly");
  const [ranking, setRanking] = useState(null);
  const [rankingStatus, setRankingStatus] = useState("loading");
  const [rankingError, setRankingError] = useState("");
  const { loadStatus, errorMessage } = useMissionDemo();
  const displayStatus = loadStatus === "error" ? "error" : rankingStatus;
  const displayError = loadStatus === "error"
    ? errorMessage || "미션 서버에 연결할 수 없습니다."
    : rankingError;

  useEffect(() => {
    if (loadStatus !== "success") {
      return undefined;
    }

    let disposed = false;
    let timerId = null;
    let abortController = null;
    let loading = false;
    let hasLoaded = false;

    const scheduleNext = () => {
      if (!disposed) {
        timerId = window.setTimeout(loadRanking, RANKING_POLLING_MS);
      }
    };

    const loadRanking = async (showLoading = false) => {
      if (loading) {
        return;
      }

      if (document.visibilityState === "hidden") {
        scheduleNext();
        return;
      }

      loading = true;
      abortController = new AbortController();

      if (showLoading) {
        setRankingStatus("loading");
        setRankingError("");
      }

      try {
        const response = await fetch(
          `/api/missions/rankings?period=${periodType}`,
          {
            credentials: "same-origin",
            signal: abortController.signal,
          },
        );
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || `랭킹 조회 실패: ${response.status}`,
          );
        }

        if (!disposed) {
          setRanking(data);
          setRankingStatus("success");
          setRankingError("");
          hasLoaded = true;
        }
      } catch (error) {
        if (!disposed && error.name !== "AbortError") {
          setRankingError(error.message || "랭킹을 불러오지 못했습니다.");

          if (!hasLoaded) {
            setRankingStatus("error");
          }
        }
      } finally {
        loading = false;
        scheduleNext();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        window.clearTimeout(timerId);
        loadRanking();
      }
    };

    loadRanking(true);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      window.clearTimeout(timerId);
      abortController?.abort();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadStatus, periodType]);

  return (
    <main className="mission-subpage">
      <div className="mission-subpage__content">
        <MissionPageHeader
          eyebrow="NURIGO RANKING"
          title="참여 포인트 순위"
          description="현재 서버 실행 중 획득한 포인트를 기준으로 집계해요."
        />

        <div
          className="ranking-tabs"
          role="tablist"
          aria-label="순위 집계 기간"
        >
          {Object.entries(RANKING_PERIODS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={periodType === key}
              className={periodType === key ? "is-active" : ""}
              onClick={() => setPeriodType(key)}
            >
              {label} 순위
            </button>
          ))}
        </div>

        {displayStatus === "loading" && (
          <section className="mission-empty-card" aria-live="polite">
            <MissionIcon type="clock" />
            <p>랭킹을 불러오고 있어요.</p>
          </section>
        )}

        {displayStatus === "error" && (
          <section className="mission-empty-card" role="alert">
            <MissionIcon type="info" />
            <p>{displayError}</p>
          </section>
        )}

        {displayStatus === "success" && ranking && (
          <RankingContent ranking={ranking} />
        )}

        {displayStatus === "success" && rankingError && (
          <p className="mission-refresh-error" role="alert">
            {rankingError}
          </p>
        )}

        <aside className="ranking-note">
          랭킹과 미션 진행 상태는 백엔드 서버를 다시 시작하면 새로
          구성됩니다.
        </aside>
      </div>
    </main>
  );
}

function RankingContent({ ranking }) {
  return (
    <>
      <section className="my-ranking-card">
        <div>
          <span>MY RANK</span>
          <strong>{ranking.currentUser.rank}위</strong>
        </div>
        <div>
          <strong>{ranking.currentUser.nickname}</strong>
          <span>{ranking.currentUser.points.toLocaleString()} NP</span>
        </div>
      </section>

      <section className="ranking-board">
        <div className="ranking-board__heading">
          <div>
            <span>{ranking.label.toUpperCase()}</span>
            <h2>상위 참여자</h2>
          </div>
          <time>{ranking.period}</time>
        </div>

        <ol>
          {ranking.leaders.map((entry) => (
            <li
              key={`${entry.rank}-${entry.nickname}`}
              className={entry.rank <= 3 ? `is-top-${entry.rank}` : ""}
            >
              <span className="ranking-position">
                {entry.rank <= 3 ? <MissionIcon type="trophy" /> : entry.rank}
              </span>
              <div className="ranking-avatar">
                {entry.nickname.slice(0, 1)}
              </div>
              <strong>{entry.nickname}</strong>
              <span className="ranking-points">
                {entry.points.toLocaleString()} NP
              </span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

export default MissionRankingsPage;
