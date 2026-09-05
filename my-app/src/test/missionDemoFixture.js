export const demoMarket = {
  id: 8,
  name: "시연 시장",
  location: { latitude: 36.3275, longitude: 127.4274 },
  boundary: { type: "Polygon", coordinates: [[
    [127.427, 36.327], [127.428, 36.327],
    [127.428, 36.328], [127.427, 36.328], [127.427, 36.327],
  ]] },
};

export const demoMission = {
  id: 27,
  missionKey: "designated-store-visit",
  group: "daily",
  category: "visit",
  title: "지정 점포 방문하기",
  description: "시연 점포를 방문해 미션을 완료하세요.",
  activationReason: "시장 골목의 점포 방문을 유도해요.",
  status: "available",
  shared: false,
  sharedState: null,
  reward: 5,
  target: {
    type: "store", storeId: 19, marketId: null,
    name: "시연 점포", address: "시연 시장 안",
    location: { latitude: 36.3275, longitude: 127.4274 },
  },
  verificationLabel: "점포 반경 30m 이내 위치로 확인",
  progress: { current: 0, target: 1, label: "방문 전" },
  availability: { capacity: null, remainingSlots: null, endsAtLabel: "시연 중" },
};
