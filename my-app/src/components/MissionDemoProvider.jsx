import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { apiFetch } from "../utils/api";
import MissionDemoContext from "../contexts/missionDemoContext";

const MISSION_POLLING_MS = 7500;

const initialState = {
  missions: [],
  loadStatus: "loading",
  errorMessage: "",
  pendingMissionId: null,
};

function missionDemoReducer(state, action) {
  if (action.type === "load") {
    return { ...state, loadStatus: "loading", errorMessage: "" };
  }

  if (action.type === "replace") {
    return {
      ...state,
      missions: action.missions,
      loadStatus: "success",
      errorMessage: "",
    };
  }

  if (action.type === "load-error") {
    return {
      ...state,
      loadStatus: "error",
      errorMessage: action.message,
    };
  }

  if (action.type === "operation-start") {
    return {
      ...state,
      pendingMissionId: String(action.missionId),
      errorMessage: "",
    };
  }

  if (action.type === "operation-success") {
    return {
      ...state,
      pendingMissionId: null,
      missions: state.missions.map((mission) =>
        String(mission.id) === String(action.mission.id)
          ? action.mission
          : mission,
      ),
    };
  }

  if (action.type === "operation-error") {
    return {
      ...state,
      pendingMissionId: null,
      errorMessage: action.message,
    };
  }

  if (action.type === "refresh-error") {
    return {
      ...state,
      errorMessage: action.message,
    };
  }

  return state;
}

async function requestJson(url, options) {
  const response = await apiFetch(url, {
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `미션 요청 실패: ${response.status}`);
  }

  return data;
}

function MissionDemoProvider({ children }) {
  const [state, dispatch] = useReducer(missionDemoReducer, initialState);
  const locationQueueRef = useRef(Promise.resolve());
  const requestVersionRef = useRef(0);

  const loadMissions = useCallback(async ({ silent = false } = {}) => {
    const requestVersion = ++requestVersionRef.current;

    if (!silent) {
      dispatch({ type: "load" });
    }

    try {
      const missions = await requestJson("/api/missions/daily");

      if (!Array.isArray(missions)) {
        throw new Error("미션 목록 응답 형식이 올바르지 않습니다.");
      }

      if (requestVersion === requestVersionRef.current) {
        dispatch({ type: "replace", missions });
      }
    } catch (error) {
      if (requestVersion === requestVersionRef.current) {
        dispatch({
          type: silent ? "refresh-error" : "load-error",
          message: error.message || "미션 목록을 불러오지 못했습니다.",
        });
      }
    }
  }, []);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  useEffect(() => {
    let disposed = false;
    let timerId = null;
    let polling = false;

    const scheduleNext = () => {
      if (!disposed) {
        timerId = window.setTimeout(poll, MISSION_POLLING_MS);
      }
    };

    const poll = async () => {
      if (polling) {
        return;
      }

      polling = true;

      if (document.visibilityState !== "hidden") {
        await loadMissions({ silent: true });
      }

      polling = false;
      scheduleNext();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        window.clearTimeout(timerId);
        poll();
      }
    };

    scheduleNext();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      window.clearTimeout(timerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadMissions]);

  const runMissionAction = useCallback(async (missionId, action) => {
    ++requestVersionRef.current;
    dispatch({ type: "operation-start", missionId });

    try {
      const mission = await requestJson(
        `/api/missions/${missionId}/${action}`,
        { method: "POST" },
      );
      ++requestVersionRef.current;
      dispatch({ type: "operation-success", mission });

      return mission;
    } catch (error) {
      dispatch({
        type: "operation-error",
        message: error.message || "미션 상태를 변경하지 못했습니다.",
      });
      throw error;
    }
  }, []);

  const recordMissionLocation = useCallback((location) => {
    const request = locationQueueRef.current.then(async () => {
      ++requestVersionRef.current;
      const missions = await requestJson("/api/missions/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location),
      });

      if (!Array.isArray(missions)) {
        throw new Error("위치 판정 응답 형식이 올바르지 않습니다.");
      }

      ++requestVersionRef.current;
      dispatch({ type: "replace", missions });

      return missions;
    });

    locationQueueRef.current = request.catch((error) => {
      dispatch({
        type: "operation-error",
        message: error.message || "현재 위치를 판정하지 못했습니다.",
      });
    });

    return request;
  }, []);

  const value = useMemo(
    () => ({
      missions: state.missions,
      loadStatus: state.loadStatus,
      errorMessage: state.errorMessage,
      pendingMissionId: state.pendingMissionId,
      refreshMissions: loadMissions,
      recordMissionLocation,
      claimMissionReward: (missionId) => runMissionAction(missionId, "claim"),
    }),
    [state, loadMissions, recordMissionLocation, runMissionAction],
  );

  return (
    <MissionDemoContext.Provider value={value}>
      {children}
    </MissionDemoContext.Provider>
  );
}

export default MissionDemoProvider;
