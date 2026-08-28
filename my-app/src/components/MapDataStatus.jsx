import "./MapDataStatus.css";

function MapDataStatus({
  marketStatus,
  storeStatus,
  marketCount,
  storeCount,
  onRetry,
}) {
  const isLoading =
    marketStatus === "loading" || storeStatus === "loading";
  const hasError = marketStatus === "error" || storeStatus === "error";
  const isEmpty =
    marketStatus === "success"
    && storeStatus === "success"
    && marketCount === 0
    && storeCount === 0;

  if (!isLoading && !hasError && !isEmpty) {
    return null;
  }

  if (hasError) {
    return (
      <aside className="map-data-status is-error" role="alert">
        <div>
          <strong>일부 지도 정보를 불러오지 못했어요.</strong>
          <span>데모 미션 위치는 계속 확인할 수 있습니다.</span>
        </div>
        <button type="button" onClick={onRetry}>
          다시 시도
        </button>
      </aside>
    );
  }

  if (isLoading) {
    return (
      <aside className="map-data-status is-loading" role="status">
        <span className="map-data-status__spinner" aria-hidden="true" />
        <strong>시장과 점포 정보를 불러오는 중이에요.</strong>
      </aside>
    );
  }

  return (
    <aside className="map-data-status is-empty" role="status">
      <div>
        <strong>등록된 시장·점포 정보가 아직 없어요.</strong>
        <span>현재는 데모 미션 위치만 표시합니다.</span>
      </div>
    </aside>
  );
}

export default MapDataStatus;
