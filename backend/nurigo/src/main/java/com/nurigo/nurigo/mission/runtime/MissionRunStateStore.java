package com.nurigo.nurigo.mission.runtime;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionStatus;
import com.nurigo.nurigo.mission.entity.RankingPeriod;
import com.nurigo.nurigo.mission.policy.DailyMissionPolicy;

@Component
public class MissionRunStateStore {

    private static final String[] NICKNAME_PREFIXES = {
        "골목", "시장", "온누리", "단골", "장보기", "숨은가게"
    };
    private static final String[] NICKNAME_SUFFIXES = {
        "탐험가", "발견자", "산책자", "대장", "여행자", "친구"
    };
    private static final String[] BOT_NICKNAMES = {
        "골목대장", "대전러버", "온누리", "시장한바퀴", "단골예약"
    };

    private final long seed;
    private final Random runRandom;
    private final LocalDate runDate;
    private final Map<String, ParticipantSession> sessions
            = new LinkedHashMap<>();
    private final Map<String, SharedMissionState> sharedMissionStates
            = new HashMap<>();
    private final Map<String, RankingScore> rankingScores
            = new LinkedHashMap<>();

    private boolean initialized;
    private List<String> runSpecialMissionKeys = List.of();

    public MissionRunStateStore(
            @Value("${nurigo.demo-seed:}") String configuredSeed
    ) {
        this.seed = resolveSeed(configuredSeed);
        this.runRandom = new Random(seed);
        this.runDate = LocalDate.now(ZoneId.of("Asia/Seoul"));
    }

    public synchronized SessionAccess resolveSession(
            String requestedSessionId,
            List<MissionDefinition> definitions,
            DailyMissionPolicy policy
    ) {
        ensureInitialized(definitions, policy);

        if (requestedSessionId != null
                && sessions.containsKey(requestedSessionId)) {
            return new SessionAccess(requestedSessionId, false);
        }

        String sessionId = UUID.randomUUID().toString();
        List<MissionDefinition> personalMissions
                = policy.selectDailyMissions(
                        definitions,
                        new Random(runRandom.nextLong())
                );
        List<String> assignedMissionKeys = new ArrayList<>();
        personalMissions.stream()
                .map(MissionDefinition::getMissionKey)
                .forEach(assignedMissionKeys::add);
        assignedMissionKeys.addAll(runSpecialMissionKeys);

        Map<String, ParticipantMissionState> missionStates = new HashMap<>();
        assignedMissionKeys.forEach(key -> missionStates.put(
                key,
                new ParticipantMissionState()
        ));

        String nickname = createNickname();
        ParticipantSession session = new ParticipantSession(
                sessionId,
                nickname,
                List.copyOf(assignedMissionKeys),
                missionStates
        );
        sessions.put(sessionId, session);
        rankingScores.put(
                sessionId,
                new RankingScore(
                        sessionId,
                        nickname,
                        runRandom.nextInt(80, 181),
                        runRandom.nextInt(320, 721)
                )
        );

        return new SessionAccess(sessionId, true);
    }

    public synchronized List<String> getAssignedMissionKeys(
            String sessionId
    ) {
        return requireSession(sessionId).assignedMissionKeys();
    }

    public synchronized MissionStateSnapshot getMissionState(
            String sessionId,
            MissionDefinition definition
    ) {
        ParticipantSession session = requireSession(sessionId);
        ParticipantMissionState participantState
                = requireAssignedMission(session, definition);

        if (!definition.isShared()) {
            return new MissionStateSnapshot(
                    participantState.status,
                    participantState.current,
                    null,
                    null
            );
        }

        SharedMissionState sharedState = requireSharedState(definition);
        MissionStatus participantStatus = participantState.status;

        if (participantStatus == MissionStatus.AVAILABLE
                && sharedState.status == MissionStatus.COMPLETED) {
            participantStatus = MissionStatus.CLOSED;
        }

        Integer remainingSlots = definition.getCapacity() == null
                ? null
                : Math.max(
                        definition.getCapacity() - sharedState.current,
                        0
                );

        return new MissionStateSnapshot(
                participantStatus,
                sharedState.current,
                remainingSlots,
                new SharedStateSnapshot(
                        sharedState.status,
                        sharedState.current,
                        sharedState.target
                )
        );
    }

