import { useEffect, useRef } from "react";
import "./PolygonEditor.css";

function PolygonEditor({ map, name, coordinates, onNameChange, onChange }) {
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

  /* Polygon 저장 */
  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      alert("시장 이름을 입력해주세요.");
      return;
    }
    if (coordinates.length < 3) {
      alert("Polygon은 최소 3개의 정점이 필요합니다.");
      return;
    }

    /*
     * 애플리케이션 좌표
     * { lat, lng }
     * ↓
     * GeoJSON 좌표
     * [lng, lat]
     */
    const geoJsonCoordinates = coordinates.map(({ lat, lng }) => [lng, lat]);

    /*
     * GeoJSON Polygon의 LinearRing은
     * 첫 좌표와 마지막 좌표가 동일해야 한다.
     */
    geoJsonCoordinates.push([
      geoJsonCoordinates[0][0],
      geoJsonCoordinates[0][1],
    ]);

    /* GeoJSON Polygon 생성 */
    const boundary = {
      type: "Polygon",
      coordinates: [geoJsonCoordinates],
    };

    /* 추후 Spring Boot API로 전달할 Market 데이터 */
    const marketData = {
      name: trimmedName,
      boundary,
    };

    console.log("저장할 시장 데이터:", marketData);
    alert(`${trimmedName} Polygon 테스트 완료 (${coordinates.length}개 정점)`);
  };

  return (
    <div className="polygon-editor">
      <div className="polygon-editor-name">
        <label htmlFor="market-name">시장 이름</label>

        <input
          id="market-name"
          type="text"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="예: 대전 중앙시장"
          maxLength={100}
        />
      </div>

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
          disabled={!name.trim() || coordinates.length < 3}
        >
          저장
        </button>
      </div>
    </div>
  );
}

export default PolygonEditor;
