package com.nurigo.nurigo.market.service;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.nurigo.nurigo.market.dto.MarketCreateRequest;
import com.nurigo.nurigo.market.dto.MarketResponse;
import com.nurigo.nurigo.market.entity.Market;
import com.nurigo.nurigo.market.mapper.MarketGeometryMapper;
import com.nurigo.nurigo.market.repository.MarketRepository;

class MarketServiceUnitTest {

    private MarketRepository marketRepository;
    private MarketService marketService;

    @BeforeEach
    void setUp() {
        marketRepository = mock(MarketRepository.class);
        marketService = new MarketService(
                marketRepository,
                new MarketGeometryMapper()
        );
        when(marketRepository.save(any(Market.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void 중복_시장_이름은_생성하지_않는다() {
        when(marketRepository.existsByNameIgnoreCase("중앙시장"))
                .thenReturn(true);

        assertThrows(
                DuplicateMarketNameException.class,
                () -> marketService.create(request(" 중앙시장 "))
        );
        verify(marketRepository, never()).save(any(Market.class));
    }

    @Test
    void 기존_시장의_이름과_Polygon을_수정한다() {
        Market market = new Market(
                "수정 전 시장",
                new MarketGeometryMapper().toPolygon(boundary())
        );
        when(marketRepository.findById(3L)).thenReturn(Optional.of(market));

        MarketResponse response = marketService.update(
                3L,
                request(" 수정 후 시장 ")
        );

        assertEquals("수정 후 시장", response.name());
        assertEquals("수정 후 시장", market.getName());
        verify(marketRepository)
                .existsByNameIgnoreCaseAndIdNot("수정 후 시장", 3L);
        verify(marketRepository).save(market);
    }

    @Test
    void 존재하는_시장만_삭제한다() {
        Market market = new Market(
                "삭제할 시장",
                new MarketGeometryMapper().toPolygon(boundary())
        );
        when(marketRepository.findById(3L)).thenReturn(Optional.of(market));

        marketService.delete(3L);

        verify(marketRepository).delete(market);
    }

    @Test
    void 존재하지_않는_시장은_수정하거나_삭제할_수_없다() {
        when(marketRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(
                MarketNotFoundException.class,
                () -> marketService.update(404L, request("없는 시장"))
        );
        assertThrows(
                MarketNotFoundException.class,
                () -> marketService.delete(404L)
        );
    }

    private MarketCreateRequest request(String name) {
        return new MarketCreateRequest(name, boundary());
    }

    private MarketCreateRequest.GeoJsonPolygon boundary() {
        return new MarketCreateRequest.GeoJsonPolygon(
                "Polygon",
                List.of(List.of(
                        List.of(127.43, 36.32),
                        List.of(127.44, 36.32),
                        List.of(127.44, 36.33),
                        List.of(127.43, 36.32)
                ))
        );
    }
}
