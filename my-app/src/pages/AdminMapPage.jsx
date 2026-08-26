import { useEffect, useState } from "react";

import NaverMap from "../components/NaverMap";
import MapSearch from "../components/MapSearch";
import CurrentLocation from "../components/CurrentLocation";
import MarketPolygon from "../components/MarketPolygon";
import PolygonEditor from "../components/PolygonEditor";
import StoreImportPanel from "../components/StoreImportPanel";
import StoreLayer from "../components/StoreLayer";

import "../App.css";

function AdminMapPage() {
  const [map, setMap] = useState(null);

  /*
   * DB에 저장되어 있는 시장 목록
   */
  const [markets, setMarkets] = useState([]);

  /*
   * 현재 관리자가 편집 중인 시장 이름
   */
  const [marketName, setMarketName] = useState("");

  /*
   * 현재 관리자가 편집 중인 시장 영역 좌표
   */
  const [marketBoundary, setMarketBoundary] = useState([]);

  /* CSV 가져오기 완료 후 점포 레이어 재조회에 사용 */
  const [storeRefreshKey, setStoreRefreshKey] = useState(0);

  /*
   * 페이지 로드 시 DB에 저장된 시장 목록 조회
   */
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await fetch("/api/markets");

        if (!response.ok) {
          throw new Error(`시장 조회 실패: ${response.status}`);
        }

        const data = await response.json();

        setMarkets(data);
      } catch (error) {
        console.error("시장 조회 중 오류:", error);
      }
    };

    fetchMarkets();
  }, []);

  return (
    <div className="app">
      <NaverMap onMapReady={setMap} />

      {/* DB에 저장된 시장 Polygon */}
      {markets.map((market) => {
        const coordinates = market.boundary.coordinates[0].map(
          ([lng, lat]) => ({
            lat,
            lng,
          }),
        );

        return (
          <MarketPolygon key={market.id} map={map} coordinates={coordinates} />
        );
      })}

      {/* 현재 관리자가 편집 중인 Polygon */}
      <MarketPolygon map={map} coordinates={marketBoundary} />

      <PolygonEditor
        map={map}
        name={marketName}
        coordinates={marketBoundary}
        onNameChange={setMarketName}
        onChange={setMarketBoundary}
      />

      <StoreLayer map={map} refreshKey={storeRefreshKey} />
      <StoreImportPanel
        onImported={() => {
          setStoreRefreshKey((currentKey) => currentKey + 1);
        }}
      />

      <MapSearch map={map} />
      <CurrentLocation map={map} />
    </div>
  );
}

export default AdminMapPage;
