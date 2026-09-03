import { useCallback, useEffect, useState } from "react";

import NaverMap from "../components/NaverMap";
import MapSearch from "../components/MapSearch";
import CurrentLocation from "../components/CurrentLocation";
import MarketPolygon from "../components/MarketPolygon";
import PolygonEditor from "../components/PolygonEditor";
import StoreImportPanel from "../components/StoreImportPanel";
import StoreLayer from "../components/StoreLayer";
import { apiFetch } from "../utils/api";
import { toEditableBoundary } from "../utils/marketBoundary";
import "../App.css";

async function requestMarkets() {
  const response = await apiFetch("/api/markets");

  if (!response.ok) {
    throw new Error(`시장 조회 실패: ${response.status}`);
  }

  return response.json();
}

function AdminMapPage() {
  const [map, setMap] = useState(null);

  /*
   * DB에 저장되어 있는 시장 목록
   */
  const [markets, setMarkets] = useState([]);
  const [selectedMarketId, setSelectedMarketId] = useState(null);
  const [marketLoadError, setMarketLoadError] = useState("");

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
  const fetchMarkets = useCallback(async () => {
    try {
      const data = await requestMarkets();

      setMarkets(data);
      setMarketLoadError("");
      return data;
    } catch (error) {
      console.error("시장 조회 중 오류:", error);
      setMarketLoadError("시장 목록을 불러오지 못했습니다.");
      return [];
    }
  }, []);

  useEffect(() => {
    let disposed = false;

    requestMarkets()
      .then((data) => {
        if (!disposed) {
          setMarkets(data);
          setMarketLoadError("");
        }
      })
      .catch((error) => {
        console.error("시장 조회 중 오류:", error);

        if (!disposed) {
          setMarketLoadError("시장 목록을 불러오지 못했습니다.");
        }
      });

    return () => {
      disposed = true;
    };
  }, []);

  const applyMarketToEditor = useCallback((market) => {
    if (!market) {
      setSelectedMarketId(null);
      setMarketName("");
      setMarketBoundary([]);
      return;
    }

    setSelectedMarketId(market.id);
    setMarketName(market.name);
    setMarketBoundary(toEditableBoundary(market.boundary));
  }, []);

  const handleMarketSelect = useCallback((marketId) => {
    if (marketId == null) {
      applyMarketToEditor(null);
      return;
    }

    const market = markets.find((item) => item.id === marketId);
    applyMarketToEditor(market ?? null);
  }, [applyMarketToEditor, markets]);

  const handleMarketSaved = useCallback(async (marketId) => {
    const updatedMarkets = await fetchMarkets();
    const savedMarket = updatedMarkets.find(
      (market) => market.id === marketId,
    );

    applyMarketToEditor(savedMarket ?? null);
  }, [applyMarketToEditor, fetchMarkets]);

  const handleMarketDeleted = useCallback(async () => {
    applyMarketToEditor(null);
    await fetchMarkets();
  }, [applyMarketToEditor, fetchMarkets]);

  return (
    <div className="app">
      <NaverMap onMapReady={setMap} />

      {/* DB에 저장된 시장 Polygon */}
      {markets.map((market) => {
        if (market.id === selectedMarketId) {
          return null;
        }

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
        markets={markets}
        selectedMarketId={selectedMarketId}
        loadError={marketLoadError}
        onNameChange={setMarketName}
        onChange={setMarketBoundary}
        onMarketSelect={handleMarketSelect}
        onSaved={handleMarketSaved}
        onDeleted={handleMarketDeleted}
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
