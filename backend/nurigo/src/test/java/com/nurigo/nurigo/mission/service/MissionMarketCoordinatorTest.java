package com.nurigo.nurigo.mission.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.nurigo.nurigo.market.dto.MarketResponse;
import com.nurigo.nurigo.market.service.MarketInUseException;
import com.nurigo.nurigo.mission.config.DemoMissionCatalog;
import com.nurigo.nurigo.mission.config.MissionRunCatalog;

class MissionMarketCoordinatorTest {

    private MissionRunCatalog runCatalog;
    private MissionMarketCoordinator coordinator;

    @BeforeEach
    void setUp() {
        runCatalog = mock(MissionRunCatalog.class);
        coordinator = new MissionMarketCoordinator(
                new DemoMissionCatalog(),
                runCatalog
        );
    }

    @Test
    void 미션_대상_시장은_공백과_대소문자를_제외한_이름을_유지한다() {
        MarketResponse market = market(77L, "대전중앙시장");

        assertDoesNotThrow(() -> coordinator.validateUpdate(
                market,
                " 대전 중앙시장 "
        ));

        assertThrows(
                MarketInUseException.class,
                () -> coordinator.validateUpdate(market, "새 시장")
        );
    }

    @Test
    void 미션_대상_시장은_삭제하지_않는다() {
        MarketResponse market = market(77L, "대전 중앙시장");

        assertThrows(
                MarketInUseException.class,
                () -> coordinator.validateDelete(market)
        );
    }

    @Test
    void 이미_연결된_시장_ID도_이름과_관계없이_보호한다() {
        MarketResponse market = market(77L, "변경된 외부 이름");
        when(runCatalog.isResolvedTargetMarket(77L)).thenReturn(true);

        assertThrows(
                MarketInUseException.class,
                () -> coordinator.validateDelete(market)
        );
    }

    @Test
    void 일반_시장은_수정하고_삭제할_수_있다() {
        MarketResponse market = market(88L, "일반 시장");

        assertDoesNotThrow(() -> coordinator.validateUpdate(
                market,
                "일반 시장 수정"
        ));
        assertDoesNotThrow(() -> coordinator.validateDelete(market));
    }

    @Test
    void 시장_수정_후_실행_카탈로그를_무효화한다() {
        coordinator.marketUpdated(77L);

        verify(runCatalog).invalidateIfTargetMarket(77L);
    }

    private MarketResponse market(Long id, String name) {
        return new MarketResponse(id, name, null, null, null, null);
    }
}
