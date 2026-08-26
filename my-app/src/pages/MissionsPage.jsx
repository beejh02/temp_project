import "./MissionsPage.css";

const dailyMissions = [
  {
    id: 1,
    category: "방문형",
    title: "오늘 중앙시장 최초 방문하기",
    status: "completed",
    statusText: "보상 수령 완료",
    reward: 5,
  },
  {
    id: 2,
    category: "탐색형",
    title: "지정 점포 방문하기",
    status: "progress",
    statusText: "진행중",
    reward: 7,
  },
];
const specialMissions = [
  {
    id: 3,
    category: "도전형",
    title: "3일 연속 시장 방문",
    status: "progress",
    statusText: "진행중",
    progressText: "2 / 3",
    reward: 5,
  },
];

function MissionsPage({ onMissionSelect, onRankingClick }) {
  const completedMissionCount = 1;
  const totalMissionCount = 4;
  const progress = (completedMissionCount / totalMissionCount) * 100;
  const handleMissionClick = (mission) => {
    if (onMissionSelect) {
      onMissionSelect(mission);
      return;
    }
    console.log("선택한 미션:", mission);
  };

  return (
    <main className="missions-page">
      <div className="missions-content">
        {/* 오늘의 미션 진행 상황 */}
        <section className="mission-summary">
          <div className="mission-summary-header">
            <div>
              <span className="summary-label">TODAY</span>
              <h1>오늘의 미션</h1>
            </div>
            <strong className="summary-count">
              {completedMissionCount}/{totalMissionCount}
            </strong>
          </div>

          <div className="mission-summary-progress">
            <div
              className="mission-summary-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="summary-description">
            오늘의 미션을 완료하고 NP를 모아보세요.
          </p>
        </section>

        {/* 랭킹 */}
        <div className="ranking-row">
          <button
            type="button"
            className="ranking-button"
            onClick={onRankingClick}
          >
            랭킹 보기
            <span>→</span>
          </button>
        </div>

        {/* Daily Mission */}
        <section className="missions-section">
          <div className="section-title">
            <div>
              <span className="section-subtitle">DAILY</span>
              <h2>Daily Mission</h2>
            </div>

            <span className="section-count">{dailyMissions.length}</span>
          </div>

          <div className="mission-list">
            {dailyMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onClick={() => handleMissionClick(mission)}
              />
            ))}
          </div>
        </section>

        {/* Special Mission */}
        <section className="missions-section">
          <div className="section-title">
            <div>
              <span className="section-subtitle">SPECIAL</span>
              <h2>Special Mission</h2>
            </div>
          </div>
          <div className="mission-list">
            {specialMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                special
                onClick={() => handleMissionClick(mission)}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function MissionCard({ mission, special = false, onClick }) {
  const isCompleted = mission.status === "completed";
  return (
    <article
      className={[
        "mission-card",
        special ? "special-card" : "",
        isCompleted ? "completed-card" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mission-card-header">
        <span className="mission-category">{mission.category}</span>
        <span className={`mission-status ${mission.status}`}>
          {mission.statusText}
          {mission.progressText && <span> {mission.progressText}</span>}
        </span>
      </div>

      <h3>{mission.title}</h3>
      <div className="mission-card-footer">
        <span className="mission-reward">+ {mission.reward} NP</span>
        <button
          type="button"
          className="mission-detail-button"
          onClick={onClick}
        >
          상세보기
          <span>→</span>
        </button>
      </div>
    </article>
  );
}

export default MissionsPage;
