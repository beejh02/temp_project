import { useEffect, useRef, useState } from "react";

function CurrentLocation({ map }) {
  const markerRef = useRef(null);
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
          `현재 위치: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
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