    public synchronized MissionStateSnapshot completeMission(
            String sessionId,
            MissionDefinition definition
    ) {
        ParticipantSession session = requireSession(sessionId);
        ParticipantMissionState participantState
                = requireAssignedMission(session, definition);

        if (participantState.status == MissionStatus.COMPLETED
                || participantState.status == MissionStatus.CLAIMED) {
            return getMissionState(sessionId, definition);
        }

        if (!definition.isShared()) {
            participantState.current = definition.getProgressTarget();
            participantState.status = MissionStatus.COMPLETED;
            return getMissionState(sessionId, definition);
        }

        SharedMissionState sharedState = requireSharedState(definition);

        if (sharedState.current >= sharedState.target) {
            participantState.status = MissionStatus.CLOSED;
            return getMissionState(sessionId, definition);
        }

        if (sharedState.completedSessionIds.add(sessionId)) {
            sharedState.current++;
            sharedState.status = sharedState.current >= sharedState.target
                    ? MissionStatus.COMPLETED
                    : MissionStatus.IN_PROGRESS;
        }

        participantState.current = definition.getProgressTarget();
        participantState.status = MissionStatus.COMPLETED;

        return getMissionState(sessionId, definition);
    }

    public synchronized MissionStateSnapshot claimReward(
            String sessionId,
            MissionDefinition definition
    ) {
        ParticipantSession session = requireSession(sessionId);
        ParticipantMissionState participantState
                = requireAssignedMission(session, definition);

        if (participantState.status == MissionStatus.CLAIMED) {
            return getMissionState(sessionId, definition);
        }

        if (participantState.status != MissionStatus.COMPLETED) {
            throw new IllegalStateException(
                    "완료한 미션의 보상만 수령할 수 있습니다."
            );
        }

        participantState.status = MissionStatus.CLAIMED;
        RankingScore rankingScore = rankingScores.get(sessionId);
        rankingScore.weeklyPoints += definition.getRewardPoints();
        rankingScore.monthlyPoints += definition.getRewardPoints();

        return getMissionState(sessionId, definition);
    }

    public synchronized MissionStateSnapshot recordMarketPresence(
            String sessionId,
            MissionDefinition definition,
            Instant recordedAt
    ) {
        ParticipantSession session = requireSession(sessionId);
        ParticipantMissionState participantState
                = requireAssignedMission(session, definition);

        if (participantState.status == MissionStatus.COMPLETED
                || participantState.status == MissionStatus.CLAIMED) {
            return getMissionState(sessionId, definition);
        }

        if (definition.isShared()
                || definition.getProgressTarget() == 1) {
            return completeMission(sessionId, definition);
        }

        if (definition.getProgressTarget() != 600) {
            return getMissionState(sessionId, definition);
        }

        if (participantState.lastMarketObservationAt != null) {
            long elapsedSeconds = Duration.between(
                    participantState.lastMarketObservationAt,
                    recordedAt
            ).getSeconds();

            if (elapsedSeconds <= 0) {
                return getMissionState(sessionId, definition);
            }

            participantState.current = Math.min(
                    definition.getProgressTarget(),
                    participantState.current
                    + (int) Math.min(elapsedSeconds, 30)
            );
        }

        participantState.lastMarketObservationAt = recordedAt;
        participantState.status
                = participantState.current >= definition.getProgressTarget()
                        ? MissionStatus.COMPLETED
                        : MissionStatus.IN_PROGRESS;

        return getMissionState(sessionId, definition);
    }

