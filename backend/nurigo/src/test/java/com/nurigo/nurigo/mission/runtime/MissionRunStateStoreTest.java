package com.nurigo.nurigo.mission.runtime;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import org.junit.jupiter.api.Test;

import com.nurigo.nurigo.mission.config.DemoMissionCatalog;
import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionGroup;
import com.nurigo.nurigo.mission.entity.MissionStatus;
import com.nurigo.nurigo.mission.policy.DailyMissionPolicy;

class MissionRunStateStoreTest {

    private final List<MissionDefinition> definitions
            = new DemoMissionCatalog().getDefinitions();
    private final DailyMissionPolicy policy = new DailyMissionPolicy();

    @Test
    void 개인_미션은_세션별로_분리하고_공동_진행도는_공유한다() {
        MissionRunStateStore store = new MissionRunStateStore("42");
        MissionRunStateStore.SessionAccess first
                = store.resolveSession(null, definitions, policy);
        MissionRunStateStore.SessionAccess second
                = store.resolveSession(null, definitions, policy);
        MissionDefinition sharedMission = assignedDefinitions(store, first)
                .stream()
                .filter(MissionDefinition::isShared)
                .findFirst()
                .orElseThrow();
        MissionDefinition personalSpecial = assignedDefinitions(store, first)
                .stream()
                .filter(definition -> definition.getMissionGroup()
                == MissionGroup.SPECIAL)
                .filter(definition -> !definition.isShared())
                .findFirst()
                .orElseThrow();

        store.completeMission(first.sessionId(), sharedMission);
        store.completeMission(first.sessionId(), personalSpecial);

        assertNotEquals(first.sessionId(), second.sessionId());
        assertEquals(
                1,
                store.getMissionState(second.sessionId(), sharedMission)
                        .sharedState()
                        .current()
        );
        assertEquals(
                MissionStatus.AVAILABLE,
                store.getMissionState(second.sessionId(), personalSpecial)
                        .status()
        );
    }

    @Test
    void 같은_세션은_상태를_유지하고_서버_실행이_바뀌면_초기화한다() {
        MissionRunStateStore firstRun = new MissionRunStateStore("42");
        MissionRunStateStore.SessionAccess firstSession
                = firstRun.resolveSession(null, definitions, policy);
        MissionDefinition sharedMission
                = assignedDefinitions(firstRun, firstSession)
                        .stream()
                        .filter(MissionDefinition::isShared)
                        .findFirst()
                        .orElseThrow();
        firstRun.completeMission(firstSession.sessionId(), sharedMission);

        MissionRunStateStore.SessionAccess reusedSession
                = firstRun.resolveSession(
                        firstSession.sessionId(),
                        definitions,
                        policy
                );
        MissionRunStateStore nextRun = new MissionRunStateStore("42");
        MissionRunStateStore.SessionAccess nextSession
                = nextRun.resolveSession(null, definitions, policy);

        assertEquals(firstSession.sessionId(), reusedSession.sessionId());
        assertEquals(
                1,
                firstRun.getMissionState(
                        reusedSession.sessionId(),
                        sharedMission
                ).current()
        );
        assertEquals(
                0,
                nextRun.getMissionState(
                        nextSession.sessionId(),
                        sharedMission
                ).current()
        );
    }

    @Test
    void 시장_체류는_관측_간격을_누적하고_이탈하면_연속_측정을_끊는다() {
        AssignedFixture fixture = fixtureWithMission(
                "market-stay-ten-minutes"
        );
        Instant startedAt = Instant.parse("2026-08-29T00:00:00Z");

        fixture.store().recordMarketPresence(
                fixture.session().sessionId(),
                fixture.mission(),
                startedAt
        );
        fixture.store().recordMarketPresence(
                fixture.session().sessionId(),
                fixture.mission(),
                startedAt.plusSeconds(30)
        );
        fixture.store().recordMarketExit(
                fixture.session().sessionId(),
                fixture.mission()
        );
        MissionRunStateStore.MissionStateSnapshot reentered
                = fixture.store().recordMarketPresence(
                        fixture.session().sessionId(),
                        fixture.mission(),
                        startedAt.plusSeconds(300)
                );

        assertEquals(30, reentered.current());

        MissionRunStateStore.MissionStateSnapshot completed = reentered;
        for (int index = 1; index <= 19; index++) {
            completed = fixture.store().recordMarketPresence(
                    fixture.session().sessionId(),
                    fixture.mission(),
                    startedAt.plusSeconds(300L + index * 30L)
            );
        }

        assertEquals(600, completed.current());
        assertEquals(MissionStatus.COMPLETED, completed.status());
    }

