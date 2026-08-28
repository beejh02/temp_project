package com.nurigo.nurigo.mission.service;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.nurigo.nurigo.mission.config.DemoMissionCatalog;
import com.nurigo.nurigo.mission.dto.MissionResponse;
import com.nurigo.nurigo.mission.dto.RankingResponse;
import com.nurigo.nurigo.mission.policy.DailyMissionPolicy;
import com.nurigo.nurigo.mission.runtime.MissionRunStateStore;

class MissionDemoServiceTest {

    @Test
    void 익명_세션의_미션_완료와_보상_수령을_랭킹에_반영한다() {
        MissionDemoService service = new MissionDemoService(
                new DemoMissionCatalog(),
                new DailyMissionPolicy(),
                new MissionRunStateStore("42")
        );
        MissionSessionResult<List<MissionResponse>> dailyResult
                = service.getDailyMissions(null);
        MissionResponse personalMission = dailyResult.data()
                .stream()
                .filter(mission -> !mission.shared())
                .findFirst()
                .orElseThrow();
        RankingResponse before = service.getRanking(
                dailyResult.sessionId(),
                "weekly"
        ).data();

        MissionResponse completed = service.completeMission(
                dailyResult.sessionId(),
                personalMission.id()
        ).data();
        MissionResponse claimed = service.claimReward(
                dailyResult.sessionId(),
                personalMission.id()
        ).data();
        RankingResponse after = service.getRanking(
                dailyResult.sessionId(),
                "weekly"
        ).data();

        assertTrue(dailyResult.newSession());
        assertEquals(4, dailyResult.data().size());
        assertEquals("completed", completed.status());
        assertEquals("claimed", claimed.status());
        assertEquals(
                before.currentUser().points() + personalMission.reward(),
                after.currentUser().points()
        );
    }

    @Test
    void 기존_세션을_다시_조회하면_같은_미션과_상태를_반환한다() {
        MissionDemoService service = new MissionDemoService(
                new DemoMissionCatalog(),
                new DailyMissionPolicy(),
                new MissionRunStateStore("42")
        );
        MissionSessionResult<List<MissionResponse>> first
                = service.getDailyMissions(null);
        MissionSessionResult<List<MissionResponse>> second
                = service.getDailyMissions(first.sessionId());

        assertFalse(second.newSession());
        assertEquals(
                first.data().stream().map(MissionResponse::id).toList(),
                second.data().stream().map(MissionResponse::id).toList()
        );
    }
}
