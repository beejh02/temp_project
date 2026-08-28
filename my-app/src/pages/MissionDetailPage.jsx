import { Link, useNavigate, useParams } from "react-router-dom";

import MissionIcon from "../components/MissionIcon";
import MissionPageHeader from "../components/MissionPageHeader";
import {
  findDemoMission,
  MISSION_CATEGORY_LABEL,
  MISSION_STATUS,
  MISSION_STATUS_LABEL,
  MISSION_TARGET_TYPE,
} from "../data/demoMissions";
import useMissionDemo from "../hooks/useMissionDemo";

import "./MissionSubpage.css";

function MissionDetailPage() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const {
    missions,
    loadStatus,
    errorMessage,
    pendingMissionId,
    refreshMissions,
    completeMission,
    claimMissionReward,
  } = useMissionDemo();
  const mission = findDemoMission(missionId, missions);

  if (loadStatus === "loading") {
    return (
      <main className="mission-subpage">
        <div className="mission-subpage__content">
          <MissionPageHeader eyebrow="MISSION" title="미션을 불러오는 중이에요" />
          <section className="mission-empty-card" aria-live="polite">
            <MissionIcon type="clock" />
            <p>서버의 미션 상태를 확인하고 있습니다.</p>
          </section>
        </div>
      </main>
    );
  }

  if (loadStatus === "error") {
    return (
      <main className="mission-subpage">
        <div className="mission-subpage__content">
          <MissionPageHeader eyebrow="MISSION" title="미션을 불러오지 못했어요" />
          <section className="mission-empty-card" role="alert">
            <MissionIcon type="info" />
            <p>{errorMessage}</p>
            <button type="button" onClick={refreshMissions}>
              다시 시도
            </button>
          </section>
        </div>
      </main>
    );
  }

  if (!mission) {
    return (
      <main className="mission-subpage">
        <div className="mission-subpage__content">
          <MissionPageHeader eyebrow="MISSION" title="미션을 찾을 수 없어요" />
          <section className="mission-empty-card">
            <MissionIcon type="info" />
            <p>오늘 배정된 미션인지 다시 확인해 주세요.</p>
            <Link to="/missions">오늘의 미션으로 돌아가기</Link>
          </section>
        </div>
      </main>
    );
  }

  const progress = Math.min(
    100,
    Math.round((mission.progress.current / mission.progress.target) * 100),
  );
  const isCompleted = mission.status === MISSION_STATUS.COMPLETED;
  const isClaimed = mission.status === MISSION_STATUS.CLAIMED;
  const isClosed = mission.status === MISSION_STATUS.CLOSED;

  const handlePrimaryAction = async () => {
    try {
      if (isCompleted) {
        await claimMissionReward(mission.id);
        return;
      }

      if (!isClaimed && !isClosed) {
        await completeMission(mission.id);
      }
    } catch {
      // 오류 메시지는 공통 미션 상태 컨텍스트에서 화면에 표시합니다.
    }
  };

  const handleMapClick = () => {
    const params = new URLSearchParams({ missionId: String(mission.id) });

    if (mission.target.type === MISSION_TARGET_TYPE.STORE) {
      params.set("storeId", String(mission.target.storeId));
    } else {
      params.set("marketId", String(mission.target.marketId));
    }

    navigate(`/?${params.toString()}`);
  };

  return (
    <main className="mission-subpage">
      <div className="mission-subpage__content">
        <MissionPageHeader eyebrow="MISSION DETAIL" title="미션 상세" />

        <section className="mission-detail-hero">
          <div className="mission-detail-hero__badges">
            <span>{MISSION_CATEGORY_LABEL[mission.category]}</span>
            <span className={`mission-status is-${mission.status}`}>
              {MISSION_STATUS_LABEL[mission.status]}
            </span>
          </div>
          <h2>{mission.title}</h2>
          {mission.shared && <small>모든 접속자가 진행도를 공유하는 공동 미션</small>}
          <p>{mission.description}</p>
          <div className="mission-detail-reward">
            <MissionIcon type="coin" />
            <span>완료 보상</span>
            <strong>{mission.reward.toLocaleString()} NP</strong>
          </div>
        </section>

        {isClaimed && (
          <section className="reward-result" aria-live="polite">
            <span>
              <MissionIcon type="check" />
            </span>
            <div>
              <small>REWARD RECEIVED</small>
              <h2>{mission.reward.toLocaleString()} NP를 받았어요!</h2>
              <p>미션 보상이 정상적으로 지급됐어요.</p>
            </div>
          </section>
        )}

        {errorMessage && (
          <section className="mission-empty-card" role="alert">
            <MissionIcon type="info" />
            <p>{errorMessage}</p>
          </section>
        )}

        <section className="mission-detail-card">
          <div className="mission-detail-card__title">
            <h3>진행 상황</h3>
            <strong>{mission.progress.label}</strong>
          </div>
          <div
            className="mission-detail-progress"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          {mission.availability.remainingSlots != null && (
            <p className="mission-detail-alert">
              <MissionIcon type="flag" />총 {mission.availability.capacity}명 중
              남은 자리 {mission.availability.remainingSlots}개
            </p>
          )}
        </section>

        <section className="mission-detail-card">
          <h3>방문할 곳</h3>
          <div className="mission-target">
            <span>
              <MissionIcon type="pin" />
            </span>
            <div>
              <strong>{mission.target.name}</strong>
              <small>{mission.target.address}</small>
            </div>
            <button type="button" onClick={handleMapClick}>
              지도 보기
            </button>
          </div>
        </section>

        <section className="mission-detail-card mission-detail-info">
          <h3>완료 방법</h3>
          <p>
            <MissionIcon type="check" />
            {mission.verificationLabel}
          </p>
          <p>
            <MissionIcon type="clock" />
            {mission.availability.endsAtLabel}
          </p>
        </section>

        <aside className="mission-impact-note">
          <MissionIcon type="spark" />
          <div>
            <strong>이 미션이 시장에 주는 변화</strong>
            <p>{mission.activationReason}</p>
          </div>
        </aside>

        <div className="mission-detail-actions">
          <button
            type="button"
            className="mission-secondary-action"
            onClick={handleMapClick}
          >
            지도에서 위치 보기
          </button>
          <button
            type="button"
            className="mission-primary-action"
            onClick={handlePrimaryAction}
            disabled={
              isClaimed
              || isClosed
              || pendingMissionId === String(mission.id)
            }
          >
            {pendingMissionId === String(mission.id)
              ? "처리 중..."
              : getActionLabel(mission.status)}
          </button>
        </div>
        {!isClaimed && !isClosed && (
          <p className="mission-demo-caption">
            데모에서는 위치 판정 결과를 버튼으로 재현합니다.
          </p>
        )}
      </div>
    </main>
  );
}

function getActionLabel(status) {
  if (status === MISSION_STATUS.COMPLETED) {
    return "보상 받기";
  }

  if (status === MISSION_STATUS.CLAIMED) {
    return "보상 수령 완료";
  }

  if (status === MISSION_STATUS.CLOSED) {
    return "마감된 미션";
  }

  return "방문 완료 데모";
}

export default MissionDetailPage;
