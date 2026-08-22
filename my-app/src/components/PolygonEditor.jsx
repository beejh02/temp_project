import { useEffect, useRef } from "react";
import "./PolygonEditor.css";

function PolygonEditor({ map, coordinates, onChange }) {
  const markersRef = useRef([]);

  /*
   * 현재 coordinates를 기준으로
   * 정점 Marker를 다시 표시한다.
   */
  useEffect(() => {
    /* 기존 정점 Marker 제거 */
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];
    if (!map) return;
    if (!window.naver?.maps) return;

    /* 각 Polygon 정점 위치에 Marker 생성 */
    const markers = coordinates.map(
      ({ lat, lng }) =>
        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(lat, lng),
          map,
        }),
    );

    markersRef.current = markers;

    return () => {
      markers.forEach((marker) => {
        marker.setMap(null);
      });
    };
  }, [map, coordinates]);

  /* 지도 클릭 이벤트 등록 */
  useEffect(() => {
    if (!map) return;
    if (!window.naver?.maps) return;

    /* 지도 클릭 시 새로운 정점 추가 */
    const listener = window.naver.maps.Event.addListener(
      map,
      "click",
      (event) => {
        const lat = event.coord.lat();
        const lng = event.coord.lng();
        const newPoint = {
          lat,
          lng,
        };

        /*
         * 부모(AdminMapPage)가 관리하는
         * marketBoundary 상태 변경
         */
        onChange((previousCoordinates) => [...previousCoordinates, newPoint]);
      },
    );

    return () => {
      window.naver.maps.Event.removeListener(listener);
    };
  }, [map, onChange]);

  /* 가장 마지막에 추가한 정점 제거 */
  const handleUndo = () => {
    onChange((previousCoordinates) => previousCoordinates.slice(0, -1));
  };

  /* 모든 정점 제거 */
  const handleReset = () => {
    onChange([]);
  };

  /*  Polygon 저장 */
  const handleSave = () => {
    if (coordinates.length < 3) {
      alert("Polygon은 최소 3개의 정점이 필요합니다.");
      return;
    }

    /*
     * 현재는 관리자 화면에서 기능 테스트만 진행.
     *
     * coordinates에는 다음 형태로 좌표가 들어있다.
     *
     * [
     *   { lat: 36.xxxx, lng: 127.xxxx },
     *   ...
     * ]
     *
     * ========================================
     * TODO: Spring Boot / DB 연결
     * ========================================
     *
     * 추후 저장 버튼 클릭 시:
     *
     * PolygonEditor
     *      ↓
     * marketApi.js
     *      ↓
     * Spring Boot REST API
     *      ↓
     * PostgreSQL
     *
     * 구조로 Polygon을 영구 저장한다.
     *
     * DB 저장 시 GeoJSON을 사용한다면
     * 좌표 순서는 다음과 같이 변환한다.
     *
     * 현재:
     * { lat, lng }
     *
     * GeoJSON:
     * [lng, lat]
     *
     * 예:
     *
     * const polygon = {
     *   type: "Polygon",
     *   coordinates: [
     *     coordinates.map(({ lat, lng }) => [
     *       lng,
     *       lat,
     *     ]),
     *   ],
     * };
     *
     * await saveMarketBoundary(marketId, polygon);
     */

    console.log("저장할 Polygon 좌표:", coordinates);
    alert(`Polygon 테스트 완료 (${coordinates.length}개 정점)`);
  };

  return (
    <div className="polygon-editor">
      <div className="polygon-editor-info">정점 {coordinates.length}개</div>
      <div className="polygon-editor-actions">
        <button
          type="button"
          onClick={handleUndo}
          disabled={coordinates.length === 0}
        >
          되돌리기
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={coordinates.length === 0}
        >
          초기화
        </button>

        <button
          type="button"
          className="polygon-save-button"
          onClick={handleSave}
          disabled={coordinates.length < 3}
        >
          저장
        </button>
      </div>
    </div>
  );
}

export default PolygonEditor;
