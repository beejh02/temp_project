package com.nurigo.nurigo.mission.service;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.nurigo.nurigo.mission.config.MissionRunCatalog;
import com.nurigo.nurigo.mission.dto.MissionResponse;
import com.nurigo.nurigo.mission.dto.MissionLocationRequest;
import com.nurigo.nurigo.mission.dto.RankingResponse;
import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionTargetType;
import com.nurigo.nurigo.mission.entity.RankingPeriod;
import com.nurigo.nurigo.market.service.MarketService;
import com.nurigo.nurigo.mission.policy.DailyMissionPolicy;
import com.nurigo.nurigo.mission.policy.MissionLocationPolicy;
import com.nurigo.nurigo.mission.runtime.MissionRunStateStore;
import com.nurigo.nurigo.mission.runtime.MissionRunStateStore.MissionStateSnapshot;
import com.nurigo.nurigo.mission.runtime.MissionRunStateStore.SessionAccess;
import com.nurigo.nurigo.store.dto.StoreResponse;
import com.nurigo.nurigo.store.service.StoreService;

@Service
public class MissionDemoService {

    private final MissionRunCatalog missionCatalog;
    private final DailyMissionPolicy dailyMissionPolicy;
    private final MissionLocationPolicy missionLocationPolicy;
    private final MissionRunStateStore runStateStore;
    private final MarketService marketService;
    private final StoreService storeService;

    public MissionDemoService(
            MissionRunCatalog missionCatalog,
            DailyMissionPolicy dailyMissionPolicy,
            MissionLocationPolicy missionLocationPolicy,
            MissionRunStateStore runStateStore,
            MarketService marketService,
            StoreService storeService
    ) {
        this.missionCatalog = missionCatalog;
        this.dailyMissionPolicy = dailyMissionPolicy;
        this.missionLocationPolicy = missionLocationPolicy;
        this.runStateStore = runStateStore;
        this.marketService = marketService;
        this.storeService = storeService;
    }

    public MissionSessionResult<List<MissionResponse>> getDailyMissions(
            String requestedSessionId
    ) {
        SessionAccess session = resolveSession(requestedSessionId);
        List<MissionDefinition> definitions = runStateStore
                .getAssignedMissionKeys(session.sessionId())
                .stream()
                .map(this::findDefinition)
                .sorted(Comparator.comparingInt(
                        MissionDefinition::getDisplayOrder
                ))
                .toList();
        List<MissionResponse> responses = definitions.stream()
                .map(definition -> toResponse(
                        session.sessionId(),
                        definition
                ))
                .toList();

        return result(session, responses);
    }

    public MissionSessionResult<List<MissionResponse>> recordLocation(
            String requestedSessionId,
            MissionLocationRequest request
    ) {
        SessionAccess session = resolveSession(requestedSessionId);
        validateCoordinates(request.latitude(), request.longitude());
        List<MissionDefinition> definitions = assignedDefinitions(
                session.sessionId()
        );
        Set<Long> marketIds = marketService.findMarketsAtLocation(
                request.latitude(),
                request.longitude()
        ).stream()
                .map(market -> market.id())
                .collect(Collectors.toSet());
        boolean needsNearbyStores = definitions.stream()
                .anyMatch(definition -> definition.getMissionKey()
                        .equals("three-store-exploration"));
        List<Long> nearbyStoreIds = needsNearbyStores
                ? storeService.findStoresNearLocation(
                        request.latitude(),
                        request.longitude(),
                        MissionLocationPolicy.STORE_RADIUS_METERS
                ).stream()
                        .map(StoreResponse::id)
                        .limit(1)
                        .toList()
                : List.of();

        for (MissionDefinition definition : definitions) {
            if (definition.getMissionKey().equals("three-store-exploration")) {
                if (marketIds.contains(definition.getTargetId())) {
                    runStateStore.recordNearbyStores(
                            session.sessionId(),
                            definition,
                            nearbyStoreIds
                    );
                }
                continue;
            }

            if (definition.getTargetType() == MissionTargetType.STORE) {
                if (missionLocationPolicy.isWithinStoreRadius(
                        definition,
                        request.latitude(),
                        request.longitude()
                )) {
                    runStateStore.completeMission(
                            session.sessionId(),
                            definition
                    );
                }
                continue;
            }

            if (marketIds.contains(definition.getTargetId())) {
                runStateStore.recordMarketPresence(
                        session.sessionId(),
                        definition,
                        request.recordedAt()
                );
            } else if (definition.getProgressTarget() == 600) {
                runStateStore.recordMarketExit(
                        session.sessionId(),
                        definition
                );
            }
        }

        return result(session, definitions.stream()
                .map(definition -> toResponse(
                        session.sessionId(),
                        definition
                ))
                .toList());
    }

