import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [searchValue, setSearchValue] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    if (!window.naver?.maps) {
      setMessage("네이버 지도 API를 불러오지 못했습니다.");
      return;
    }

    const center = new window.naver.maps.LatLng(
      36.3275,
      127.4274,
    );

    const map = new window.naver.maps.Map(
      mapContainerRef.current,
      {
        center,
        zoom: 16,

        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
        },
      },
    );

    mapInstanceRef.current = map;

    const resizeMap = () => {
      if (!mapInstanceRef.current) {
        return;
      }

      window.naver.maps.Event.trigger(
        mapInstanceRef.current,
        "resize",
      );
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeMap();
    });

    resizeObserver.observe(mapContainerRef.current);

    requestAnimationFrame(() => {
      resizeMap();
      map.setCenter(center);
    });

    window.addEventListener("resize", resizeMap);

    return () => {
      resizeObserver.disconnect();

      window.removeEventListener(
        "resize",
        resizeMap,
      );

      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }

      mapInstanceRef.current = null;
    };
  }, []);

  /**
   * 검색한 위치로 지도 이동
   * + 검색 위치에 Marker 표시
   */
  const moveToPosition = (lat, lng) => {
    const map = mapInstanceRef.current;

    if (!map) {
      setMessage("지도가 아직 준비되지 않았습니다.");
      return;
    }

    const position = new window.naver.maps.LatLng(
      lat,
      lng,
    );

    /*
     * 기존 Marker가 있다면 위치만 변경
     */
    if (markerRef.current) {
      markerRef.current.setPosition(position);
    } else {
      /*
       * Marker가 없다면 새로 생성
       */
      markerRef.current = new window.naver.maps.Marker({
        position,
        map,
      });
    }

    /*
     * 검색 위치로 지도 이동
     */
    map.panTo(position);

    /*
     * 검색했을 때 너무 멀리 보이는 것을 방지
     */
    if (map.getZoom() < 16) {
      map.setZoom(16);
    }
  };

  /**
   * 위도, 경도 검색
   *
   * 예:
   * 36.3275, 127.4274
   */
  const searchCoordinate = (value) => {
    const match = value.match(
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
    );

    if (!match) {
      return false;
    }

    const lat = Number(match[1]);
    const lng = Number(match[2]);

    if (
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setMessage(
        "좌표 범위가 올바르지 않습니다.",
      );

      return true;
    }

    moveToPosition(lat, lng);

    setMessage(
      `위도 ${lat}, 경도 ${lng}`,
    );

    return true;
  };

  /**
   * 도로명 주소 / 지번 주소 검색
   */
  const searchAddress = (address) => {
    if (!window.naver?.maps?.Service) {
      setMessage(
        "Geocoder를 불러오지 못했습니다.",
      );

      return;
    }

    setMessage("검색 중...");

    window.naver.maps.Service.geocode(
      {
        query: address,
      },
      (status, response) => {
        if (
          status !==
          window.naver.maps.Service.Status.OK
        ) {
          setMessage(
            "주소 검색에 실패했습니다.",
          );

          return;
        }

        const result =
          response.v2?.addresses?.[0];

        if (!result) {
          setMessage(
            "검색 결과가 없습니다.",
          );

          return;
        }

        const lat = Number(result.y);
        const lng = Number(result.x);

        moveToPosition(lat, lng);

        const displayAddress =
          result.roadAddress ||
          result.jibunAddress ||
          address;

        setMessage(displayAddress);
      },
    );
  };

  /**
   * 검색 실행
   */
  const handleSearch = () => {
    const value = searchValue.trim();

    if (!value) {
      setMessage(
        "주소 또는 좌표를 입력해주세요.",
      );

      return;
    }

    /*
     * 좌표 형식이면 좌표 검색
     */
    if (searchCoordinate(value)) {
      return;
    }

    /*
     * 좌표가 아니면 주소 검색
     */
    searchAddress(value);
  };

  /**
   * Enter 검색
   */
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="app">
      <div className="search-container">
        <div className="search-row">
          <input
            type="text"
            value={searchValue}
            onChange={(event) =>
              setSearchValue(
                event.target.value,
              )
            }
            onKeyDown={handleKeyDown}
            placeholder="도로명 주소 또는 위도, 경도"
          />

          <button
            type="button"
            onClick={handleSearch}
          >
            검색
          </button>
        </div>

        {message && (
          <div className="search-message">
            {message}
          </div>
        )}
      </div>

      <div
        ref={mapContainerRef}
        className="map"
      />
    </div>
  );
}

export default App;