    public synchronized void recordMarketExit(
            String sessionId,
            MissionDefinition definition
    ) {
        ParticipantSession session = requireSession(sessionId);
        ParticipantMissionState participantState
                = requireAssignedMission(session, definition);
        participantState.lastMarketObservationAt = null;
    }

    public synchronized MissionStateSnapshot recordNearbyStores(
            String sessionId,
            MissionDefinition definition,
            Collection<Long> storeIds
    ) {
        ParticipantSession session = requireSession(sessionId);
        ParticipantMissionState participantState
                = requireAssignedMission(session, definition);

        if (participantState.status == MissionStatus.COMPLETED
                || participantState.status == MissionStatus.CLAIMED) {
            return getMissionState(sessionId, definition);
        }

        participantState.visitedStoreIds.addAll(storeIds);
        participantState.current = Math.min(
                definition.getProgressTarget(),
                participantState.visitedStoreIds.size()
        );

        if (participantState.current >= definition.getProgressTarget()) {
            participantState.status = MissionStatus.COMPLETED;
        } else if (participantState.current > 0) {
            participantState.status = MissionStatus.IN_PROGRESS;
        }

        return getMissionState(sessionId, definition);
    }

    public synchronized RankingSnapshot getRanking(
            String sessionId,
            RankingPeriod period
    ) {
        requireSession(sessionId);
        List<RankingScore> sorted = rankingScores.values()
                .stream()
                .sorted(Comparator
                        .comparingInt((RankingScore score) -> score.points(period))
                        .reversed()
                        .thenComparing(score -> score.nickname))
                .toList();
        int currentRank = 0;
        RankingScore currentScore = null;
        List<RankingEntrySnapshot> leaders = new ArrayList<>();

        for (int index = 0; index < sorted.size(); index++) {
            RankingScore score = sorted.get(index);
            int rank = index + 1;

            if (score.id.equals(sessionId)) {
                currentRank = rank;
                currentScore = score;
            }

            if (rank <= 5) {
                leaders.add(new RankingEntrySnapshot(
                        rank,
                        score.nickname,
                        score.points(period)
                ));
            }
        }

        if (currentScore == null) {
            throw new IllegalStateException("랭킹 참여 상태를 찾을 수 없습니다.");
        }

        return new RankingSnapshot(
                currentRank,
                currentScore.nickname,
                currentScore.points(period),
                List.copyOf(leaders),
                periodLabel(period)
        );
    }

    public long getSeed() {
        return seed;
    }

    private void ensureInitialized(
            List<MissionDefinition> definitions,
            DailyMissionPolicy policy
    ) {
        if (initialized) {
            return;
        }

        List<MissionDefinition> specialMissions
                = policy.selectRunSpecialMissions(
                        definitions,
                        new Random(runRandom.nextLong())
                );
        runSpecialMissionKeys = specialMissions.stream()
                .map(MissionDefinition::getMissionKey)
                .toList();
        specialMissions.stream()
                .filter(MissionDefinition::isShared)
                .forEach(definition -> sharedMissionStates.put(
                        definition.getMissionKey(),
                        new SharedMissionState(definition.getProgressTarget())
                ));
        initializeBotRankings();
        initialized = true;
    }

    private void initializeBotRankings() {
        for (int index = 0; index < BOT_NICKNAMES.length; index++) {
            String id = "demo-ranking-" + index;
            int weeklyPoints = runRandom.nextInt(190, 361);
            int monthlyPoints = weeklyPoints + runRandom.nextInt(500, 1001);
            rankingScores.put(
                    id,
                    new RankingScore(
                            id,
                            BOT_NICKNAMES[index],
                            weeklyPoints,
                            monthlyPoints
                    )
            );
        }
    }

    private ParticipantSession requireSession(String sessionId) {
        ParticipantSession session = sessions.get(sessionId);

        if (session == null) {
            throw new IllegalArgumentException("익명 미션 세션을 찾을 수 없습니다.");
        }

        return session;
    }

