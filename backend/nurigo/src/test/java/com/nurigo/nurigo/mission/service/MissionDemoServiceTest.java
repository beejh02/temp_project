package com.nurigo.nurigo.mission.service;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.Test;

import com.nurigo.nurigo.market.dto.MarketResponse;
import com.nurigo.nurigo.market.service.MarketService;
import com.nurigo.nurigo.mission.config.DemoMissionCatalog;
import com.nurigo.nurigo.mission.dto.MissionLocationRequest;
import com.nurigo.nurigo.mission.dto.MissionResponse;
import com.nurigo.nurigo.mission.dto.RankingResponse;
import com.nurigo.nurigo.mission.policy.DailyMissionPolicy;
import com.nurigo.nurigo.mission.policy.MissionLocationPolicy;
import com.nurigo.nurigo.mission.runtime.MissionRunStateStore;
import com.nurigo.nurigo.store.service.StoreService;

class MissionDemoServiceTest {

    @Test
    void GPS_위치로_미션을_완료하고_보상을_랭킹에_반영한다() {
        MissionDemoService service = createService();
        MissionSessionResult<List<MissionResponse>> dailyResult
                = service.getDailyMissions(null);
        MissionResponse personalMission = dailyResult.data()
                .stream()
                .filter(mission -> !mission.shared())
                .filter(mission -> mission.progress().target() == 1)
                .findFirst()
                .orElseThrow();
        RankingResponse before = service.getRanking(
                dailyResult.sessionId(),
                "weekly"
        ).data();

        List<MissionResponse> locationResult = service.recordLocation(
                dailyResult.sessionId(),
                new MissionLocationRequest(
                        personalMission.target().location().latitude(),
                        personalMission.target().location().longitude(),
                        5,
                        Instant.parse("2026-08-29T00:00:00Z")
                )
        ).data();
        MissionResponse completed = locationResult.stream()
                .filter(mission -> mission.id().equals(personalMission.id()))
                .findFirst()
                .orElseThrow();
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
        MissionDemoService service = createService();
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

    private MissionDemoService createService() {
        MarketService marketService = mock(MarketService.class);
        StoreService storeService = mock(StoreService.class);
        when(marketService.findMarketsAtLocation(anyDouble(), anyDouble()))
                .thenReturn(List.of(new MarketResponse(
                        1L,
                        "테스트 시장",
                        null,
                        null,
                        null
                )));
        when(storeService.findStoresNearLocation(
                anyDouble(),
                anyDouble(),
                anyDouble()
        )).thenReturn(List.of());

        return new MissionDemoService(
                new DemoMissionCatalog(),
                new DailyMissionPolicy(),
                new MissionLocationPolicy(),
                new MissionRunStateStore("42"),
                marketService,
                storeService
        );
    }
}
