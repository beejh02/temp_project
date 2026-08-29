import { useEffect, useRef, useState } from "react";
import {
  getNaverMapStyleId,
  loadNaverMaps,
  subscribeNaverMapsFailure,
} from "../lib/naverMaps";
import "./NaverMap.css";

function NaverMap({ onMapReady }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const onMapReadyRef = useRef(onMapReady);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

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
    let eventApi = null;
    const handleLoadFailure = (error) => {
      if (disposed) {
        return;
      }

      mapInstanceRef.current = null;
      onMapReadyRef.current?.(null);
      setLoadError(error.message);
    };
    const unsubscribeFailure = subscribeNaverMapsFailure(handleLoadFailure);

    setLoadError("");

    loadNaverMaps({ forceReload: reloadKey > 0 })
      .then((mapsApi) => {
        if (disposed || !mapContainerRef.current) {
          return;
        }

        /* 초기 지도 중심: 대전 지역 */
        const center = new mapsApi.LatLng(36.3275, 127.4274);
        const customStyleId = getNaverMapStyleId();
        const mapOptions = {
          center,
          zoom: 16,
          gl: true,
          zoomControl: true,
          zoomControlOptions: {
            position: mapsApi.Position.TOP_RIGHT,
          },
        };

        /* Style Editor에서 발행한 My Style ID가 있을 때 커스텀 스타일 적용 */
        if (customStyleId) {
          mapOptions.customStyleId = customStyleId;
        }

        const map = new mapsApi.Map(mapContainerRef.current, mapOptions);

        mapInstanceRef.current = map;
        eventApi = mapsApi.Event;
        onMapReadyRef.current?.(map);

        resizeMap = () => {
          if (!mapInstanceRef.current) {
            return;
          }

          eventApi?.trigger(mapInstanceRef.current, "resize");
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
        handleLoadFailure(error);
      });

    return () => {
      disposed = true;
      unsubscribeFailure();
      resizeObserver?.disconnect();

      if (resizeMap) {
        window.removeEventListener("resize", resizeMap);
      }

      mapInstanceRef.current = null;
      onMapReadyRef.current?.(null);
    };
  }, [reloadKey]);

  return (
    <>
      <div ref={mapContainerRef} className="map" />
      {loadError && (
        <div className="map-load-error" role="alert">
          <strong>지도를 불러오지 못했습니다.</strong>
          <span>{loadError}</span>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            다시 시도
          </button>
        </div>
      )}
    </>
  );
}

export default NaverMap;
