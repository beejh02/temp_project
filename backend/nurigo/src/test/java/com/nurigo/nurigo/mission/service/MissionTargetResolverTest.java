package com.nurigo.nurigo.mission.service;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.Test;

import com.nurigo.nurigo.market.dto.MarketResponse;
import com.nurigo.nurigo.market.service.MarketService;
import com.nurigo.nurigo.mission.config.DemoMissionCatalog;
import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionTargetType;

class MissionTargetResolverTest {

    @Test
    void 시장_이름의_공백을_정규화해_DB_ID와_대표_좌표를_연결한다() {
        MarketService marketService = mock(MarketService.class);
        when(marketService.findAll()).thenReturn(List.of(
                market(
                        77L,
                        "대전중앙시장",
                        36.33005,
                        127.43065
                )
        ));
        MissionTargetResolver resolver = new MissionTargetResolver(
                marketService
        );

        List<MissionDefinition> resolved = resolver.resolve(
                new DemoMissionCatalog().getDefinitions()
        );
        List<MissionDefinition> marketMissions = resolved.stream()
                .filter(definition -> definition.getTargetType()
                        == MissionTargetType.MARKET)
                .toList();

        assertTrue(marketMissions.stream().allMatch(definition ->
                definition.getTargetId().equals(77L)
        ));
        assertTrue(marketMissions.stream().allMatch(definition ->
                definition.getTargetLatitude() == 36.33005
                && definition.getTargetLongitude() == 127.43065
        ));
        assertEquals(
                101L,
                resolved.stream()
                        .filter(definition -> definition.getMissionKey()
                                .equals("designated-store-visit"))
                        .findFirst()
                        .orElseThrow()
                        .getTargetId()
        );
    }

    @Test
    void 대상_시장이_없으면_잘못된_대체_좌표로_미션을_시작하지_않는다() {
        MarketService marketService = mock(MarketService.class);
        when(marketService.findAll()).thenReturn(List.of());
        MissionTargetResolver resolver = new MissionTargetResolver(
                marketService
        );

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> resolver.resolve(
                        new DemoMissionCatalog().getDefinitions()
                )
        );

        assertTrue(exception.getMessage().contains("대전 중앙시장"));
    }

    private MarketResponse market(
            Long id,
            String name,
            double latitude,
            double longitude
    ) {
        return new MarketResponse(
                id,
                name,
                null,
                new MarketResponse.LocationResponse(latitude, longitude),
                null,
                null
        );
    }
}
