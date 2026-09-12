package com.nurigo.nurigo.mission.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.LongStream;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.nurigo.nurigo.market.controller.MarketController;
import com.nurigo.nurigo.market.dto.MarketCreateRequest;
import com.nurigo.nurigo.market.dto.MarketResponse;
import com.nurigo.nurigo.market.entity.Market;
import com.nurigo.nurigo.market.service.MarketService;
import com.nurigo.nurigo.mission.config.DemoMissionCatalog;
import com.nurigo.nurigo.mission.config.DemoRunSeed;
import com.nurigo.nurigo.mission.config.MissionRunCatalog;
import com.nurigo.nurigo.mission.dto.MissionLocationRequest;
import com.nurigo.nurigo.mission.entity.MissionTargetType;
import com.nurigo.nurigo.mission.policy.DailyMissionPolicy;
import com.nurigo.nurigo.mission.policy.MissionLocationPolicy;
import com.nurigo.nurigo.mission.runtime.MissionRunStateStore;
import com.nurigo.nurigo.store.dto.StoreResponse;
import com.nurigo.nurigo.store.service.StoreService;
import com.nurigo.nurigo.wallet.dto.ExchangeRequest;
import com.nurigo.nurigo.wallet.service.WalletService;

class MissionMarketDeletionTest {
    private final MarketService markets = mock(MarketService.class);
    private final StoreService stores = mock(StoreService.class);
    private final DemoMissionCatalog templates = new DemoMissionCatalog();
    private final MissionRunCatalog catalog = new MissionRunCatalog(templates,
            new MissionTargetResolver(markets, stores, new DemoRunSeed("42")));
    private final DailyMissionPolicy policy = new DailyMissionPolicy();
    private final MissionRunStateStore state = new MissionRunStateStore("42");
    private final MissionDemoService missions = new MissionDemoService(catalog, policy,
            new MissionLocationPolicy(), state, markets, stores);
    private final WalletService wallet = new WalletService(state, catalog, policy);
    private final MarketController controller = new MarketController(markets,
            new MissionMarketCoordinator(templates, catalog));

    @Test
    void 대상_시장_삭제_후_미션만_제외하고_기존_지갑과_쿠폰은_유지한다() {
        var marketList = new ArrayList<>(List.of(market(77L, "대전중앙시장"), market(88L, "다른 시장")));
        when(markets.findAll()).thenAnswer(invocation -> List.copyOf(marketList));
        when(stores.findStoresInsideMarket(77L)).thenReturn(storeFixtures());
        doAnswer(invocation -> { marketList.removeIf(market -> market.id().equals(77L)); return null; })
                .when(markets).delete(77L);
        String session = missions.getDailyMissions(null).sessionId();
        for (var definition : catalog.getDefinitions()) {
            if (state.getAssignedMissionKeys(session).contains(definition.getMissionKey())) {
                state.completeMission(session, definition);
                missions.claimReward(session, definition.getId());
            }
        }
        Long oldMission = missions.getDailyMissions(session).data().get(0).id();
        wallet.exchange(session, new ExchangeRequest("snack", UUID.randomUUID()));
        var before = wallet.getWallet(session).data();
        var ranking = missions.getRanking(session, "weekly").data();

        assertEquals(204, controller.deleteMarket(77L).getStatusCode().value());
        assertEquals(List.of(88L), marketList.stream().map(MarketResponse::id).toList());
        assertTrue(missions.getDailyMissions(session).data().isEmpty());
        assertTrue(missions.getDailyMissions(null).data().isEmpty());
        assertTrue(missions.recordLocation(session,
                new MissionLocationRequest(36.33, 127.43, 5, Instant.now())).data().isEmpty());
        assertThrows(IllegalArgumentException.class, () -> missions.claimReward(session, oldMission));
        assertEquals(before, wallet.getWallet(session).data());
        assertEquals(ranking.currentUser().points(), missions.getRanking(session, "weekly").data().currentUser().points());
        assertFalse(wallet.getWallet(session).newSession());

        // 삭제 후 빈 결과가 캐시돼 있어도 관리자 재등록으로 새 ID에 다시 연결한다.
        Market created = mock(Market.class);
        when(created.getId()).thenReturn(99L);
        when(markets.create(any())).thenAnswer(invocation -> { marketList.add(market(99L, "대전 중앙시장")); return created; });
        when(stores.findStoresInsideMarket(99L)).thenReturn(storeFixtures());
        controller.createMarket(new MarketCreateRequest("대전 중앙시장", null));
        assertFalse(missions.getDailyMissions(session).data().isEmpty());
        assertTrue(catalog.getDefinitions().stream().filter(definition -> definition.getTargetType() == MissionTargetType.MARKET)
                .allMatch(definition -> definition.getTargetId().equals(99L)));
        assertEquals(before, wallet.getWallet(session).data());
    }

    @Test
    void 서버_시작부터_대상_시장이_없어도_빈_미션과_새_지갑을_조회한다() {
        when(markets.findAll()).thenReturn(List.of());
        var daily = missions.getDailyMissions(null);
        assertTrue(daily.newSession());
        assertTrue(daily.data().isEmpty());
        assertEquals(0, wallet.getWallet(daily.sessionId()).data().balance());
        assertFalse(missions.getChallenges(daily.sessionId()).data().isEmpty());
        assertNotNull(missions.getRanking(daily.sessionId(), "weekly").data());
        verifyNoInteractions(stores);
    }

    private MarketResponse market(Long id, String name) {
        return new MarketResponse(id, name, null, new MarketResponse.LocationResponse(36.33, 127.43), null, null);
    }

    private List<StoreResponse> storeFixtures() {
        return LongStream.rangeClosed(201, 206).mapToObj(id -> new StoreResponse(id, "source-" + id,
                "점포 " + id, null, "Q", "음식", null, null, null, null, "시장 주소", 36.33, 127.43)).toList();
    }
}
