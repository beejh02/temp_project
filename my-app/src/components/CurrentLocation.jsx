import { useCallback, useEffect, useRef, useState } from "react";
import useMissionDemo from "../hooks/useMissionDemo";
import "./CurrentLocation.css";

const INITIAL_MOVE_STEP = 0.00005;
const MIN_MOVE_STEP = 0.000005;
const MAX_MOVE_STEP = 0.001;
const MISSION_LOCATION_HEARTBEAT_MS = 10000;

/*
 * 현재 좌표가 어느 시장에 포함되는지 Backend에 조회
 */
async function fetchMarketsAtLocation(latitude, longitude) {
  try {
    const response = await fetch(
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

function CurrentLocation({ map }) {
  const markerRef = useRef(null);
  const positionRef = useRef(null);
  const moveStepRef = useRef(INITIAL_MOVE_STEP);
  const watchIdRef = useRef(null);
  const simulationModeRef = useRef(false);
  const { recordMissionLocation } = useMissionDemo();

  /*
   * 현재 들어가 있는 시장 ID
   * null = 현재 시장 외부
   */
  const currentMarketIdRef = useRef(null);

  /*진입 알림을 3초 뒤 제거하기 위한 Timer */
  const entryMessageTimerRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [entryMessage, setEntryMessage] = useState("");

  const submitMissionLocation = useCallback(
    (latitude, longitude, accuracy = 5) => {
      recordMissionLocation({
        latitude,
        longitude,
        accuracy,
        recordedAt: new Date().toISOString(),
      }).catch((error) => {
        console.error("미션 위치 판정 중 오류:", error);
      });
    },
    [recordMissionLocation],
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
        markerRef.current.setMap(null);
        markerRef.current = null;
      }

      if (entryMessageTimerRef.current) {
        clearTimeout(entryMessageTimerRef.current);
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
        setMessage(`이동 속도 증가: ${moveStepRef.current.toFixed(6)}`);
        return;
      }

      if (key === "pagedown") {
        event.preventDefault();
        moveStepRef.current = Math.max(moveStepRef.current / 2, MIN_MOVE_STEP);
        setMessage(`이동 속도 감소: ${moveStepRef.current.toFixed(6)}`);
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

      const newPosition = new window.naver.maps.LatLng(lat, lng);

      markerRef.current.setPosition(newPosition);

      /*
       * WASD로 이동한 새 좌표를 기준으로
       * 현재 포함된 시장 조회
       */
      checkMarketEntry(lat, lng);
      submitMissionLocation(lat, lng);

      setMessage(
        `테스트 위치: ${lat.toFixed(6)}, ${lng.toFixed(6)} / 속도: ${moveStep.toFixed(6)}`,
      );
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [map, checkMarketEntry, submitMissionLocation]);

  /* 현재 위치 가져오기 */
  const handleCurrentLocation = () => {
    if (!map) {
      setMessage("지도가 아직 준비되지 않았습니다.");
      return;
    }

    if (!window.naver?.maps) {
      setMessage("네이버 지도 API를 불러오지 못했습니다.");
      return;
    }

    if (!navigator.geolocation) {
      setMessage("현재 브라우저에서는 위치 정보를 사용할 수 없습니다.");
      return;
    }

    setIsLoading(true);
    setMessage("현재 위치를 확인하고 있습니다.");
    simulationModeRef.current = false;

    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      /* 위치 조회 성공 */
      (position) => {
        if (simulationModeRef.current) {
          return;
        }

        const { latitude, longitude, accuracy } = position.coords;

        /*
         * WASD 이동의 시작 위치 저장
         */
        positionRef.current = {
          lat: latitude,
          lng: longitude,
          accuracy,
        };

        const currentPosition = new window.naver.maps.LatLng(
          latitude,
          longitude,
        );

        /*
         * 기존 Marker가 있으면
         * 새로 생성하지 않고 위치만 변경
         */
        if (markerRef.current) {
          markerRef.current.setPosition(currentPosition);
          markerRef.current.setMap(map);
        } else {
          markerRef.current = new window.naver.maps.Marker({
            position: currentPosition,
            map,
          });
        }

        /* 현재 위치로 지도 이동 */
        map.panTo(currentPosition);
        map.setZoom(18);

        /* GPS 위치 기준 시장 진입 여부 확인 */
        checkMarketEntry(latitude, longitude);
        submitMissionLocation(latitude, longitude, accuracy);
        setMessage(
          `GPS 추적 중: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} / WASD 이동 / PageUp·PageDown 속도 조절`,
        );

        setIsLoading(false);
      },

      /* 위치 조회 실패 */
      (error) => {
        if (watchIdRef.current != null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setMessage("위치 정보 사용 권한이 거부되었습니다.");
            break;

          case error.POSITION_UNAVAILABLE:
            setMessage("현재 위치를 확인할 수 없습니다.");
            break;

          case error.TIMEOUT:
            setMessage("위치 정보를 가져오는 데 시간이 초과되었습니다.");
            break;

          default:
            setMessage("현재 위치를 가져오지 못했습니다.");
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

      {message && <div className="current-location-message">{message}</div>}
      {entryMessage && (
        <div className="market-entry-message">{entryMessage}</div>
      )}
    </div>
  );
}

export default CurrentLocation;
