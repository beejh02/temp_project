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
import com.nurigo.nurigo.mission.config.DemoRunSeed;
import com.nurigo.nurigo.mission.config.MissionRunCatalog;
import com.nurigo.nurigo.mission.dto.MissionLocationRequest;
import com.nurigo.nurigo.mission.dto.MissionResponse;
import com.nurigo.nurigo.mission.dto.RankingResponse;
import com.nurigo.nurigo.mission.dto.ChallengeResponse;
import com.nurigo.nurigo.mission.policy.DailyMissionPolicy;
import com.nurigo.nurigo.mission.policy.MissionLocationPolicy;
import com.nurigo.nurigo.mission.runtime.MissionRunStateStore;
import com.nurigo.nurigo.store.dto.StoreResponse;
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
                        Instant.now()
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

    @Test
    void 시장_미션은_DB의_실제_ID와_Polygon_대표_좌표를_사용한다() {
        MissionDemoService service = createService();
        List<MissionResponse> marketMissions = service.getDailyMissions(null)
                .data()
                .stream()
                .filter(mission -> mission.target().type().equals("market"))
                .toList();

        assertFalse(marketMissions.isEmpty());
        assertTrue(marketMissions.stream().allMatch(mission ->
                mission.target().marketId().equals(77L)
        ));
        assertTrue(marketMissions.stream().allMatch(mission ->
                mission.target().location().latitude() == 36.33005
                && mission.target().location().longitude() == 127.43065
        ));
    }

    @Test
    void 오늘_시장_방문으로_도전을_완료하고_보상을_랭킹에_반영한다() {
        MissionDemoService service = createService();
        MissionSessionResult<List<ChallengeResponse>> initial
                = service.getChallenges(null);
        RankingResponse before = service.getRanking(
                initial.sessionId(),
                "weekly"
        ).data();

        service.recordLocation(
                initial.sessionId(),
                new MissionLocationRequest(
                        36.33005,
                        127.43065,
                        5,
                        Instant.now()
                )
        );
        ChallengeResponse completed = service.getChallenges(
                initial.sessionId()
        ).data().get(0);
        ChallengeResponse claimed = service.claimChallengeReward(
                initial.sessionId(),
                MissionDemoService.CHALLENGE_ID
        ).data();
        RankingResponse after = service.getRanking(
                initial.sessionId(),
                "weekly"
        ).data();

        assertEquals(2, initial.data().get(0).current());
        assertEquals("completed", completed.status());
        assertEquals("claimed", claimed.status());
        assertEquals(
                before.currentUser().points()
                + MissionDemoService.CHALLENGE_REWARD,
                after.currentUser().points()
        );
    }

    private MissionDemoService createService() {
        MarketService marketService = mock(MarketService.class);
        StoreService storeService = mock(StoreService.class);
        MarketResponse centralMarket = new MarketResponse(
                77L,
                "대전중앙시장",
                null,
                new MarketResponse.LocationResponse(
                        36.33005,
                        127.43065
                ),
                null,
                null
        );
        when(marketService.findAll()).thenReturn(List.of(centralMarket));
        when(marketService.findMarketsAtLocation(anyDouble(), anyDouble()))
                .thenReturn(List.of(centralMarket));
        when(storeService.findStoresNearLocation(
                anyDouble(),
                anyDouble(),
                anyDouble()
        )).thenReturn(List.of());
        when(storeService.findStoresInsideMarket(77L)).thenReturn(List.of(
                store(201L),
                store(202L),
                store(203L),
                store(204L)
        ));

        return new MissionDemoService(
                new MissionRunCatalog(
                        new DemoMissionCatalog(),
                        new MissionTargetResolver(
                                marketService,
                                storeService,
                                new DemoRunSeed("42")
                        )
                ),
                new DailyMissionPolicy(),
                new MissionLocationPolicy(),
                new MissionRunStateStore("42"),
                marketService,
                storeService
        );
    }

    private StoreResponse store(long id) {
        return new StoreResponse(
                id,
                "source-" + id,
                "실제 점포 " + id,
                null,
                "Q",
                "음식",
                null,
                null,
                null,
                null,
                "실제 주소 " + id,
                36.33005 + id / 1_000_000.0,
                127.43065 + id / 1_000_000.0
        );
    }
}
