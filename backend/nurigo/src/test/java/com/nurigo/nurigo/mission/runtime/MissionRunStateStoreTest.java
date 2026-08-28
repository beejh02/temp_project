package com.nurigo.nurigo.mission.runtime;

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
}
