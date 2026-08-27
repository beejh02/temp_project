import MissionIcon from "../components/MissionIcon";
import MissionPageHeader from "../components/MissionPageHeader";
import {
  missionCategoryGuides,
  MISSION_STATUS,
  MISSION_STATUS_LABEL,
} from "../data/demoMissions";

import "./MissionSubpage.css";

function MissionGuidePage() {
  return (
    <main className="mission-subpage">
      <div className="mission-subpage__content">
        <MissionPageHeader
          eyebrow="MISSION GUIDE"
          title="어떤 미션이 있나요?"
          description="실제 배정 목록 대신 미션 유형과 시장에 주는 효과를 확인해 보세요."
        />

        <section className="mission-guide-grid">
          {missionCategoryGuides.map((guide) => (
            <article key={guide.id}>
              <span>
                <MissionIcon type={guide.icon} />
              </span>
              <div>
                <h2>{guide.title}</h2>
                <p>{guide.description}</p>
                <small>{guide.example}</small>
              </div>
            </article>
          ))}
        </section>

        <section className="mission-status-guide">
          <div className="mission-section-heading">
            <span>STATUS</span>
            <h2>미션 상태 안내</h2>
            <p>진행부터 보상 수령, 마감까지 한눈에 구분할 수 있어요.</p>
          </div>
          <div className="mission-status-list">
            {Object.values(MISSION_STATUS).map((status) => (
              <div key={status}>
                <span className={`mission-status is-${status}`}>
                  {MISSION_STATUS_LABEL[status]}
                </span>
                <p>{getStatusDescription(status)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function getStatusDescription(status) {
  const descriptions = {
    [MISSION_STATUS.AVAILABLE]: "오늘 바로 수행할 수 있어요.",
    [MISSION_STATUS.IN_PROGRESS]: "위치나 방문 기록을 확인하고 있어요.",
    [MISSION_STATUS.COMPLETED]: "조건을 달성해 보상을 받을 수 있어요.",
    [MISSION_STATUS.CLAIMED]: "포인트가 지급된 미션이에요.",
    [MISSION_STATUS.CLOSED]: "기간이 끝났거나 선착순 인원이 찼어요.",
  };

  return descriptions[status];
}

export default MissionGuidePage;
