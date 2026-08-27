import { useState } from "react";

import MissionIcon from "../components/MissionIcon";
import MissionPageHeader from "../components/MissionPageHeader";
import { demoRankings } from "../data/demoMissions";

import "./MissionSubpage.css";

function MissionRankingsPage() {
  const [periodType, setPeriodType] = useState("weekly");
  const ranking = demoRankings[periodType];

  return (
    <main className="mission-subpage">
      <div className="mission-subpage__content">
        <MissionPageHeader
          eyebrow="NURIGO RANKING"
          title="참여 포인트 순위"
          description="미션으로 획득한 포인트를 기준으로 집계해요."
        />

        <div
          className="ranking-tabs"
          role="tablist"
          aria-label="순위 집계 기간"
        >
          {Object.entries(demoRankings).map(([key, item]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={periodType === key}
              className={periodType === key ? "is-active" : ""}
              onClick={() => setPeriodType(key)}
            >
              {item.label} 순위
            </button>
          ))}
        </div>

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
                key={entry.rank}
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

        <aside className="ranking-note">
          포인트를 사용해도 집계 기간에 획득한 참여 포인트는 순위에 그대로
          반영돼요.
        </aside>
      </div>
    </main>
  );
}

export default MissionRankingsPage;
