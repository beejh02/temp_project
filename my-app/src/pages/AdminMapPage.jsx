import { useState } from "react";

import NaverMap from "../components/NaverMap";
import MapSearch from "../components/MapSearch";
import CurrentLocation from "../components/CurrentLocation";
import MarketPolygon from "../components/MarketPolygon";
import PolygonEditor from "../components/PolygonEditor";

import "../App.css";

function AdminMapPage() {
  const [map, setMap] = useState(null);

  /*
   * PolygonEditor와 MarketPolygon이
   * 공유하는 시장 영역 좌표.
   *
   * PolygonEditor:
   * 좌표 생성 / 수정
   *
   * MarketPolygon:
   * 좌표를 지도에 표시
   */
  const [marketBoundary, setMarketBoundary] = useState([]);

  return (
    <div className="app">
      <NaverMap onMapReady={setMap} />
      <MarketPolygon map={map} coordinates={marketBoundary} />
      <PolygonEditor
        map={map}
        coordinates={marketBoundary}
        onChange={setMarketBoundary}
      />
      <MapSearch map={map} />
      <CurrentLocation map={map} />
    </div>
  );
}

export default AdminMapPage;
