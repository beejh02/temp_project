import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import MissionIcon from "../components/MissionIcon";
import MissionPageHeader from "../components/MissionPageHeader";
import useMissionDemo from "../hooks/useMissionDemo";
import { apiFetch } from "../utils/api";

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
  const [reloadKey, setReloadKey] = useState(0);
  const loadedPeriodRef = useRef(null);
  const { loadStatus, errorMessage, refreshMissions } = useMissionDemo();
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
        const response = await apiFetch(
          `/api/missions/rankings?period=${periodType}`,
          {
            signal: abortController.signal,
          },
        );
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || `랭킹 조회 실패: ${response.status}`,
          );
        }

        if (
          !data
          || !data.currentUser
          || !Array.isArray(data.leaders)
        ) {
          throw new Error("랭킹 응답 형식이 올바르지 않습니다.");
        }

        if (!disposed) {
          setRanking(data);
          setRankingStatus("success");
          setRankingError("");
          loadedPeriodRef.current = periodType;
        }
      } catch (error) {
        if (!disposed && error.name !== "AbortError") {
          setRankingError(error.message || "랭킹을 불러오지 못했습니다.");

          if (loadedPeriodRef.current !== periodType) {
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
  }, [loadStatus, periodType, reloadKey]);

  const handleRetry = () => {
    if (loadStatus === "error") {
      refreshMissions();
      return;
    }

    setRankingError("");
    setRankingStatus(ranking ? "success" : "loading");
    setReloadKey((current) => current + 1);
  };

  return (
    <main className="mission-subpage">
      <div className="mission-subpage__content">
        <MissionPageHeader
          eyebrow="NURIGO RANKING"
          title="참여 포인트 순위"
          description="미션으로 모은 NP와 내 참여 순위를 확인해요."
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
            <button
              type="button"
              className="mission-retry-action"
              onClick={handleRetry}
            >
              다시 시도
            </button>
          </section>
        )}

        {displayStatus === "success" && ranking && (
          <RankingContent ranking={ranking} periodLabel={RANKING_PERIODS[periodType]} />
        )}

        {displayStatus === "success" && rankingError && (
          <section className="mission-subpage-refresh-error" role="alert">
            <span>{rankingError}</span>
            <button
              type="button"
              className="mission-retry-action"
              onClick={handleRetry}
            >
              다시 시도
            </button>
          </section>
        )}

        <aside className="ranking-note">
          미션 보상을 받으면 획득 포인트가 순위에 반영돼요.
          다음 점포를 방문하며 시장 탐험을 이어가 보세요.
        </aside>
      </div>
    </main>
  );
}

function RankingContent({ ranking, periodLabel }) {
  return (
    <>
      <section className="my-ranking-card" aria-labelledby="my-ranking-title">
        <header>
          <h2 id="my-ranking-title">내 참여 순위</h2>
          <span>{ranking.currentUser.nickname}</span>
        </header>
        <dl>
          <div>
            <dt>{periodLabel} 획득 포인트</dt>
            <dd>{ranking.currentUser.points.toLocaleString()} NP</dd>
          </div>
          <div>
            <dt>{periodLabel} 순위</dt>
            <dd>{ranking.currentUser.rank}위</dd>
          </div>
        </dl>
      </section>

      <nav className="mission-detail-actions" aria-label="미션 계속하기">
        <Link className="mission-primary-action" to="/">지도에서 미션 이어가기</Link>
        <Link className="mission-secondary-action" to="/missions">오늘의 미션 보기</Link>
      </nav>

      <section className="ranking-board">
        <div className="ranking-board__heading">
          <div>
            <span>{ranking.label.toUpperCase()}</span>
            <h2>상위 참여자</h2>
          </div>
          <time>{ranking.period}</time>
        </div>

        {ranking.leaders.length === 0 ? (
          <p className="ranking-empty">집계된 참여자가 아직 없어요.</p>
        ) : (
          <ol>
            {ranking.leaders.map((entry) => (
              <li
                key={`${entry.rank}-${entry.nickname}`}
                className={entry.rank <= 3 ? `is-top-${entry.rank}` : ""}
              >
                <span className="ranking-position">
                  {entry.rank <= 3
                    ? <MissionIcon type="trophy" />
                    : entry.rank}
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
        )}
      </section>
    </>
  );
}

export default MissionRankingsPage;
