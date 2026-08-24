package com.nurigo.nurigo.market.service;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.nurigo.nurigo.market.dto.MarketCreateRequest;
import com.nurigo.nurigo.market.entity.Market;

@SpringBootTest
@Transactional
class MarketServiceTest {

    @Autowired
    private MarketService marketService;

    @Test
    void 시장_생성_및_조회() {

        MarketCreateRequest.GeoJsonPolygon boundary
                = new MarketCreateRequest.GeoJsonPolygon(
                        "Polygon",
                        List.of(
                                List.of(
                                        List.of(127.4301, 36.3296),
                                        List.of(127.4312, 36.3296),
                                        List.of(127.4312, 36.3305),
                                        List.of(127.4301, 36.3296)
                                )
                        )
                );

        MarketCreateRequest request
                = new MarketCreateRequest(
                        "테스트 시장",
                        boundary
                );

        // 시장 생성 및 저장
        Market savedMarket = marketService.create(request);

        // ID 생성 확인
        assertNotNull(savedMarket.getId());

        // 이름 저장 확인
        assertEquals("테스트 시장", savedMarket.getName());

        // Polygon 변환 확인
        assertNotNull(savedMarket.getBoundary());
        assertEquals(4326, savedMarket.getBoundary().getSRID());

        // 전체 조회
        List<Market> markets = marketService.findAll();

        // 저장한 시장이 조회 결과에 존재하는지 확인
        assertTrue(
                markets.stream()
                        .anyMatch(
                                saved
                                -> saved.getId().equals(savedMarket.getId())
                        )
        );
    }
}
