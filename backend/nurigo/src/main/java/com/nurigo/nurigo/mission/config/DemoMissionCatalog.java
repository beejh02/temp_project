package com.nurigo.nurigo.mission.config;

import java.util.List;

import org.springframework.stereotype.Component;

import com.nurigo.nurigo.mission.entity.MissionCategory;
import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionGroup;
import com.nurigo.nurigo.mission.entity.MissionTargetType;

@Component
public class DemoMissionCatalog {

    private final List<MissionDefinition> definitions = List.of(
            mission(
                    1L, "first-market-visit", MissionGroup.DAILY,
                    MissionCategory.VISIT, "오늘 중앙시장 최초 방문하기",
                    "오늘 중앙시장에 방문한 첫 기록을 남겨보세요.",
                    "하루의 첫 방문이 시장을 다시 찾는 습관으로 이어져요.",
                    5, MissionTargetType.MARKET, 1L, "대전 중앙시장",
                    "대전광역시 동구 대전로 783", 36.3275, 127.4274,
                    "GPS 위치와 일일 1회 방문 기록으로 확인",
                    1, null, 1, false
            ),
            mission(
                    2L, "designated-store-visit", MissionGroup.DAILY,
                    MissionCategory.EXPLORATION, "지정 점포 방문하기",
                    "오늘 지정된 점포를 찾아 시장 골목을 탐색해보세요.",
                    "평소 지나치기 쉬운 점포를 새롭게 발견하도록 돕는 미션이에요.",
                    7, MissionTargetType.STORE, 101L, "온기상점",
                    "대전 중앙시장 청년구단 1층", 36.32785, 127.4284,
                    "지정 점포 반경 30m 이내 위치로 확인",
                    1, null, 2, false
            ),
            mission(
                    5L, "three-store-exploration", MissionGroup.DAILY,
                    MissionCategory.EXPLORATION, "점포 3곳 둘러보기",
                    "서로 다른 점포 세 곳을 찾아 시장 골목을 둘러보세요.",
                    "여러 점포를 잇는 이동이 시장 전체 탐색을 도와요.",
                    8, MissionTargetType.MARKET, 1L, "대전 중앙시장",
                    "대전광역시 동구 대전로 783", 36.3275, 127.4274,
                    "서로 다른 점포 3곳의 접근 기록으로 확인",
                    3, null, 3, false
            ),
            mission(
                    6L, "random-hidden-store", MissionGroup.DAILY,
                    MissionCategory.OTHER, "오늘의 랜덤 점포 찾기",
                    "오늘 추천된 숨은 점포를 찾아가 보세요.",
                    "무작위 추천이 평소 몰랐던 가게와의 만남을 만들어요.",
                    6, MissionTargetType.STORE, 103L, "골목제과",
                    "대전 중앙시장 골목 안쪽", 36.32735, 127.4279,
                    "추천 점포 반경 30m 이내 위치로 확인",
                    1, null, 4, false
            ),
            mission(
                    3L, "first-three-store-visit", MissionGroup.SPECIAL,
                    MissionCategory.CHALLENGE, "선착순 3명 지정 점포 방문",
                    "남은 자리 안에 오늘의 지정 점포를 방문해보세요.",
                    "선착순 참여가 지금 시장을 방문해야 할 계기를 만들어요.",
                    9, MissionTargetType.STORE, 102L, "황금찬 반찬가게",
                    "대전 중앙시장 먹자골목", 36.3271, 127.42675,
                    "지정 점포 접근과 서버 완료 순서로 확인",
                    3, 3, 5, true
            ),
            mission(
                    4L, "market-stay-ten-minutes", MissionGroup.SPECIAL,
                    MissionCategory.VISIT, "시장 10분 머무르기",
                    "시장 안을 천천히 둘러보며 10분을 채워보세요.",
                    "시장에 머무는 시간이 늘수록 새로운 점포를 만날 가능성도 커져요.",
                    5, MissionTargetType.MARKET, 1L, "대전 중앙시장",
                    "대전광역시 동구 대전로 783", 36.3275, 127.4274,
                    "시장 구역 내 체류 시간으로 확인",
                    600, null, 6, false
            ),
            mission(
                    7L, "community-market-exploration", MissionGroup.SPECIAL,
                    MissionCategory.CHALLENGE, "함께 시장 탐험 5명 달성",
                    "다섯 명의 탐험가가 시장 방문을 완료하면 공동 목표가 달성돼요.",
                    "함께 채우는 목표가 시장 방문의 재미와 참여감을 높여요.",
                    8, MissionTargetType.MARKET, 1L, "대전 중앙시장",
                    "대전광역시 동구 대전로 783", 36.3275, 127.4274,
                    "익명 세션별 시장 방문 완료 기록으로 확인",
                    5, 5, 7, true
            ),
            mission(
                    8L, "hidden-store-bonus", MissionGroup.SPECIAL,
                    MissionCategory.OTHER, "숨은 가게 보너스 방문",
                    "골목 안쪽 보너스 점포를 찾아 추가 포인트를 받아보세요.",
                    "방문이 적은 구역으로 탐색 범위를 넓히는 미션이에요.",
                    10, MissionTargetType.STORE, 104L, "은하잡화",
                    "대전 중앙시장 동쪽 골목", 36.3277, 127.4269,
                    "보너스 점포 반경 30m 이내 위치로 확인",
                    1, null, 8, false
            )
    );

    public List<MissionDefinition> getDefinitions() {
        return definitions;
    }

    private MissionDefinition mission(
            Long id,
            String missionKey,
            MissionGroup group,
            MissionCategory category,
            String title,
            String description,
            String activationReason,
            int rewardPoints,
            MissionTargetType targetType,
            Long targetId,
            String targetName,
            String targetAddress,
            double targetLatitude,
            double targetLongitude,
            String verificationLabel,
            int progressTarget,
            Integer capacity,
            int displayOrder,
            boolean shared
    ) {
        return new MissionDefinition(
                id, missionKey, group, category, title, description,
                activationReason, rewardPoints, targetType, targetId,
                targetName, targetAddress, targetLatitude, targetLongitude,
                verificationLabel, progressTarget, capacity, displayOrder,
                shared
        );
    }
}
