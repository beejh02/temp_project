import { useEffect, useRef, useState } from "react";

function MapSearch({ map }) {
  const markerRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, []);

  /*
   * 특정 좌표로 지도 이동
   * + 검색 Marker 표시
   */
  const moveToPosition = (lat, lng) => {
    if (!map) {
      setMessage("지도가 아직 준비되지 않았습니다.");
      return;
    }

    if (!window.naver?.maps) {
      setMessage("네이버 지도 API를 불러오지 못했습니다.");
      return;
    }

    const position = new window.naver.maps.LatLng(lat, lng);

    /*
     * 기존 Marker가 존재하면
     * 새로 생성하지 않고 위치만 변경
     */
    if (markerRef.current) {
      markerRef.current.setPosition(position);
      markerRef.current.setMap(map);
    } else {
      markerRef.current = new window.naver.maps.Marker({
        position,
        map,
      });
    }

    map.panTo(position);
    if (map.getZoom() < 16) {
      map.setZoom(16);
    }
  };

  /* 좌표 검색 */
  const searchCoordinate = (value) => {
    const match = value.match(
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
    );

    /*
     * 좌표 형식이 아니라면
     * 주소 검색으로 넘기기 위해 false
     */
    if (!match) {
      return false;
    }

    const lat = Number(match[1]);
    const lng = Number(match[2]);

    /* 위도 / 경도 범위 검사 */
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setMessage("좌표 범위가 올바르지 않습니다.");
      return true;
    }

    moveToPosition(lat, lng);
    setMessage(`위도 ${lat}, 경도 ${lng}`);
    return true;
  };

  /* 도로명 / 지번 주소 검색 */
  const searchAddress = (address) => {
    if (!window.naver?.maps?.Service) {
      setMessage("Geocoder를 불러오지 못했습니다.");
      return;
    }

    setMessage("검색 중...");

    window.naver.maps.Service.geocode(
      {
        query: address,
      },

      (status, response) => {
        /* API 요청 실패 */
        if (status !== window.naver.maps.Service.Status.OK) {
          setMessage("주소 검색에 실패했습니다.");
          return;
        }

        /* 첫 번째 주소 검색 결과 사용 */
        const result = response.v2?.addresses?.[0];

        if (!result) {
          setMessage("검색 결과가 없습니다.");
          return;
        }

        const lat = Number(result.y);
        const lng = Number(result.x);

        /* 반환 좌표 검증 */
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          setMessage("검색 결과의 좌표가 올바르지 않습니다.");
          return;
        }

        /* 검색 위치로 이동 */
        moveToPosition(lat, lng);

        /* 도로명 주소가 있으면 우선 표시 */
        const displayAddress =
          result.roadAddress || result.jibunAddress || address;
        setMessage(displayAddress);
      },
    );
  };

  /* 검색 실행 */
  const handleSearch = () => {
    const value = searchValue.trim();

    if (!value) {
      setMessage("주소 또는 좌표를 입력해주세요.");
      return;
    }

    /* 1. 좌표 검색 시도 */
    if (searchCoordinate(value)) {
      return;
    }
    /* 2. 좌표 형식이 아니면 주소 검색 */
    searchAddress(value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="search-container">
      <div className="search-row">
        <input
          type="text"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="도로명 주소 또는 위도, 경도"
        />

        <button type="button" onClick={handleSearch}>
          검색
        </button>
      </div>

      {message && <div className="search-message">{message}</div>}
    </div>
  );
}

export default MapSearch;
