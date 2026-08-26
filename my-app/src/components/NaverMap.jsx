import { useEffect, useRef } from "react";
import { getNaverMapStyleId, loadNaverMaps } from "../lib/naverMaps";
import "./NaverMap.css";

function NaverMap({ onMapReady }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const onMapReadyRef = useRef(onMapReady);

  /* 부모에서 전달된 callback 최신 상태 유지 */
  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  /* 네이버 지도 API 로드 및 지도 생성 */
  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    let disposed = false;
    let resizeObserver = null;
    let resizeMap = null;

    loadNaverMaps()
      .then(() => {
        if (disposed || !mapContainerRef.current) {
          return;
        }

        /* 초기 지도 중심: 대전 지역 */
        const center = new window.naver.maps.LatLng(36.3275, 127.4274);
        const customStyleId = getNaverMapStyleId();
        const mapOptions = {
          center,
          zoom: 16,
          zoomControl: true,
          zoomControlOptions: {
            position: window.naver.maps.Position.TOP_RIGHT,
          },
        };

        /* Style Editor에서 발행한 My Style ID가 있을 때 GL 지도 적용 */
        if (customStyleId) {
          mapOptions.gl = true;
          mapOptions.customStyleId = customStyleId;
        }

        const map = new window.naver.maps.Map(
          mapContainerRef.current,
          mapOptions,
        );

        mapInstanceRef.current = map;
        onMapReadyRef.current?.(map);

        resizeMap = () => {
          if (!mapInstanceRef.current) {
            return;
          }

          window.naver.maps.Event.trigger(mapInstanceRef.current, "resize");
        };

        resizeObserver = new ResizeObserver(resizeMap);
        resizeObserver.observe(mapContainerRef.current);

        requestAnimationFrame(() => {
          resizeMap?.();
          map.setCenter(center);
        });

        window.addEventListener("resize", resizeMap);
      })
      .catch((error) => {
        console.error(error.message, error);
      });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();

      if (resizeMap) {
        window.removeEventListener("resize", resizeMap);
      }

      mapInstanceRef.current = null;
      onMapReadyRef.current?.(null);
    };
  }, []);

  return <div ref={mapContainerRef} className="map" />;
}

export default NaverMap;