    public MissionSessionResult<MissionResponse> claimReward(
            String requestedSessionId,
            Long missionId
    ) {
        SessionAccess session = resolveSession(requestedSessionId);
        MissionDefinition definition = findDefinition(missionId);
        runStateStore.claimReward(session.sessionId(), definition);

        return result(
                session,
                toResponse(session.sessionId(), definition)
        );
    }

    public MissionSessionResult<RankingResponse> getRanking(
            String requestedSessionId,
            String periodValue
    ) {
        SessionAccess session = resolveSession(requestedSessionId);
        RankingPeriod period = RankingPeriod.from(periodValue);
        MissionRunStateStore.RankingSnapshot snapshot
                = runStateStore.getRanking(session.sessionId(), period);
        RankingResponse response = new RankingResponse(
                period.getLabel(),
                snapshot.periodLabel(),
                new RankingResponse.CurrentParticipantResponse(
                        snapshot.currentRank(),
                        snapshot.nickname(),
                        snapshot.points()
                ),
                snapshot.leaders().stream()
                        .map(entry -> new RankingResponse.RankingEntryResponse(
                                entry.rank(),
                                entry.nickname(),
                                entry.points()
                        ))
                        .toList()
        );

        return result(session, response);
    }

    private SessionAccess resolveSession(String requestedSessionId) {
        return runStateStore.resolveSession(
                requestedSessionId,
                missionCatalog.getDefinitions(),
                dailyMissionPolicy
        );
    }

    private List<MissionDefinition> assignedDefinitions(String sessionId) {
        return runStateStore.getAssignedMissionKeys(sessionId)
                .stream()
                .map(this::findDefinition)
                .sorted(Comparator.comparingInt(
                        MissionDefinition::getDisplayOrder
                ))
                .toList();
    }

    private MissionResponse toResponse(
            String sessionId,
            MissionDefinition definition
    ) {
        MissionStateSnapshot state
                = runStateStore.getMissionState(sessionId, definition);
        boolean marketTarget
                = definition.getTargetType() == MissionTargetType.MARKET;
        MissionResponse.SharedStateResponse sharedState
                = state.sharedState() == null
                        ? null
                        : new MissionResponse.SharedStateResponse(
                                state.sharedState().status().getApiValue(),
                                state.sharedState().current(),
                                state.sharedState().target()
                        );

        return new MissionResponse(
                definition.getId(),
                definition.getMissionKey(),
                definition.getMissionGroup().getApiValue(),
                definition.getCategory().getApiValue(),
                definition.getTitle(),
                definition.getDescription(),
                definition.getActivationReason(),
                state.status().getApiValue(),
                definition.isShared(),
                sharedState,
                definition.getRewardPoints(),
                new MissionResponse.TargetResponse(
                        definition.getTargetType().getApiValue(),
                        marketTarget ? definition.getTargetId() : null,
                        marketTarget ? null : definition.getTargetId(),
                        definition.getTargetName(),
                        definition.getTargetAddress(),
                        new MissionResponse.LocationResponse(
                                definition.getTargetLatitude(),
                                definition.getTargetLongitude()
                        )
                ),
                definition.getVerificationLabel(),
                new MissionResponse.ProgressResponse(
                        state.current(),
                        definition.getProgressTarget(),
                        progressLabel(definition, state.current())
                ),
                new MissionResponse.AvailabilityResponse(
                        definition.getCapacity(),
                        state.remainingSlots(),
                        definition.getCapacity() == null
                                ? "서버 실행 종료까지"
                                : "남은 자리 소진 시 마감"
                )
        );
    }

    private String progressLabel(
            MissionDefinition definition,
            int current
    ) {
        int target = definition.getProgressTarget();

        if (definition.isShared()) {
            return "%d명 / %d명".formatted(current, target);
        }

        if (target == 600) {
            return "%d분 / %d분".formatted(current / 60, target / 60);
        }

        if (target == 1) {
            return current >= target ? "방문 완료" : "방문 전";
        }

        return "%d / %d".formatted(current, target);
    }

    private MissionDefinition findDefinition(Long missionId) {
        return missionCatalog.getDefinitions()
                .stream()
                .filter(definition -> definition.getId().equals(missionId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "미션을 찾을 수 없습니다: " + missionId
                ));
    }

    private MissionDefinition findDefinition(String missionKey) {
        return missionCatalog.getDefinitions()
                .stream()
                .filter(definition -> definition.getMissionKey()
                        .equals(missionKey))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "미션 정의를 찾을 수 없습니다: " + missionKey
                ));
    }

    private void validateCoordinates(double latitude, double longitude) {
        if (!Double.isFinite(latitude) || !Double.isFinite(longitude)) {
            throw new IllegalArgumentException("위치 좌표는 유한한 값이어야 합니다.");
        }

        if (latitude < -90 || latitude > 90
                || longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("위치 좌표 범위가 올바르지 않습니다.");
        }
    }

    private <T> MissionSessionResult<T> result(
            SessionAccess session,
            T data
    ) {
        return new MissionSessionResult<>(
                session.sessionId(),
                session.created(),
                data
        );
    }
}
