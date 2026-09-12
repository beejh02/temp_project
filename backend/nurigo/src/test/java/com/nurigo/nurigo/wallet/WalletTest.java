package com.nurigo.nurigo.wallet;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.Callable;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import com.nurigo.nurigo.mission.config.DemoMissionCatalog;
import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.RankingPeriod;
import com.nurigo.nurigo.mission.policy.DailyMissionPolicy;
import com.nurigo.nurigo.mission.runtime.MissionRunStateStore;

class WalletTest {
    private final List<MissionDefinition> definitions = new DemoMissionCatalog().getDefinitions();
    private final DailyMissionPolicy policy = new DailyMissionPolicy();
    private final MissionRunStateStore store = new MissionRunStateStore("42");

    private String session() {
        return store.resolveSession(null, definitions, policy).sessionId();
    }

    private MissionDefinition assigned(String sessionId) {
        return definitions.stream().filter(d -> store.getAssignedMissionKeys(sessionId)
                .contains(d.getMissionKey())).findFirst().orElseThrow();
    }

    @Test
    void 새_지갑은_랭킹_초기점수와_무관하게_0에서_시작한다() {
        String id = session();
        assertTrue(store.getRanking(id, RankingPeriod.WEEKLY).points() > 0);
        assertEquals(0, store.getWallet(id).balance());
        assertTrue(store.getWallet(id).transactions().isEmpty());
    }

    @Test
    void 완료만으로는_적립하지_않고_보상_수령을_한번만_기록한다() {
        String id = session();
        var mission = assigned(id);
        assertThrows(IllegalStateException.class, () -> store.claimReward(id, mission));
        store.completeMission(id, mission);
        assertEquals(0, store.getWallet(id).balance());
        store.claimReward(id, mission);
        store.claimReward(id, mission);
        var wallet = store.getWallet(id);
        assertEquals(mission.getRewardPoints(), wallet.balance());
        assertEquals(wallet.balance(), wallet.totalEarned());
        assertEquals(0, wallet.totalSpent());
        assertEquals(1, wallet.transactions().size());
        assertEquals(mission.getTitle(), wallet.transactions().get(0).title());
        assertEquals(wallet.balance(), wallet.transactions().get(0).balanceAfter());
    }

    @Test
    void 도전_보상도_합산하고_최신_내역부터_조회한다() {
        String id = session();
        var mission = assigned(id);
        store.completeMission(id, mission);
        store.claimReward(id, mission);
        store.recordChallengeVisit(id, LocalDate.now(ZoneId.of("Asia/Seoul")));
        store.claimChallengeReward(id, 5);
        store.claimChallengeReward(id, 5);
        var wallet = store.getWallet(id);
        assertEquals(mission.getRewardPoints() + 5, wallet.balance());
        assertEquals(2, wallet.transactions().size());
        assertEquals("3일 연속 시장 방문", wallet.transactions().get(0).title());
        assertThrows(UnsupportedOperationException.class, () -> wallet.transactions().clear());
    }

    @Test
    void 지갑은_브라우저별로_분리되고_서버_재시작시_초기화된다() {
        String first = session();
        String second = session();
        var mission = assigned(first);
        store.completeMission(first, mission);
        store.claimReward(first, mission);
        assertEquals(mission.getRewardPoints(), store.getWallet(
                store.resolveSession(first, definitions, policy).sessionId()).balance());
        assertEquals(0, store.getWallet(second).balance());
        var nextRun = new MissionRunStateStore("42");
        String nextId = nextRun.resolveSession(first, definitions, policy).sessionId();
        assertNotEquals(first, nextId);
        assertEquals(0, nextRun.getWallet(nextId).balance());
    }

    @Test
    void 동시에_수령해도_포인트와_랭킹은_한번만_증가한다() throws Exception {
        String id = session();
        var mission = assigned(id);
        int ranking = store.getRanking(id, RankingPeriod.WEEKLY).points();
        store.completeMission(id, mission);
        var executor = Executors.newFixedThreadPool(4);
        try {
            Callable<Object> claim = () -> store.claimReward(id, mission);
            for (var result : executor.invokeAll(List.of(claim, claim, claim, claim))) result.get();
        } finally {
            executor.shutdownNow();
        }
        assertEquals(mission.getRewardPoints(), store.getWallet(id).balance());
        assertEquals(1, store.getWallet(id).transactions().size());
        assertEquals(ranking + mission.getRewardPoints(), store.getRanking(id, RankingPeriod.WEEKLY).points());
    }
}
