package com.nurigo.nurigo.mission.config;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.Test;

import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionTargetType;
import com.nurigo.nurigo.mission.service.MissionTargetResolver;

class MissionRunCatalogTest {

    @Test
    void 미션_대상_시장이_수정되면_다음_조회에서_대상을_다시_연결한다() {
        DemoMissionCatalog templateCatalog = new DemoMissionCatalog();
        MissionTargetResolver targetResolver = mock(
                MissionTargetResolver.class
        );
        List<MissionDefinition> templates = templateCatalog.getDefinitions();
        List<MissionDefinition> firstDefinitions = resolvedDefinitions(
                templates,
                77L,
                36.33,
                127.43
        );
        List<MissionDefinition> refreshedDefinitions = resolvedDefinitions(
                templates,
                77L,
                36.34,
                127.44
        );
        when(targetResolver.resolve(templates))
                .thenReturn(firstDefinitions)
                .thenReturn(refreshedDefinitions);
        MissionRunCatalog catalog = new MissionRunCatalog(
                templateCatalog,
                targetResolver
        );

        assertEquals(36.33, firstMarket(catalog).getTargetLatitude());
        assertTrue(catalog.isResolvedTargetMarket(77L));
        assertTrue(catalog.invalidateIfTargetMarket(77L));
        assertEquals(36.34, firstMarket(catalog).getTargetLatitude());

        verify(targetResolver, org.mockito.Mockito.times(2))
                .resolve(templates);
    }

    @Test
    void 미션과_무관한_시장_수정은_카탈로그를_유지한다() {
        DemoMissionCatalog templateCatalog = new DemoMissionCatalog();
        MissionTargetResolver targetResolver = mock(
                MissionTargetResolver.class
        );
        List<MissionDefinition> templates = templateCatalog.getDefinitions();
        when(targetResolver.resolve(templates)).thenReturn(
                resolvedDefinitions(templates, 77L, 36.33, 127.43)
        );
        MissionRunCatalog catalog = new MissionRunCatalog(
                templateCatalog,
                targetResolver
        );

        firstMarket(catalog);

        assertFalse(catalog.invalidateIfTargetMarket(88L));
        firstMarket(catalog);
        verify(targetResolver).resolve(templates);
    }

    private MissionDefinition firstMarket(MissionRunCatalog catalog) {
        return catalog.getDefinitions()
                .stream()
                .filter(definition -> definition.getTargetType()
                        == MissionTargetType.MARKET)
                .findFirst()
                .orElseThrow();
    }

    private List<MissionDefinition> resolvedDefinitions(
            List<MissionDefinition> templates,
            Long marketId,
            double latitude,
            double longitude
    ) {
        return templates.stream()
                .map(definition -> definition.getTargetType()
                        == MissionTargetType.MARKET
                                ? definition.withTarget(
                                        marketId,
                                        "대전 중앙시장",
                                        definition.getTargetAddress(),
                                        latitude,
                                        longitude
                                )
                                : definition)
                .toList();
    }
}
