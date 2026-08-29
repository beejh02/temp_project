package com.nurigo.nurigo.mission.config;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionTargetType;
import com.nurigo.nurigo.store.dto.StoreResponse;
import com.nurigo.nurigo.store.service.StoreService;

@SpringBootTest(properties = "nurigo.demo-seed=42")
class MissionRunCatalogIntegrationTest {

    @Autowired
    private MissionRunCatalog missionRunCatalog;

    @Autowired
    private StoreService storeService;

    @Test
    void 실제_시장_내부_점포를_실행_단위_미션_대상으로_고정한다() {
        List<MissionDefinition> definitions
                = missionRunCatalog.getDefinitions();
        Long marketId = definitions.stream()
                .filter(definition -> definition.getTargetType()
                        == MissionTargetType.MARKET)
                .map(MissionDefinition::getTargetId)
                .findFirst()
                .orElseThrow();
        Set<Long> marketStoreIds = storeService.findStoresInsideMarket(marketId)
                .stream()
                .map(StoreResponse::id)
                .collect(Collectors.toSet());
        List<MissionDefinition> storeMissions = definitions.stream()
                .filter(definition -> definition.getTargetType()
                        == MissionTargetType.STORE)
                .toList();
        Set<Long> missionStoreIds = storeMissions.stream()
                .map(MissionDefinition::getTargetId)
                .collect(Collectors.toSet());

        assertFalse(storeMissions.isEmpty());
        assertEquals(storeMissions.size(), missionStoreIds.size());
        assertTrue(marketStoreIds.containsAll(missionStoreIds));
        assertTrue(storeMissions.stream().allMatch(definition ->
                Double.isFinite(definition.getTargetLatitude())
                && Double.isFinite(definition.getTargetLongitude())
        ));
    }
}
