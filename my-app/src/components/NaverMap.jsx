import { useEffect, useRef } from "react";
import "./NaverMap.css";

function NaverMap({ onMapReady }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const onMapReadyRef = useRef(onMapReady);

  /* 부모에서 전달된 callback 최신 상태 유지 */
  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  /* 네이버 지도 생성 */
  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    if (!window.naver?.maps) {
      console.error("네이버 지도 API를 불러오지 못했습니다.");
      return;
    }

    /*
     * 초기 지도 중심
     * 대전 지역
     */
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

    /* 부모에게 생성된 map 인스턴스 전달 */
    onMapReadyRef.current?.(map);

    /*
     * 지도 컨테이너 크기가 변할 때
     * 네이버 지도 크기도 다시 계산
     */
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

    /* 최초 렌더링 직후 지도 크기 보정 */
    requestAnimationFrame(() => {
      resizeMap();
      map.setCenter(center);
    });

    /* 브라우저 창 크기 변경 대응 */
    window.addEventListener("resize", resizeMap);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeMap);
      mapInstanceRef.current = null;
      /* 부모에도 map 제거 상태 전달 */
      onMapReadyRef.current?.(null);
    };
  }, []);

  return <div ref={mapContainerRef} className="map" />;
}

export default NaverMap;
