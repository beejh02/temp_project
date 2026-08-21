import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [searchValue, setSearchValue] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!mapContainerRef.current || !window.naver?.maps) {
      return;
    }

    const center = new window.naver.maps.LatLng(36.3275, 127.4274);

    const map = new window.naver.maps.Map(mapContainerRef.current, {
      center,
      zoom: 16,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    });

    mapInstanceRef.current = map;

    const resizeMap = () => {
      window.naver.maps.Event.trigger(map, "resize");
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
      window.removeEventListener("resize", resizeMap);

      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      mapInstanceRef.current = null;
    };
  }, []);
  const searchCoordinate = (value) => {
    const match = value.match(
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
    );

    if (!match) return false;

    const lat = Number(match[1]);
    const lng = Number(match[2]);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setMessage("좌표 범위가 올바르지 않습니다.");
      return true;
    }

    moveToPosition(lat, lng);

    setMessage(`${lat}, ${lng}`);

    return true;
  };

  const searchAddress = (address) => {
    if (!window.naver?.maps?.Service) {
      setMessage("Geocoder를 불러오지 못했습니다.");
      return;
    }

    window.naver.maps.Service.geocode(
      {
        query: address,
      },
      (status, response) => {
        if (status !== window.naver.maps.Service.Status.OK) {
          setMessage("주소 검색에 실패했습니다.");
          return;
        }

        const result = response.v2?.addresses?.[0];

        if (!result) {
          setMessage("검색 결과가 없습니다.");
          return;
        }

        const lat = Number(result.y);
        const lng = Number(result.x);

        moveToPosition(lat, lng);

        setMessage(result.roadAddress || result.jibunAddress || address);
      },
    );
  };

  const handleSearch = () => {
    const value = searchValue.trim();

    if (!value) {
      setMessage("주소 또는 좌표를 입력해주세요.");
      return;
    }

    if (searchCoordinate(value)) {
      return;
    }

    searchAddress(value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="app">
      <div className="search-container">
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

        {message && <div className="search-message">{message}</div>}
      </div>

      <div ref={mapContainerRef} className="map" />
    </div>
  );
}

export default App;
