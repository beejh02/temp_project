package com.nurigo.nurigo.wallet;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import com.nurigo.nurigo.mission.config.DemoMissionCatalog;
import com.nurigo.nurigo.mission.entity.RankingPeriod;
import com.nurigo.nurigo.mission.policy.DailyMissionPolicy;
import com.nurigo.nurigo.mission.runtime.MissionRunStateStore;
import com.nurigo.nurigo.wallet.runtime.DemoBenefitCatalog;
import com.nurigo.nurigo.wallet.runtime.PointWallet;

class WalletExchangeTest {
    private final MissionRunStateStore store = new MissionRunStateStore("42");
    private final DemoMissionCatalog catalog = new DemoMissionCatalog();
    private final DailyMissionPolicy policy = new DailyMissionPolicy();

    private String fundedSession() {
        String id = store.resolveSession(null, catalog.getDefinitions(), policy).sessionId();
        for (var mission : catalog.getDefinitions()) {
            if (store.getAssignedMissionKeys(id).contains(mission.getMissionKey())) {
                store.completeMission(id, mission);
                store.claimReward(id, mission);
            }
        }
        return id;
    }

    @Test
    void 교환은_잔액만_차감하고_누적적립과_랭킹을_보존한다() {
        String id = fundedSession();
        var before = store.getWallet(id);
        int ranking = store.getRanking(id, RankingPeriod.WEEKLY).points();
        var result = store.exchangeBenefit(id, "snack", UUID.randomUUID());
        assertEquals(before.balance() - 10, result.wallet().balance());
        assertEquals(before.totalEarned(), result.wallet().totalEarned());
        assertEquals(10, result.wallet().totalSpent());
        assertEquals(ranking, store.getRanking(id, RankingPeriod.WEEKLY).points());
        assertEquals(-10, result.wallet().transactions().get(0).amount());
        assertEquals(result.wallet().balance(), result.wallet().transactions().get(0).balanceAfter());
        assertEquals(result.coupon(), result.wallet().coupons().get(0));
        assertTrue(result.coupon().demo());
        assertEquals("available", result.coupon().status());
        assertEquals(30, ChronoUnit.DAYS.between(result.coupon().issuedAt(), result.coupon().expiresAt()));
    }

    @Test
    void 동일_요청을_동시에_재시도해도_쿠폰은_한개만_발급한다() throws Exception {
        String id = fundedSession();
        int before = store.getWallet(id).balance();
        UUID request = UUID.randomUUID();
        var executor = Executors.newFixedThreadPool(4);
        try {
            Callable<String> exchange = () -> store.exchangeBenefit(id, "snack", request).coupon().id();
            var results = executor.invokeAll(java.util.List.of(exchange, exchange, exchange, exchange));
            for (var result : results) assertEquals(results.get(0).get(), result.get());
        } finally { executor.shutdownNow(); }
        assertEquals(before - 10, store.getWallet(id).balance());
        assertEquals(1, store.getWallet(id).coupons().size());
        assertThrows(IllegalStateException.class, () -> store.exchangeBenefit(id, "market", request));
        assertEquals(before - 10, store.getWallet(id).balance());
    }

    @Test
    void 잔액을_초과하는_동시_교환은_차단한다() throws Exception {
        String id = fundedSession();
        int before = store.getWallet(id).balance();
        var tasks = new ArrayList<Callable<Boolean>>();
        for (int i = 0; i < 8; i++) tasks.add(() -> {
            try { store.exchangeBenefit(id, "snack", UUID.randomUUID()); return true; }
            catch (IllegalStateException exception) { return false; }
        });
        var executor = Executors.newFixedThreadPool(8);
        int successes = 0;
        try { for (var result : executor.invokeAll(tasks)) if (result.get()) successes++; }
        finally { executor.shutdownNow(); }
        assertEquals(before / 10, successes);
        assertEquals(before % 10, store.getWallet(id).balance());
        assertEquals(successes, store.getWallet(id).coupons().size());
        assertEquals(successes * 10, store.getWallet(id).totalSpent());
    }

    @Test
    void 잘못된_교환은_내역을_남기지_않고_쿠폰도_세션별로_분리한다() {
        String id = fundedSession();
        var before = store.getWallet(id);
        assertThrows(IllegalArgumentException.class, () -> store.exchangeBenefit(id, "missing", UUID.randomUUID()));
        assertThrows(IllegalArgumentException.class, () -> store.exchangeBenefit(id, "snack", null));
        assertEquals(before, store.getWallet(id));
        String other = store.resolveSession(null, catalog.getDefinitions(), policy).sessionId();
        assertThrows(IllegalStateException.class, () -> store.exchangeBenefit(other, "snack", UUID.randomUUID()));
        store.exchangeBenefit(id, "snack", UUID.randomUUID());
        assertTrue(store.getWallet(other).coupons().isEmpty());
        assertTrue(store.getWallet(other).transactions().isEmpty());
    }

    @Test
    void 만료된_시연_쿠폰은_사용가능으로_표시하지_않는다() {
        var wallet = new PointWallet();
        Instant past = Instant.now().minus(31, ChronoUnit.DAYS);
        wallet.credit("reward", "보상", 10, past);
        UUID request = UUID.randomUUID();
        wallet.exchange(DemoBenefitCatalog.require("snack"), request, past);
        assertEquals("expired", wallet.snapshot("사용자").coupons().get(0).status());
        assertEquals("expired", wallet.exchange(DemoBenefitCatalog.require("snack"), request, Instant.now()).status());
        assertEquals(0, wallet.snapshot("사용자").balance());
    }
}
