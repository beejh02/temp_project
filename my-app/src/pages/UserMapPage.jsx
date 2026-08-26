import { useEffect, useState } from "react";

import NaverMap from "../components/NaverMap";
import MapSearch from "../components/MapSearch";
import CurrentLocation from "../components/CurrentLocation";
import MarketPolygon from "../components/MarketPolygon";
import MissionLayer from "../components/MissionLayer";
import StoreLayer from "../components/StoreLayer";

import "../App.css";

function UserMapPage() {
  const [map, setMap] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);

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

      <StoreLayer map={map} onStoreSelect={setSelectedStore} />
      <MissionLayer map={map} selectedStore={selectedStore} />

      <MapSearch map={map} />
      <CurrentLocation map={map} />
    </div>
  );
}

export default UserMapPage;
