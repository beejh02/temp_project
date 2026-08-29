import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiUrl } from "../utils/api";
import NaverMap from "../components/NaverMap";
import MapSearch from "../components/MapSearch";
import CurrentLocation from "../components/CurrentLocation";
import MapDataStatus from "../components/MapDataStatus";
import MarketPolygon from "../components/MarketPolygon";
import MissionLayer from "../components/MissionLayer";
import StoreLayer from "../components/StoreLayer";
import { MISSION_TARGET_TYPE } from "../data/missionConstants";
import useMissionDemo from "../hooks/useMissionDemo";

import "../App.css";

function UserMapPage() {
  const [map, setMap] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [stores, setStores] = useState([]);
  const [marketLoadStatus, setMarketLoadStatus] = useState("loading");
  const [storeLoadStatus, setStoreLoadStatus] = useState("loading");
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [searchParams] = useSearchParams();
  const { missions, recordMissionLocation } = useMissionDemo();
  const focusedMissionId = searchParams.get("missionId");
  const missionStoreIds = useMemo(
    () =>
      missions
        .filter(({ target }) => target.type === MISSION_TARGET_TYPE.STORE)
        .map(({ target }) => target.storeId),
    [missions],
  );

  /*
   * 페이지 로드 시 DB에 저장된 시장 목록 조회
   */
  useEffect(() => {
    const abortController = new AbortController();

    const fetchMarkets = async () => {
      setMarketLoadStatus("loading");

      try {
        const response = await fetch(apiUrl("/api/markets"), {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`시장 조회 실패: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("시장 조회 응답 형식이 올바르지 않습니다.");
        }

        setMarkets(data);
        setMarketLoadStatus("success");
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("시장 조회 중 오류:", error);
          setMarketLoadStatus("error");
        }
      }
    };

    fetchMarkets();

    return () => {
      abortController.abort();
    };
  }, [dataRefreshKey]);

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

      <StoreLayer
        map={map}
        refreshKey={dataRefreshKey}
        excludedStoreIds={missionStoreIds}
        onStoresLoad={setStores}
        onLoadStateChange={setStoreLoadStatus}
      />
      <MissionLayer
        map={map}
        markets={markets}
        stores={stores}
        missions={missions}
        focusedMissionId={focusedMissionId}
      />

      <MapDataStatus
        marketStatus={marketLoadStatus}
        storeStatus={storeLoadStatus}
        marketCount={markets.length}
        storeCount={stores.length}
        onRetry={() => setDataRefreshKey((currentKey) => currentKey + 1)}
      />

      <MapSearch map={map} />
      <CurrentLocation map={map} onMissionLocation={recordMissionLocation} />
    </div>
  );
}

export default UserMapPage;
