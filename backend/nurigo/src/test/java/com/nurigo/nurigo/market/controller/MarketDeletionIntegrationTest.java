package com.nurigo.nurigo.market.controller;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.*;
import com.nurigo.nurigo.market.repository.MarketRepository;
import com.nurigo.nurigo.mission.config.MissionRunCatalog;
import com.nurigo.nurigo.mission.entity.MissionTargetType;
import com.nurigo.nurigo.mission.service.MissionDemoService;
import com.nurigo.nurigo.store.repository.StoreRepository;
import com.nurigo.nurigo.wallet.service.WalletService;

@SpringBootTest(properties = "nurigo.demo-seed=42")
@Transactional
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class MarketDeletionIntegrationTest {
    @Autowired private MarketController controller;
    @Autowired private MarketRepository markets;
    @Autowired private StoreRepository stores;
    @Autowired private MissionRunCatalog catalog;
    @Autowired private MissionDemoService missions;
    @Autowired private WalletService wallets;
    @Autowired private EntityManager entityManager;

    @Test
    void 미션_대상_시장을_DB에서_삭제하고_점포와_세션은_보존한다() {
        var daily = missions.getDailyMissions(null);
        Long marketId = catalog.getDefinitions().stream()
                .filter(definition -> definition.getTargetType() == MissionTargetType.MARKET)
                .findFirst().orElseThrow().getTargetId();
        long storeCount = stores.count();
        var wallet = wallets.getWallet(daily.sessionId()).data();

        assertEquals(204, controller.deleteMarket(marketId).getStatusCode().value());
        entityManager.flush();
        assertFalse(markets.existsById(marketId));
        assertEquals(storeCount, stores.count());
        assertTrue(missions.getDailyMissions(daily.sessionId()).data().isEmpty());
        assertTrue(missions.getDailyMissions(null).data().isEmpty());
        assertEquals(wallet, wallets.getWallet(daily.sessionId()).data());
    }
}
