package com.nurigo.nurigo.store.service;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.nurigo.nurigo.market.dto.MarketCreateRequest;
import com.nurigo.nurigo.market.entity.Market;
import com.nurigo.nurigo.market.service.MarketService;
import com.nurigo.nurigo.store.dto.StoreResponse;
import com.nurigo.nurigo.store.entity.Store;
import com.nurigo.nurigo.store.repository.StoreRepository;

@SpringBootTest
@Transactional
class StoreServiceTest {

    private final GeometryFactory geometryFactory
            = new GeometryFactory(new PrecisionModel(), 4326);

    @Autowired
    private MarketService marketService;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private StoreService storeService;

    @Test
    void 시장_Polygon_내부_점포만_조회한다() {
        MarketCreateRequest.GeoJsonPolygon boundary
                = new MarketCreateRequest.GeoJsonPolygon(
                        "Polygon",
                        List.of(
                                List.of(
                                        List.of(126.0, 35.0),
                                        List.of(126.01, 35.0),
                                        List.of(126.01, 35.01),
                                        List.of(126.0, 35.01),
                                        List.of(126.0, 35.0)
                                )
                        )
                );

        Market market = marketService.create(
                new MarketCreateRequest("점포 조회 테스트 시장", boundary)
        );

        storeRepository.save(
                createStore("STORE-IN", "시장 내부 점포", 126.005, 35.005)
        );
        storeRepository.save(
                createStore("STORE-OUT", "시장 외부 점포", 126.02, 35.02)
        );
        storeRepository.flush();

        List<StoreResponse> stores
                = storeService.findStoresInsideMarkets();

        assertTrue(
                stores.stream()
                        .anyMatch(store -> store.sourceId().equals("STORE-IN"))
        );
        assertFalse(
                stores.stream()
                        .anyMatch(store -> store.sourceId().equals("STORE-OUT"))
        );

        List<StoreResponse> marketStores
                = storeService.findStoresInsideMarket(market.getId());

        assertTrue(
                marketStores.stream()
                        .anyMatch(store -> store.sourceId().equals("STORE-IN"))
        );
        assertFalse(
                marketStores.stream()
                        .anyMatch(store -> store.sourceId().equals("STORE-OUT"))
        );

        List<StoreResponse> nearbyStores
                = storeService.findStoresNearLocation(
                        35.005,
                        126.005,
                        30
                );

        assertTrue(
                nearbyStores.stream()
                        .anyMatch(store -> store.sourceId().equals("STORE-IN"))
        );
        assertFalse(
                nearbyStores.stream()
                        .anyMatch(store -> store.sourceId().equals("STORE-OUT"))
        );
    }

    private Store createStore(
            String sourceId,
            String name,
            double longitude,
            double latitude
    ) {
        Point point = geometryFactory.createPoint(
                new Coordinate(longitude, latitude)
        );

        return new Store(
                sourceId,
                name,
                null,
                "I2",
                "음식",
                "I201",
                "한식",
                "I20101",
                "한식 일반",
                "테스트 주소",
                point
        );
    }
}
