export function getMissionDemoStart(mission, markets) {
  const { latitude, longitude } = mission?.target?.location ?? {};

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (mission.target.type === "store") {
    // 점포 반경에 들어가기 전, 약 67m 남쪽에서 접근을 시작한다.
    return { latitude: latitude - 0.0006, longitude };
  }

  const market = markets.find(
    ({ id }) => String(id) === String(mission.target.marketId),
  );
  const latitudes = market?.boundary?.coordinates?.[0]
    ?.map(([, lat]) => lat).filter(Number.isFinite);

  if (!latitudes?.length) {
    return null;
  }

  return { latitude: Math.min(...latitudes) - 0.0001, longitude };
}
