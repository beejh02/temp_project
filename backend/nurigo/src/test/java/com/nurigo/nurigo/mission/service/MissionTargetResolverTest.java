package com.nurigo.nurigo.mission.service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.LongStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.Test;

import com.nurigo.nurigo.market.dto.MarketResponse;
import com.nurigo.nurigo.market.service.MarketService;
import com.nurigo.nurigo.mission.config.DemoMissionCatalog;
import com.nurigo.nurigo.mission.config.DemoRunSeed;
import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionTargetType;
import com.nurigo.nurigo.store.dto.StoreResponse;
import com.nurigo.nurigo.store.service.StoreService;

class MissionTargetResolverTest {

    @Test
    void 시장과_점포를_DB_데이터로_연결하고_점포를_중복_선택하지_않는다() {
        MarketService marketService = mock(MarketService.class);
        StoreService storeService = mock(StoreService.class);
        when(marketService.findAll()).thenReturn(List.of(
                market(77L, "대전중앙시장", 36.33005, 127.43065)
        ));
        when(storeService.findStoresInsideMarket(77L)).thenReturn(
                LongStream.rangeClosed(201, 206)
                        .mapToObj(this::store)
                        .toList()
        );
        MissionTargetResolver resolver = new MissionTargetResolver(
                marketService,
                storeService,
                new DemoRunSeed("42")
        );

        List<MissionDefinition> resolved = resolver.resolve(
                new DemoMissionCatalog().getDefinitions()
        );
        List<MissionDefinition> marketMissions = resolved.stream()
                .filter(definition -> definition.getTargetType()
                        == MissionTargetType.MARKET)
                .toList();
        List<MissionDefinition> storeMissions = resolved.stream()
                .filter(definition -> definition.getTargetType()
                        == MissionTargetType.STORE)
                .toList();
        Set<Long> selectedStoreIds = storeMissions.stream()
                .map(MissionDefinition::getTargetId)
                .collect(Collectors.toSet());

        assertTrue(marketMissions.stream().allMatch(definition ->
                definition.getTargetId().equals(77L)
        ));
        assertTrue(marketMissions.stream().allMatch(definition ->
                definition.getTargetLatitude() == 36.33005
                && definition.getTargetLongitude() == 127.43065
        ));
        assertEquals(storeMissions.size(), selectedStoreIds.size());
        assertTrue(selectedStoreIds.stream().allMatch(id -> id >= 201L));
        assertTrue(storeMissions.stream().allMatch(definition ->
                definition.getTargetAddress().startsWith("실제 주소")
        ));
    }

    @Test
    void 같은_시드는_같은_점포_대상을_선택한다() {
        MarketService marketService = mock(MarketService.class);
        StoreService storeService = mock(StoreService.class);
        when(marketService.findAll()).thenReturn(List.of(
                market(77L, "대전중앙시장", 36.33005, 127.43065)
        ));
        when(storeService.findStoresInsideMarket(77L)).thenReturn(
                LongStream.rangeClosed(201, 206)
                        .mapToObj(this::store)
                        .toList()
        );

        List<Long> first = new MissionTargetResolver(
                marketService,
                storeService,
                new DemoRunSeed("42")
        ).resolve(new DemoMissionCatalog().getDefinitions())
                .stream()
                .filter(definition -> definition.getTargetType()
                        == MissionTargetType.STORE)
                .map(MissionDefinition::getTargetId)
                .toList();
        List<Long> second = new MissionTargetResolver(
                marketService,
                storeService,
                new DemoRunSeed("42")
        ).resolve(new DemoMissionCatalog().getDefinitions())
                .stream()
                .filter(definition -> definition.getTargetType()
                        == MissionTargetType.STORE)
                .map(MissionDefinition::getTargetId)
                .toList();

        assertEquals(first, second);
    }

    @Test
    void 대상_시장이_없으면_잘못된_대체_좌표로_미션을_시작하지_않는다() {
        MarketService marketService = mock(MarketService.class);
        StoreService storeService = mock(StoreService.class);
        when(marketService.findAll()).thenReturn(List.of());
        MissionTargetResolver resolver = new MissionTargetResolver(
                marketService,
                storeService,
                new DemoRunSeed("42")
        );

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> resolver.resolve(
                        new DemoMissionCatalog().getDefinitions()
                )
        );

        assertTrue(exception.getMessage().contains("대전 중앙시장"));
    }

    @Test
    void 점포_후보가_부족하면_미션을_시작하지_않는다() {
        MarketService marketService = mock(MarketService.class);
        StoreService storeService = mock(StoreService.class);
        when(marketService.findAll()).thenReturn(List.of(
                market(77L, "대전중앙시장", 36.33005, 127.43065)
        ));
        when(storeService.findStoresInsideMarket(77L)).thenReturn(List.of(
                store(201L)
        ));
        MissionTargetResolver resolver = new MissionTargetResolver(
                marketService,
                storeService,
                new DemoRunSeed("42")
        );

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> resolver.resolve(
                        new DemoMissionCatalog().getDefinitions()
                )
        );

        assertTrue(exception.getMessage().contains("유효한 점포"));
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
                36.33 + id / 1_000_000.0,
                127.43 + id / 1_000_000.0
        );
    }
}
