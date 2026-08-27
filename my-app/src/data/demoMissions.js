export const MISSION_GROUP = Object.freeze({
  DAILY: "daily",
  SPECIAL: "special",
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

export const MISSION_TARGET_TYPE = Object.freeze({
  MARKET: "market",
  STORE: "store",
});

/*
 * 백엔드 API로 교체하기 쉽도록 ID, 대상, 판정 방식, 진행도, 보상 정보를
 * 각각 분리한 데모 응답 형태입니다. DAILY 2개와 SPECIAL 2개를 유지합니다.
 */
export const demoMissions = [
  {
    id: 1,
    missionKey: "first-market-visit",
    group: MISSION_GROUP.DAILY,
    category: MISSION_CATEGORY.VISIT,
    title: "오늘 중앙시장 최초 방문하기",
    description: "오늘 중앙시장에 방문한 첫 기록을 남겨보세요.",
    activationReason: "하루의 첫 방문이 시장을 다시 찾는 습관으로 이어져요.",
    status: MISSION_STATUS.CLAIMED,
    reward: 5,
    target: {
      type: MISSION_TARGET_TYPE.MARKET,
      marketId: 1,
      name: "대전 중앙시장",
      address: "대전광역시 동구 대전로 783",
    },
    verificationLabel: "GPS 위치와 일일 1회 방문 기록으로 확인",
    progress: { current: 1, target: 1, label: "방문 완료" },
    availability: { endsAtLabel: "오늘 자정까지" },
  },
  {
    id: 2,
    missionKey: "designated-store-visit",
    group: MISSION_GROUP.DAILY,
    category: MISSION_CATEGORY.EXPLORATION,
    title: "지정 점포 방문하기",
    description: "오늘 지정된 점포를 찾아 시장 골목을 탐색해보세요.",
    activationReason:
      "평소 지나치기 쉬운 점포를 새롭게 발견하도록 돕는 미션이에요.",
    status: MISSION_STATUS.IN_PROGRESS,
    reward: 7,
    target: {
      type: MISSION_TARGET_TYPE.STORE,
      storeId: 101,
      name: "온기상점",
      address: "대전 중앙시장 청년구단 1층",
    },
    verificationLabel: "지정 점포 반경 30m 이내 위치로 확인",
    progress: { current: 0, target: 1, label: "방문 전" },
    availability: { endsAtLabel: "오늘 자정까지" },
  },
  {
    id: 3,
    missionKey: "three-day-streak",
    group: MISSION_GROUP.SPECIAL,
    category: MISSION_CATEGORY.CHALLENGE,
    title: "3일 연속 시장 방문",
    description: "하루 한 번 시장을 방문해 3일 연속 기록을 완성해보세요.",
    activationReason: "연속 방문 기록이 자연스러운 재방문 계기를 만들어요.",
    status: MISSION_STATUS.IN_PROGRESS,
    reward: 5,
    target: {
      type: MISSION_TARGET_TYPE.MARKET,
      marketId: 1,
      name: "대전 중앙시장",
      address: "대전광역시 동구 대전로 783",
    },
    verificationLabel: "일별 시장 방문 기록으로 확인",
    progress: { current: 2, target: 3, label: "2 / 3" },
    availability: { endsAtLabel: "내일 방문 시 완료" },
  },
  {
    id: 4,
    missionKey: "market-stay-ten-minutes",
    group: MISSION_GROUP.SPECIAL,
    category: MISSION_CATEGORY.VISIT,
    title: "시장 10분 머무르기",
    description: "시장 안을 천천히 둘러보며 10분을 채워보세요.",
    activationReason:
      "시장에 머무는 시간이 늘수록 새로운 점포를 만날 가능성도 커져요.",
    status: MISSION_STATUS.AVAILABLE,
    reward: 5,
    target: {
      type: MISSION_TARGET_TYPE.MARKET,
      marketId: 1,
      name: "대전 중앙시장",
      address: "대전광역시 동구 대전로 783",
    },
    verificationLabel: "시장 구역 내 체류 시간으로 확인",
    progress: { current: 0, target: 600, label: "0분 / 10분" },
    availability: { endsAtLabel: "오늘 자정까지" },
  },
];

function validateDemoMissions(missions) {
  const missionIds = new Set(missions.map(({ id }) => id));
  const priorityCount = missions.filter(
    ({ group }) => group === MISSION_GROUP.SPECIAL,
  ).length;
  const validCategories = new Set(Object.values(MISSION_CATEGORY));
  const validStatuses = new Set(Object.values(MISSION_STATUS));

  if (missions.length !== 4) {
    throw new Error("데모 데일리 미션은 4개여야 합니다.");
  }

  if (priorityCount !== 2) {
    throw new Error("데모 우선 미션은 2개여야 합니다.");
  }

  if (missionIds.size !== missions.length) {
    throw new Error("데모 미션 ID는 중복될 수 없습니다.");
  }

  missions.forEach((mission) => {
    if (!validCategories.has(mission.category)) {
      throw new Error(`지원하지 않는 미션 카테고리입니다: ${mission.category}`);
    }

    if (!validStatuses.has(mission.status)) {
      throw new Error(`지원하지 않는 미션 상태입니다: ${mission.status}`);
    }
  });
}

validateDemoMissions(demoMissions);

export const missionCategoryGuides = [
  {
    id: MISSION_CATEGORY.VISIT,
    icon: "pin",
    title: "방문형",
    description: "시장 진입, 체류, 추천 점포 방문으로 실제 방문 시간을 늘려요.",
    example: "시장 첫 입장 · 추천 점포 방문",
  },
  {
    id: MISSION_CATEGORY.EXPLORATION,
    icon: "compass",
    title: "탐색형",
    description: "여러 점포와 지점을 이동하며 시장 구석구석을 발견해요.",
    example: "점포 3곳 · 끝에서 끝까지 탐험",
  },
  {
    id: MISSION_CATEGORY.CHALLENGE,
    icon: "flag",
    title: "도전형",
    description: "연속 방문과 선착순 참여로 재방문과 빠른 행동에 도전해요.",
    example: "3일 연속 방문 · 선착순 미션",
  },
  {
    id: MISSION_CATEGORY.OTHER,
    icon: "spark",
    title: "기타형",
    description: "무작위 추천을 통해 평소 몰랐던 점포를 새롭게 만나요.",
    example: "오늘의 랜덤 점포",
  },
];

export const demoChallengeRecords = [
  {
    id: "three-day-streak",
    title: "3일 연속 시장 방문",
    description: "하루 한 번 시장 방문을 기록해 연속 방문을 완성해요.",
    status: MISSION_STATUS.IN_PROGRESS,
    current: 2,
    target: 3,
    reward: 5,
    visits: [
      { day: "1일차", date: "8.26", completed: true },
      { day: "2일차", date: "8.27", completed: true },
      { day: "3일차", date: "8.28", completed: false },
    ],
  },
];

export const demoRankings = {
  weekly: {
    label: "주간",
    period: "8.24 - 8.30",
    currentUser: { rank: 17, nickname: "시장탐험가", points: 1240 },
    leaders: [
      { rank: 1, nickname: "골목대장", points: 3280 },
      { rank: 2, nickname: "대전러버", points: 3010 },
      { rank: 3, nickname: "온누리", points: 2840 },
      { rank: 4, nickname: "시장한바퀴", points: 2590 },
      { rank: 5, nickname: "단골예약", points: 2420 },
    ],
  },
  monthly: {
    label: "월간",
    period: "2026년 8월",
    currentUser: { rank: 11, nickname: "시장탐험가", points: 4860 },
    leaders: [
      { rank: 1, nickname: "온누리", points: 9320 },
      { rank: 2, nickname: "골목대장", points: 8750 },
      { rank: 3, nickname: "시장한바퀴", points: 8210 },
      { rank: 4, nickname: "대전러버", points: 7940 },
      { rank: 5, nickname: "장보기고수", points: 7480 },
    ],
  },
};

export function findDemoMission(missionId, missions = demoMissions) {
  return missions.find((mission) => String(mission.id) === String(missionId));
}

export function isMissionFinished(status) {
  return [MISSION_STATUS.COMPLETED, MISSION_STATUS.CLAIMED].includes(status);
}
