import { useCallback, useContext, useEffect, useRef, useState } from "react";
import MissionDemoContext from "../contexts/missionDemoContext";
import { safelyDetachNaverMapObject } from "../lib/naverMapCleanup";
import { apiFetch } from "../utils/api";
import { getMissionDemoStart } from "../utils/missionDemoLocation";
import { MISSION_STATUS_LABEL, isMissionFinished } from "../data/missionConstants";
import "./CurrentLocation.css";

const INITIAL_MOVE_STEP = 0.00005;
const MIN_MOVE_STEP = 0.000005;
const MAX_MOVE_STEP = 0.001;
const MISSION_LOCATION_HEARTBEAT_MS = 10000;
const MISSION_LOCATION_THROTTLE_MS = 1000;

/*
 * 현재 좌표가 어느 시장에 포함되는지 Backend에 조회
 */
async function fetchMarketsAtLocation(latitude, longitude) {
  try {
    const response = await apiFetch(
      `/api/markets/location?latitude=${latitude}&longitude=${longitude}`,
    );

    if (!response.ok) {
      throw new Error(`현재 위치 기반 시장 조회 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("현재 위치 기반 시장 조회 중 오류:", error);

    return null;
  }
}

function CurrentLocation({
  map,
  onMissionLocation,
  demoMissions,
  markets = [],
  focusedMissionId,
}) {
  const missionDemo = useContext(MissionDemoContext);
  const saveDemoLocation = missionDemo?.saveDemoLocation;
  const [restoredDemo] = useState(() => missionDemo?.demoLocation ?? null);
  const markerRef = useRef(null);
  const positionRef = useRef(restoredDemo?.position ?? null);
  const moveStepRef = useRef(restoredDemo?.moveStep ?? INITIAL_MOVE_STEP);
  const watchIdRef = useRef(null);
  const simulationModeRef = useRef(Boolean(restoredDemo));
  const lastMissionSubmissionAtRef = useRef(0);
  const pendingMissionLocationRef = useRef(null);
  const missionSubmissionTimerRef = useRef(null);
  const demoPanelRef = useRef(null);
  const [selectedDemoMissionId, setSelectedDemoMissionId] = useState(restoredDemo?.missionId ?? "");
  const [demoTargetName, setDemoTargetName] = useState(restoredDemo?.targetName ?? "");
  const selectedDemoMission = demoMissions?.find(
    ({ id }) => String(id) === (selectedDemoMissionId || focusedMissionId),
  ) || demoMissions?.find(
    ({ target, status }) => target.type === "store"
      && !isMissionFinished(status) && status !== "closed",
  ) || demoMissions?.[0];
  const demoStart = getMissionDemoStart(selectedDemoMission, markets);

  /*
   * 현재 들어가 있는 시장 ID
   * null = 현재 시장 외부
   */
  const currentMarketIdRef = useRef(null);

  /*진입 알림을 3초 뒤 제거하기 위한 Timer */
  const entryMessageTimerRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(restoredDemo
    ? "이전 시연 위치에서 이어갑니다. WASD 이동 · PageUp/Down 속도 조절"
    : "");
  const [messageType, setMessageType] = useState("status");
  const [entryMessage, setEntryMessage] = useState("");

  const showMessage = useCallback((text, type = "status") => {
    setMessage(text);
    setMessageType(type);
  }, []);

  const rememberDemoLocation = useCallback((
    missionId = selectedDemoMissionId,
    targetName = demoTargetName,
  ) => {
    if (simulationModeRef.current && positionRef.current) {
      saveDemoLocation?.({
        position: { ...positionRef.current },
        moveStep: moveStepRef.current,
        missionId,
        targetName,
      });
    }
  }, [saveDemoLocation, selectedDemoMissionId, demoTargetName]);

  const clearPendingLocation = () => {
    positionRef.current = null;
    pendingMissionLocationRef.current = null;
    window.clearTimeout(missionSubmissionTimerRef.current);
    missionSubmissionTimerRef.current = null;
    lastMissionSubmissionAtRef.current = 0;
  };

  const showPosition = useCallback((latitude, longitude, accuracy) => {
    positionRef.current = { lat: latitude, lng: longitude, accuracy };
    const position = new window.naver.maps.LatLng(latitude, longitude);

    if (markerRef.current) {
      markerRef.current.setPosition(position);
      markerRef.current.setMap(map);
    } else {
      markerRef.current = new window.naver.maps.Marker({ position, map });
    }

    map.panTo(position);
    map.setZoom(18);
  }, [map]);

  useEffect(() => {
    if (!map || !window.naver?.maps || markerRef.current || !positionRef.current) {
      return;
    }

    const { lat, lng, accuracy } = positionRef.current;
    showPosition(lat, lng, accuracy);
  }, [map, showPosition]);

  const submitMissionLocation = useCallback(
    (latitude, longitude, accuracy = 5) => {
      if (!onMissionLocation) {
        return;
      }

      const location = {
        latitude,
        longitude,
        accuracy,
        recordedAt: new Date().toISOString(),
      };
      const submit = (nextLocation) => {
        lastMissionSubmissionAtRef.current = Date.now();
        Promise.resolve(onMissionLocation(nextLocation)).catch((error) => {
          console.error("미션 위치 판정 중 오류:", error);
          showMessage(
            error.message || "현재 위치를 미션에 반영하지 못했습니다.",
            "error",
          );
        });
      };
      const elapsed = Date.now() - lastMissionSubmissionAtRef.current;

      if (elapsed >= MISSION_LOCATION_THROTTLE_MS) {
        pendingMissionLocationRef.current = null;
        window.clearTimeout(missionSubmissionTimerRef.current);
        missionSubmissionTimerRef.current = null;
        submit(location);
        return;
      }

      pendingMissionLocationRef.current = location;

      if (missionSubmissionTimerRef.current == null) {
        missionSubmissionTimerRef.current = window.setTimeout(() => {
          const pendingLocation = pendingMissionLocationRef.current;
          pendingMissionLocationRef.current = null;
          missionSubmissionTimerRef.current = null;

          if (pendingLocation) {
            submit(pendingLocation);
          }
        }, MISSION_LOCATION_THROTTLE_MS - elapsed);
      }
    },
    [onMissionLocation, showMessage],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!positionRef.current) {
        return;
      }

      const { lat, lng, accuracy = 5 } = positionRef.current;
      submitMissionLocation(lat, lng, accuracy);
    }, MISSION_LOCATION_HEARTBEAT_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [submitMissionLocation]);

  /* 현재 좌표의 시장 상태 확인 */
  const checkMarketEntry = useCallback(async (latitude, longitude) => {
    const markets = await fetchMarketsAtLocation(latitude, longitude);

    /*
     * API 오류가 발생한 경우
     * 기존 시장 상태는 변경하지 않는다.
     */
    if (markets === null) {
      return;
    }

    /* 현재 시장 외부 */
    if (markets.length === 0) {
      currentMarketIdRef.current = null;
      return;
    }

    /* MVP에서는 첫 번째 시장을 현재 시장으로 사용 */
    const market = markets[0];

    if (currentMarketIdRef.current === market.id) {
      return;
    }

    currentMarketIdRef.current = market.id;
    setEntryMessage(`${market.name}`);

    if (entryMessageTimerRef.current) {
      clearTimeout(entryMessageTimerRef.current);
    }

    /* 3초 후 알림 제거 */
    entryMessageTimerRef.current = setTimeout(() => {
      setEntryMessage("");
      entryMessageTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        safelyDetachNaverMapObject(markerRef.current);
        markerRef.current = null;
      }

      if (entryMessageTimerRef.current) {
        clearTimeout(entryMessageTimerRef.current);
      }

      if (missionSubmissionTimerRef.current) {
        clearTimeout(missionSubmissionTimerRef.current);
        missionSubmissionTimerRef.current = null;
      }

      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!map) {
        return;
      }

      const target = event.target;

      /*
       * input 등에 글자를 입력하고 있을 때는
       * 키보드 조작 기능을 실행하지 않는다.
       */
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "pageup") {
        event.preventDefault();
        moveStepRef.current = Math.min(moveStepRef.current * 2, MAX_MOVE_STEP);
        rememberDemoLocation();
        showMessage(`이동 속도 증가: ${moveStepRef.current.toFixed(6)}`);
        return;
      }

      if (key === "pagedown") {
        event.preventDefault();
        moveStepRef.current = Math.max(moveStepRef.current / 2, MIN_MOVE_STEP);
        rememberDemoLocation();
        showMessage(`이동 속도 감소: ${moveStepRef.current.toFixed(6)}`);
        return;
      }

      if (!positionRef.current || !markerRef.current) {
        return;
      }

      if (!["w", "a", "s", "d"].includes(key)) {
        return;
      }

      event.preventDefault();

      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      simulationModeRef.current = true;

      let { lat, lng } = positionRef.current;
      const moveStep = moveStepRef.current;

      switch (key) {
        case "w":
          lat += moveStep;
          break;
        case "s":
          lat -= moveStep;
          break;
        case "a":
          lng -= moveStep;
          break;
        case "d":
          lng += moveStep;
          break;
        default:
          return;
      }

      positionRef.current = {
        lat,
        lng,
        accuracy: 5,
      };
      rememberDemoLocation();

      const newPosition = new window.naver.maps.LatLng(lat, lng);

      markerRef.current.setPosition(newPosition);

      /*
       * WASD로 이동한 새 좌표를 기준으로
       * 현재 포함된 시장 조회
       */
      checkMarketEntry(lat, lng);
      submitMissionLocation(lat, lng);

      showMessage(
        `테스트 위치: ${lat.toFixed(6)}, ${lng.toFixed(6)} / 속도: ${moveStep.toFixed(6)}`,
      );
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [map, checkMarketEntry, showMessage, submitMissionLocation, rememberDemoLocation]);

  const handleDemoStart = () => {
    if (!map || !window.naver?.maps || !demoStart) {
      return;
    }

    simulationModeRef.current = true;
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    clearPendingLocation();
    currentMarketIdRef.current = null;
    setEntryMessage("");
    setIsLoading(false);
    moveStepRef.current = INITIAL_MOVE_STEP;
    setSelectedDemoMissionId(String(selectedDemoMission.id));
    setDemoTargetName(selectedDemoMission.target.name);

    const { latitude, longitude } = demoStart;
    showPosition(latitude, longitude, 5);
    rememberDemoLocation(String(selectedDemoMission.id), selectedDemoMission.target.name);
    checkMarketEntry(latitude, longitude);
    submitMissionLocation(latitude, longitude);
    showMessage("대상 남쪽에서 시작했어요. W 키로 접근하세요. WASD 이동 · PageUp/Down 속도 조절");
    demoPanelRef.current.open = false;
  };

  /* 현재 위치 가져오기 */
  const handleCurrentLocation = () => {
    if (!map) {
      showMessage("지도가 아직 준비되지 않았습니다.", "error");
      return;
    }

    if (!window.naver?.maps) {
      showMessage("네이버 지도 API를 불러오지 못했습니다.", "error");
      return;
    }

    clearPendingLocation();
    setDemoTargetName("");
    saveDemoLocation?.(null);
    simulationModeRef.current = false;
    if (!navigator.geolocation) {
      showMessage(
        "현재 브라우저에서는 위치 정보를 사용할 수 없습니다.",
        "error",
      );
      return;
    }

    setIsLoading(true);
    showMessage("현재 위치를 확인하고 있습니다.");
    simulationModeRef.current = false;

    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    let watchActive = true;
    const nextWatchId = navigator.geolocation.watchPosition(
      /* 위치 조회 성공 */
      (position) => {
        if (simulationModeRef.current) {
          return;
        }

        const { latitude, longitude, accuracy } = position.coords;

        showPosition(latitude, longitude, accuracy);

        /* GPS 위치 기준 시장 진입 여부 확인 */
        checkMarketEntry(latitude, longitude);
        submitMissionLocation(latitude, longitude, accuracy);
        showMessage(
          `GPS 추적 중: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} / WASD 이동 / PageUp·PageDown 속도 조절`,
        );

        setIsLoading(false);
      },

      /* 위치 조회 실패 */
      (error) => {
        if (simulationModeRef.current) {
          return;
        }
        watchActive = false;

        if (watchIdRef.current != null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }

        positionRef.current = null;
        pendingMissionLocationRef.current = null;

        if (missionSubmissionTimerRef.current != null) {
          window.clearTimeout(missionSubmissionTimerRef.current);
          missionSubmissionTimerRef.current = null;
        }

        switch (error.code) {
          case error.PERMISSION_DENIED:
            showMessage(
              "위치 정보 사용 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용한 후 다시 시도해주세요.",
              "error",
            );
            break;

          case error.POSITION_UNAVAILABLE:
            showMessage(
              "현재 위치를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.",
              "error",
            );
            break;

          case error.TIMEOUT:
            showMessage(
              "위치 정보를 가져오는 데 시간이 초과되었습니다. 다시 시도해주세요.",
              "error",
            );
            break;

          default:
            showMessage("현재 위치를 가져오지 못했습니다.", "error");
            break;
        }

        setIsLoading(false);
      },

      /* 위치 조회 옵션 */
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );

    if (watchActive) {
      watchIdRef.current = nextWatchId;
    } else {
      navigator.geolocation.clearWatch(nextWatchId);
    }
  };

  return (
    <div className="current-location-container">
      <button
        type="button"
        className="current-location-button"
        onClick={handleCurrentLocation}
        disabled={isLoading}
      >
        {isLoading ? "위치 확인 중..." : "내 위치"}
      </button>

      {demoMissions && (
        <details className="location-demo" ref={demoPanelRef}>
          <summary>위치 시연</summary>
          <div className="location-demo-controls">
            <label>
              시연할 미션
              <select
                value={selectedDemoMission?.id ?? ""}
                onChange={(event) => setSelectedDemoMissionId(event.target.value)}
              >
                {demoMissions.length === 0 && <option value="">미션 준비 중</option>}
                {demoMissions.map((mission) => (
                  <option key={mission.id} value={mission.id}>
                    {mission.title} · {MISSION_STATUS_LABEL[mission.status]}
                  </option>
                ))}
              </select>
            </label>
            <p>대상 남쪽에서 시작해 WASD로 이동하세요. 실제 GPS 없이 방문을 시연할 수 있어요.</p>
            <button
              type="button"
              className="current-location-button"
              disabled={!map || !demoStart}
              onClick={handleDemoStart}
            >
              시연 시작
            </button>
            <small>시작 위치만 이동하며, 미션 기록은 유지돼요.</small>
          </div>
        </details>
      )}
      {demoTargetName && (
        <div className="location-demo-badge">시연 위치 · {demoTargetName}</div>
      )}

      {message && (
        <div
          className={`current-location-message ${
            messageType === "error" ? "is-error" : ""
          }`}
          role={messageType === "error" ? "alert" : "status"}
        >
          {message}
        </div>
      )}
      {entryMessage && (
        <div className="market-entry-message">{entryMessage}</div>
      )}
    </div>
  );
}

export default CurrentLocation;