    private ParticipantMissionState requireAssignedMission(
            ParticipantSession session,
            MissionDefinition definition
    ) {
        ParticipantMissionState state
                = session.missionStates().get(definition.getMissionKey());

        if (state == null) {
            throw new IllegalArgumentException(
                    "현재 세션에 배정되지 않은 미션입니다."
            );
        }

        return state;
    }

    private SharedMissionState requireSharedState(
            MissionDefinition definition
    ) {
        SharedMissionState state
                = sharedMissionStates.get(definition.getMissionKey());

        if (state == null) {
            throw new IllegalStateException(
                    "공동 미션 실행 상태가 초기화되지 않았습니다."
            );
        }

        return state;
    }

    private String createNickname() {
        String prefix = NICKNAME_PREFIXES[
                runRandom.nextInt(NICKNAME_PREFIXES.length)
        ];
        String suffix = NICKNAME_SUFFIXES[
                runRandom.nextInt(NICKNAME_SUFFIXES.length)
        ];

        return prefix + suffix + runRandom.nextInt(10, 100);
    }

    private String periodLabel(RankingPeriod period) {
        if (period == RankingPeriod.MONTHLY) {
            return "%d년 %d월".formatted(
                    runDate.getYear(),
                    runDate.getMonthValue()
            );
        }

        LocalDate start = runDate.minusDays(runDate.getDayOfWeek().getValue() - 1L);
        LocalDate end = start.plusDays(6);

        return "%d.%d - %d.%d".formatted(
                start.getMonthValue(),
                start.getDayOfMonth(),
                end.getMonthValue(),
                end.getDayOfMonth()
        );
    }

    private long resolveSeed(String configuredSeed) {
        if (configuredSeed == null || configuredSeed.isBlank()) {
            return new SecureRandom().nextLong();
        }

        try {
            return Long.parseLong(configuredSeed);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException(
                    "nurigo.demo-seed는 정수여야 합니다.",
                    exception
            );
        }
    }

    public record SessionAccess(
            String sessionId,
            boolean created
            ) {
    }

    public record MissionStateSnapshot(
            MissionStatus status,
            int current,
            Integer remainingSlots,
            SharedStateSnapshot sharedState
            ) {
    }

    public record SharedStateSnapshot(
            MissionStatus status,
            int current,
            int target
            ) {
    }

    public record RankingSnapshot(
            int currentRank,
            String nickname,
            int points,
            List<RankingEntrySnapshot> leaders,
            String periodLabel
            ) {
    }

    public record RankingEntrySnapshot(
            int rank,
            String nickname,
            int points
            ) {
    }

    private record ParticipantSession(
            String id,
            String nickname,
            List<String> assignedMissionKeys,
            Map<String, ParticipantMissionState> missionStates
            ) {
    }

    private static final class ParticipantMissionState {

        private MissionStatus status = MissionStatus.AVAILABLE;
        private int current;
        private Instant lastMarketObservationAt;
        private final Set<Long> visitedStoreIds = new LinkedHashSet<>();
    }

    private static final class SharedMissionState {

        private final int target;
        private final Set<String> completedSessionIds = new LinkedHashSet<>();
        private MissionStatus status = MissionStatus.AVAILABLE;
        private int current;

        private SharedMissionState(int target) {
            this.target = target;
        }
    }

    private static final class RankingScore {

        private final String id;
        private final String nickname;
        private int weeklyPoints;
        private int monthlyPoints;

        private RankingScore(
                String id,
                String nickname,
                int weeklyPoints,
                int monthlyPoints
        ) {
            this.id = id;
            this.nickname = nickname;
            this.weeklyPoints = weeklyPoints;
            this.monthlyPoints = monthlyPoints;
        }

        private int points(RankingPeriod period) {
            return period == RankingPeriod.WEEKLY
                    ? weeklyPoints
                    : monthlyPoints;
        }
    }
}
