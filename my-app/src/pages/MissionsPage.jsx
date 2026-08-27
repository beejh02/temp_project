import { Link } from "react-router-dom";

import {
  isMissionFinished,
  MISSION_CATEGORY_LABEL,
  MISSION_GROUP,
  MISSION_STATUS,
  MISSION_STATUS_LABEL,
} from "../data/demoMissions";
import useMissionDemo from "../hooks/useMissionDemo";

import "./MissionsPage.css";

function MissionsPage() {
  const { missions } = useMissionDemo();
  const dailyMissions = missions.filter(
    (mission) => mission.group === MISSION_GROUP.DAILY,
  );
  const specialMissions = missions.filter(
    (mission) => mission.group === MISSION_GROUP.SPECIAL,
  );
  const completedMissionCount = missions.filter((mission) =>
    isMissionFinished(mission.status),
  ).length;
  const totalMissionCount = missions.length;
  const progress = totalMissionCount === 0
    ? 0
    : (completedMissionCount / totalMissionCount) * 100;

  return (
    <main className="missions-page">
      <div className="missions-content">
        <section className="mission-summary" aria-labelledby="today-mission-title">
          <div className="mission-summary-header">
            <div>
              <span className="summary-label">TODAY</span>
              <h1 id="today-mission-title">오늘의 미션</h1>
            </div>
            <strong className="summary-count">
              {completedMissionCount}/{totalMissionCount}
            </strong>
          </div>

          <div
            className="mission-summary-progress"
            role="progressbar"
            aria-label="오늘의 미션 완료율"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(progress)}
          >
            <div
              className="mission-summary-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="summary-description">
            오늘의 미션을 완료하고 NP를 모아보세요.
          </p>
        </section>

        <div className="ranking-row">
          <Link className="ranking-button" to="/missions/rankings">
            랭킹 보기
            <span>→</span>
          </Link>
        </div>

        <MissionSection
          eyebrow="DAILY"
          title="Daily Mission"
          missions={dailyMissions}
        />

        <MissionSection
          eyebrow="SPECIAL"
          title="Special Mission"
          missions={specialMissions}
          special
        />
      </div>
    </main>
  );
}

function MissionSection({ eyebrow, title, missions, special = false }) {
  return (
    <section className="missions-section">
      <div className="section-title">
        <div>
          <span className="section-subtitle">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <span className="section-count">{missions.length}</span>
      </div>

      <div className="mission-list">
        {missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} special={special} />
        ))}
      </div>
    </section>
  );
}

function MissionCard({ mission, special = false }) {
  const isClaimed = mission.status === MISSION_STATUS.CLAIMED;
  const statusClassName = getStatusClassName(mission.status);

  return (
    <article
      className={[
        "mission-card",
        special ? "special-card" : "",
        isClaimed ? "completed-card" : "",
      ].filter(Boolean).join(" ")}
    >
      <div className="mission-card-header">
        <span className="mission-category">
          {MISSION_CATEGORY_LABEL[mission.category]}
        </span>
        <span className={`mission-status ${statusClassName}`}>
          {MISSION_STATUS_LABEL[mission.status]}
          {mission.id === 3 && <span> {mission.progress.label}</span>}
        </span>
      </div>

      <h3>{mission.title}</h3>

      <div className="mission-card-footer">
        <span className="mission-reward">+ {mission.reward} NP</span>
        <Link className="mission-detail-button" to={`/missions/${mission.id}`}>
          상세보기
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}

function getStatusClassName(status) {
  if (status === MISSION_STATUS.IN_PROGRESS) {
    return "progress";
  }

  if ([MISSION_STATUS.COMPLETED, MISSION_STATUS.CLAIMED].includes(status)) {
    return "completed";
  }

  return status;
}

export default MissionsPage;
