package com.nurigo.nurigo.mission.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.nurigo.nurigo.mission.config.DemoMissionCatalog;
import com.nurigo.nurigo.mission.dto.MissionResponse;
import com.nurigo.nurigo.mission.dto.RankingResponse;
import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionTargetType;
import com.nurigo.nurigo.mission.entity.RankingPeriod;
import com.nurigo.nurigo.mission.policy.DailyMissionPolicy;
import com.nurigo.nurigo.mission.runtime.MissionRunStateStore;
import com.nurigo.nurigo.mission.runtime.MissionRunStateStore.MissionStateSnapshot;
import com.nurigo.nurigo.mission.runtime.MissionRunStateStore.SessionAccess;

@Service
public class MissionDemoService {

    private final DemoMissionCatalog missionCatalog;
    private final DailyMissionPolicy dailyMissionPolicy;
    private final MissionRunStateStore runStateStore;

    public MissionDemoService(
            DemoMissionCatalog missionCatalog,
            DailyMissionPolicy dailyMissionPolicy,
            MissionRunStateStore runStateStore
    ) {
        this.missionCatalog = missionCatalog;
        this.dailyMissionPolicy = dailyMissionPolicy;
        this.runStateStore = runStateStore;
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

    public MissionSessionResult<MissionResponse> completeMission(
            String requestedSessionId,
            Long missionId
    ) {
        SessionAccess session = resolveSession(requestedSessionId);
        MissionDefinition definition = findDefinition(missionId);
        runStateStore.completeMission(session.sessionId(), definition);

        return result(
                session,
                toResponse(session.sessionId(), definition)
        );
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
