import MissionIcon from "../components/MissionIcon";
import MissionPageHeader from "../components/MissionPageHeader";
import {
  demoChallengeRecords,
  MISSION_STATUS_LABEL,
} from "../data/demoMissions";

import "./MissionSubpage.css";

function MissionChallengesPage() {
  return (
    <main className="mission-subpage">
      <div className="mission-subpage__content">
        <MissionPageHeader
          eyebrow="CHALLENGE RECORD"
          title="도전 기록"
          description="데일리 미션과 별도로 여러 날의 누적 진행을 확인해요."
        />

        {demoChallengeRecords.map((challenge) => {
          const progress = (challenge.current / challenge.target) * 100;

          return (
            <article className="challenge-record" key={challenge.id}>
              <div className="challenge-record__top">
                <span><MissionIcon type="flag" /></span>
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
                  <div className={visit.completed ? "is-completed" : ""} key={visit.day}>
                    <span>{visit.completed ? <MissionIcon type="check" /> : visit.day.slice(0, 1)}</span>
                    <strong>{visit.day}</strong>
                    <small>{visit.date}</small>
                  </div>
                ))}
              </div>

              <div className="challenge-record__reward">
                <span>완주 보상</span>
                <strong><MissionIcon type="coin" />{challenge.reward.toLocaleString()} NP</strong>
              </div>
            </article>
          );
        })}

        <aside className="challenge-tip">
          <MissionIcon type="info" />
          <p>방문 기록은 하루 한 번만 인정되며, 자정이 지나면 다음 날 기록으로 이어져요.</p>
        </aside>
      </div>
    </main>
  );
}

export default MissionChallengesPage;
