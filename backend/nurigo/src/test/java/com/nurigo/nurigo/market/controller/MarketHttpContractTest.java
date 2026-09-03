package com.nurigo.nurigo.market.controller;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.nurigo.nurigo.market.dto.MarketCreateRequest;
import com.nurigo.nurigo.market.dto.MarketResponse;
import com.nurigo.nurigo.market.service.MarketNotFoundException;
import com.nurigo.nurigo.market.service.MarketService;

class MarketHttpContractTest {

    private MarketService marketService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        marketService = mock(MarketService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new MarketController(marketService))
                .setControllerAdvice(new MarketExceptionHandler())
                .build();
    }

    @Test
    void 시장을_수정하고_수정된_정보를_반환한다() throws Exception {
        when(marketService.update(any(Long.class), any()))
                .thenReturn(response());

        mockMvc.perform(put("/api/markets/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody("수정 시장")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.name").value("수정 시장"));
    }

    @Test
    void 시장을_삭제하면_본문_없는_응답을_반환한다() throws Exception {
        mockMvc.perform(delete("/api/markets/3"))
                .andExpect(status().isNoContent());

        verify(marketService).delete(3L);
    }

    @Test
    void 존재하지_않는_시장은_404를_반환한다() throws Exception {
        doThrow(new MarketNotFoundException(404L))
                .when(marketService).delete(404L);

        mockMvc.perform(delete("/api/markets/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message")
                        .value("시장을 찾을 수 없습니다: 404"));
    }

    private MarketResponse response() {
        return new MarketResponse(
                3L,
                "수정 시장",
                new MarketResponse.GeoJsonPolygon(
                        "Polygon",
                        List.of(List.of(
                                List.of(127.43, 36.32),
                                List.of(127.44, 36.32),
                                List.of(127.44, 36.33),
                                List.of(127.43, 36.32)
                        ))
                ),
                new MarketResponse.LocationResponse(36.325, 127.435),
                LocalDateTime.parse("2026-09-03T10:00:00"),
                LocalDateTime.parse("2026-09-04T10:00:00")
        );
    }

    private String requestBody(String name) {
        return """
                {
                  "name": "%s",
                  "boundary": {
                    "type": "Polygon",
                    "coordinates": [[
                      [127.43, 36.32],
                      [127.44, 36.32],
                      [127.44, 36.33],
                      [127.43, 36.32]
                    ]]
                  }
                }
                """.formatted(name);
    }
}