    @Test
    void 점포_탐색은_같은_점포를_중복_집계하지_않는다() {
        AssignedFixture fixture = fixtureWithMission(
                "three-store-exploration"
        );

        MissionRunStateStore.MissionStateSnapshot first
                = fixture.store().recordNearbyStores(
                        fixture.session().sessionId(),
                        fixture.mission(),
                        List.of(101L, 101L)
                );
        MissionRunStateStore.MissionStateSnapshot second
                = fixture.store().recordNearbyStores(
                        fixture.session().sessionId(),
                        fixture.mission(),
                        List.of(101L, 102L)
                );
        MissionRunStateStore.MissionStateSnapshot third
                = fixture.store().recordNearbyStores(
                        fixture.session().sessionId(),
                        fixture.mission(),
                        List.of(103L)
                );

        assertEquals(1, first.current());
        assertEquals(2, second.current());
        assertEquals(3, third.current());
        assertEquals(MissionStatus.COMPLETED, third.status());
    }

    @Test
    void 공동_미션이_마감된_뒤의_위치_판정은_오류_없이_마감_상태를_반환한다() {
        AssignedFixture fixture = fixtureWithMission(
                "first-three-store-visit"
        );
        MissionRunStateStore.SessionAccess second = fixture.store()
                .resolveSession(null, definitions, policy);
        MissionRunStateStore.SessionAccess third = fixture.store()
                .resolveSession(null, definitions, policy);
        MissionRunStateStore.SessionAccess late = fixture.store()
                .resolveSession(null, definitions, policy);

        fixture.store().completeMission(
                fixture.session().sessionId(),
                fixture.mission()
        );
        fixture.store().completeMission(second.sessionId(), fixture.mission());
        fixture.store().completeMission(third.sessionId(), fixture.mission());
        MissionRunStateStore.MissionStateSnapshot closed
                = fixture.store().completeMission(
                        late.sessionId(),
                        fixture.mission()
                );

        assertEquals(MissionStatus.CLOSED, closed.status());
        assertEquals(3, closed.current());
    }

    private List<MissionDefinition> assignedDefinitions(
            MissionRunStateStore store,
            MissionRunStateStore.SessionAccess session
    ) {
        return store.getAssignedMissionKeys(session.sessionId())
                .stream()
                .map(key -> definitions.stream()
                .filter(definition -> definition.getMissionKey()
                .equals(key))
                .findFirst()
                .orElseThrow())
                .toList();
    }

    private AssignedFixture fixtureWithMission(String missionKey) {
        for (int seed = 0; seed < 200; seed++) {
            MissionRunStateStore store = new MissionRunStateStore(
                    String.valueOf(seed)
            );
            MissionRunStateStore.SessionAccess session
                    = store.resolveSession(null, definitions, policy);
            MissionDefinition mission = assignedDefinitions(store, session)
                    .stream()
                    .filter(definition -> definition.getMissionKey()
                            .equals(missionKey))
                    .findFirst()
                    .orElse(null);

            if (mission != null) {
                return new AssignedFixture(store, session, mission);
            }
        }

        throw new IllegalStateException(
                "테스트 미션을 배정하는 시드를 찾지 못했습니다: "
                + missionKey
        );
    }

    private record AssignedFixture(
            MissionRunStateStore store,
            MissionRunStateStore.SessionAccess session,
            MissionDefinition mission
            ) {
    }
}
