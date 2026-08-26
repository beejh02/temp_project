export const MISSION_CATEGORY = Object.freeze({
  VISIT: "visit",
  EXPLORATION: "exploration",
  CHALLENGE: "challenge",
  OTHER: "other",
});

export const MISSION_CATEGORY_LABEL = Object.freeze({
  [MISSION_CATEGORY.VISIT]: "방문형",
  [MISSION_CATEGORY.EXPLORATION]: "탐색형",
  [MISSION_CATEGORY.CHALLENGE]: "도전형",
  [MISSION_CATEGORY.OTHER]: "기타형",
});

export const MISSION_STATUS = Object.freeze({
  AVAILABLE: "available",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CLAIMED: "claimed",
  CLOSED: "closed",
});

export const MISSION_STATUS_LABEL = Object.freeze({
  [MISSION_STATUS.AVAILABLE]: "진행 가능",
  [MISSION_STATUS.IN_PROGRESS]: "진행 중",
  [MISSION_STATUS.COMPLETED]: "완료",
  [MISSION_STATUS.CLAIMED]: "보상 수령 완료",
  [MISSION_STATUS.CLOSED]: "마감",
});

export const MISSION_SLOT = Object.freeze({
  PRIORITY: "priority",
  STANDARD: "standard",
});

export const MISSION_TARGET_TYPE = Object.freeze({
  MARKET: "market",
  STORE: "store",
});

/*
 * 백엔드의 일일 미션 API 응답 형태를 미리 반영한 데모 데이터입니다.
 * target의 marketId와 storeId는 이후 실제 DB ID로 그대로 교체합니다.
 */
export const demoDailyMissionResponse = {
  date: "2026-08-27",
  timezone: "Asia/Seoul",
  policy: {
    dailyLimit: 4,
    priorityLimit: 2,
  },
  missions: [
    {
      id: "daily-20260827-recommended-store",
      missionKey: "recommended-store-visit",
      slot: MISSION_SLOT.PRIORITY,
      category: MISSION_CATEGORY.VISIT,
      title: "오늘의 추천 점포 방문",
      description: "청년상회 골목의 추천 가게에 들러보세요.",
      activationReason: "오늘 방문이 적은 골목에 활기를 더하는 미션이에요.",
      status: MISSION_STATUS.IN_PROGRESS,
      target: {
        type: MISSION_TARGET_TYPE.STORE,
        storeId: 101,
        name: "온기상점",
        address: "대전 중앙시장 청년구단 1층",
      },
      verification: {
        type: "store_proximity",
        radiusMeters: 30,
      },
      progress: {
        current: 0,
        target: 1,
        unit: "store",
      },
      reward: {
        expectedPoints: 300,
        claimedAt: null,
      },
      availability: {
        endsAt: "2026-08-27T20:00:00+09:00",
      },
    },
    {
      id: "daily-20260827-first-three",
      missionKey: "first-three-hidden-store",
      slot: MISSION_SLOT.PRIORITY,
      category: MISSION_CATEGORY.CHALLENGE,
      title: "선착순 3명! 숨은 가게 찾기",
      description: "남은 한 자리를 잡고 보너스 포인트를 받아요.",
      activationReason: "즉시 시장을 방문하는 탐험가를 위한 한정 미션이에요.",
      status: MISSION_STATUS.AVAILABLE,
      target: {
        type: MISSION_TARGET_TYPE.STORE,
        storeId: 102,
        name: "골목 끝 작은 방앗간",
        address: "대전 중앙시장 동문 골목",
      },
      verification: {
        type: "first_arrival",
        radiusMeters: 30,
      },
      progress: {
        current: 0,
        target: 1,
        unit: "visit",
      },
      reward: {
        expectedPoints: 450,
        claimedAt: null,
      },
      availability: {
        capacity: 3,
        completedCount: 2,
        remainingSlots: 1,
        endsAt: "2026-08-27T21:00:00+09:00",
      },
    },
    {
      id: "daily-20260827-stay-ten-minutes",
      missionKey: "market-stay-ten-minutes",
      slot: MISSION_SLOT.STANDARD,
      category: MISSION_CATEGORY.VISIT,
      title: "시장 10분 머무르기",
      description: "시장 안을 천천히 둘러보며 10분을 채워보세요.",
      activationReason: "머무는 시간만큼 새로운 가게를 만날 가능성이 커져요.",
      status: MISSION_STATUS.COMPLETED,
      target: {
        type: MISSION_TARGET_TYPE.MARKET,
        marketId: 1,
        name: "대전 중앙시장",
      },
      verification: {
        type: "market_dwell_time",
        requiredSeconds: 600,
      },
      progress: {
        current: 600,
        target: 600,
        unit: "second",
      },
      reward: {
        expectedPoints: 200,
        claimedAt: null,
      },
      availability: {
        endsAt: "2026-08-28T00:00:00+09:00",
      },
    },
    {
      id: "daily-20260827-visit-three-stores",
      missionKey: "visit-three-stores",
      slot: MISSION_SLOT.STANDARD,
      category: MISSION_CATEGORY.EXPLORATION,
      title: "점포 3곳 둘러보기",
      description: "서로 다른 세 가게를 방문하며 시장을 탐색해요.",
      activationReason: "익숙한 길을 벗어나 시장 곳곳을 발견하는 미션이에요.",
      status: MISSION_STATUS.CLAIMED,
      target: {
        type: MISSION_TARGET_TYPE.MARKET,
        marketId: 1,
        name: "대전 중앙시장",
      },
      verification: {
        type: "distinct_store_proximity",
        requiredStoreCount: 3,
        radiusMeters: 30,
      },
      progress: {
        current: 3,
        target: 3,
        unit: "store",
      },
      reward: {
        expectedPoints: 350,
        claimedAt: "2026-08-27T15:20:00+09:00",
      },
      availability: {
        endsAt: "2026-08-28T00:00:00+09:00",
      },
    },
  ],
};

function validateDailyMissionResponse(response) {
  const { dailyLimit, priorityLimit } = response.policy;
  const missionIds = new Set(response.missions.map(({ id }) => id));
  const priorityCount = response.missions.filter(
    ({ slot }) => slot === MISSION_SLOT.PRIORITY,
  ).length;
  const validCategories = new Set(Object.values(MISSION_CATEGORY));
  const validStatuses = new Set(Object.values(MISSION_STATUS));

  if (response.missions.length !== dailyLimit) {
    throw new Error(`데일리 미션은 ${dailyLimit}개여야 합니다.`);
  }

  if (priorityCount !== priorityLimit) {
    throw new Error(`우선 미션은 ${priorityLimit}개여야 합니다.`);
  }

  if (missionIds.size !== response.missions.length) {
    throw new Error("데일리 미션 ID는 중복될 수 없습니다.");
  }

  response.missions.forEach((mission) => {
    if (!validCategories.has(mission.category)) {
      throw new Error(`지원하지 않는 미션 카테고리입니다: ${mission.category}`);
    }

    if (!validStatuses.has(mission.status)) {
      throw new Error(`지원하지 않는 미션 상태입니다: ${mission.status}`);
    }
  });
}

validateDailyMissionResponse(demoDailyMissionResponse);

export function findDemoDailyMission(missionId) {
  return demoDailyMissionResponse.missions.find(({ id }) => id === missionId);
}
