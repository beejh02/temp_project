import { useMemo, useReducer } from "react";

import MissionDemoContext from "../contexts/missionDemoContext";
import { demoMissions, MISSION_STATUS } from "../data/demoMissions";

const initialState = {
  missions: demoMissions.map((mission) => ({ ...mission })),
};

function missionDemoReducer(state, action) {
  if (action.type === "complete") {
    return {
      ...state,
      missions: state.missions.map((mission) => {
        if (
          String(mission.id) !== String(action.missionId)
          || [MISSION_STATUS.CLAIMED, MISSION_STATUS.CLOSED].includes(
            mission.status,
          )
        ) {
          return mission;
        }

        return {
          ...mission,
          status: MISSION_STATUS.COMPLETED,
          progress: {
            ...mission.progress,
            current: mission.progress.target,
            label: "완료 조건 달성",
          },
        };
      }),
    };
  }

  if (action.type === "claim") {
    const targetMission = state.missions.find(
      (mission) => String(mission.id) === String(action.missionId),
    );

    if (!targetMission || targetMission.status !== MISSION_STATUS.COMPLETED) {
      return state;
    }

    return {
      missions: state.missions.map((mission) =>
        String(mission.id) === String(action.missionId)
          ? { ...mission, status: MISSION_STATUS.CLAIMED }
          : mission,
      ),
    };
  }

  return state;
}

function MissionDemoProvider({ children }) {
  const [state, dispatch] = useReducer(missionDemoReducer, initialState);

  const value = useMemo(
    () => ({
      missions: state.missions,
      completeMission: (missionId) => dispatch({ type: "complete", missionId }),
      claimMissionReward: (missionId) => dispatch({ type: "claim", missionId }),
    }),
    [state],
  );

  return (
    <MissionDemoContext.Provider value={value}>
      {children}
    </MissionDemoContext.Provider>
  );
}

export default MissionDemoProvider;
