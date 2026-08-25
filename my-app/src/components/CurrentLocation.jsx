import { useEffect, useRef, useState } from "react";
import "./CurrentLocation.css";

const MOVE_STEP = 0.00005;

function CurrentLocation({ map }) {
  const markerRef = useRef(null);
  const positionRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!map) {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        return;
      }

      if (!positionRef.current || !markerRef.current) {
        return;
      }

      const key = event.key.toLowerCase();

      if (!["w", "a", "s", "d"].includes(key)) {
        return;
      }

      event.preventDefault();

      let { lat, lng } = positionRef.current;

      switch (key) {
        case "w":
          lat += MOVE_STEP;
          break;

        case "s":
          lat -= MOVE_STEP;
          break;

        case "a":
          lng -= MOVE_STEP;
          break;

        case "d":
          lng += MOVE_STEP;
          break;

        default:
          return;
      }

      positionRef.current = {
        lat,
        lng,
      };

      const newPosition = new window.naver.maps.LatLng(lat, lng);

      markerRef.current.setPosition(newPosition);

      setMessage(`테스트 위치: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [map]);

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

    navigator.geolocation.getCurrentPosition(
      /* 위치 조회 성공 */
      (position) => {
        const { latitude, longitude } = position.coords;

        /*
         * WASD 이동의 시작 위치 저장
         */
        positionRef.current = {
          lat: latitude,
          lng: longitude,
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

        setMessage(
          `현재 위치: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} / WASD 이동 가능`,
        );

        setIsLoading(false);
      },

      /* 위치 조회 실패 */
      (error) => {
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
    </div>
  );
}

export default CurrentLocation;
