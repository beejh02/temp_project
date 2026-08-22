import { useEffect, useRef } from "react";
import "../App.css";

function UserMapPage() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    if (!window.naver?.maps) {
      console.error("네이버 지도 API를 불러오지 못했습니다.");
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
      if (!mapInstanceRef.current) {
        return;
      }

      window.naver.maps.Event.trigger(mapInstanceRef.current, "resize");
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

      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="app">
      <div ref={mapContainerRef} className="map" />
    </div>
  );
}

export default UserMapPage;
