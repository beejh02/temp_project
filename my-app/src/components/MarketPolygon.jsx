import { useEffect, useRef } from "react";
import { safelyDetachNaverMapObject } from "../lib/naverMapCleanup";

function MarketPolygon({ map, coordinates }) {
  const polygonRef = useRef(null);

  useEffect(() => {
    /*
     * 기존 Polygon 제거
     *
     * 좌표가 변경되면 이전 Polygon을 제거하고
     * 새로운 좌표로 다시 생성한다.
     */
    if (polygonRef.current) {
      safelyDetachNaverMapObject(polygonRef.current);
      polygonRef.current = null;
    }

    if (!map) {
      return;
    }

    if (!window.naver?.maps) {
      console.error("네이버 지도 API를 불러오지 못했습니다.");
      return;
    }

    /*
     * Polygon을 만들기 위해서는
     * 최소 3개의 정점이 필요하다.
     */
    if (!Array.isArray(coordinates) || coordinates.length < 3) {
      return;
    }

    /*
     * 애플리케이션 좌표 형식:
     *
     * {
     *   lat: 위도,
     *   lng: 경도
     * }
     */
    const paths = coordinates.map(
      ({ lat, lng }) => new window.naver.maps.LatLng(lat, lng),
    );

    /*
     * 전달받은 좌표를 이용하여
     * 실제 Naver Map Polygon 생성
     */
    const polygon = new window.naver.maps.Polygon({
      map,
      paths,
      fillColor: "#03c75a",
      fillOpacity: 0.2,
      strokeColor: "#03c75a",
      strokeOpacity: 0.9,
      strokeWeight: 3,
    });

    polygonRef.current = polygon;

    /* 컴포넌트 제거 시 Polygon 제거 */
    return () => {
      safelyDetachNaverMapObject(polygon);

      if (polygonRef.current === polygon) {
        polygonRef.current = null;
      }
    };
  }, [map, coordinates]);

  /*
   * 화면에 HTML 요소를 렌더링하지 않고
   * Naver Map 객체만 생성하기 때문에 null 반환
   */
  return null;
}

export default MarketPolygon;
