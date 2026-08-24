package com.nurigo.nurigo.market.service;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.nurigo.nurigo.market.entity.Market;

@SpringBootTest
@Transactional
class MarketServiceTest {

    @Autowired
    private MarketService marketService;

    @Test
    void 시장_저장_및_조회() {

        // SRID 4326을 사용하는 GeometryFactory
        GeometryFactory geometryFactory
                = new GeometryFactory(new PrecisionModel(), 4326);

        // GeoJSON과 동일하게 x = 경도(lng), y = 위도(lat)
        Coordinate[] coordinates = {
            new Coordinate(127.4301, 36.3296),
            new Coordinate(127.4312, 36.3296),
            new Coordinate(127.4312, 36.3305),
            new Coordinate(127.4301, 36.3296)
        };

        Polygon boundary = geometryFactory.createPolygon(coordinates);

        Market market = new Market("테스트 시장", boundary);

        // 저장
        Market savedMarket = marketService.save(market);

        // 저장되면서 ID가 생성됐는지 확인
        assertNotNull(savedMarket.getId());

        // 전체 조회
        List<Market> markets = marketService.findAll();

        // 저장한 시장이 조회 결과에 존재하는지 확인
        assertTrue(
                markets.stream()
                        .anyMatch(saved -> saved.getId().equals(savedMarket.getId()))
        );
    }
}
