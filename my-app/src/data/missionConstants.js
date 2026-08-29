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

export function findMission(missionId, missions) {
  return missions.find((mission) => String(mission.id) === String(missionId));
}

export function isMissionFinished(status) {
  return [MISSION_STATUS.COMPLETED, MISSION_STATUS.CLAIMED].includes(status);
}
