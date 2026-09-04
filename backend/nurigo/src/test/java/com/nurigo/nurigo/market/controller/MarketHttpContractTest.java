package com.nurigo.nurigo.market.controller;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
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
import com.nurigo.nurigo.market.service.MarketInUseException;
import com.nurigo.nurigo.market.service.MarketNotFoundException;
import com.nurigo.nurigo.market.service.MarketService;
import com.nurigo.nurigo.mission.service.MissionMarketCoordinator;

class MarketHttpContractTest {

    private MarketService marketService;
    private MissionMarketCoordinator missionMarketCoordinator;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        marketService = mock(MarketService.class);
        missionMarketCoordinator = mock(MissionMarketCoordinator.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new MarketController(
                        marketService,
                        missionMarketCoordinator
                ))
                .setControllerAdvice(new MarketExceptionHandler())
                .build();
    }

    @Test
    void 시장을_수정하고_수정된_정보를_반환한다() throws Exception {
        when(marketService.findById(3L)).thenReturn(response());
        when(marketService.update(any(Long.class), any()))
                .thenReturn(response());

        mockMvc.perform(put("/api/markets/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody("수정 시장")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.name").value("수정 시장"));

        verify(missionMarketCoordinator).validateUpdate(
                any(MarketResponse.class),
                org.mockito.ArgumentMatchers.eq("수정 시장")
        );
        verify(missionMarketCoordinator).marketUpdated(3L);
    }

    @Test
    void 시장을_삭제하면_본문_없는_응답을_반환한다() throws Exception {
        when(marketService.findById(3L)).thenReturn(response());

        mockMvc.perform(delete("/api/markets/3"))
                .andExpect(status().isNoContent());

        verify(missionMarketCoordinator).validateDelete(response());
        verify(marketService).delete(3L);
    }

    @Test
    void 존재하지_않는_시장은_404를_반환한다() throws Exception {
        when(marketService.findById(404L))
                .thenThrow(new MarketNotFoundException(404L));

        mockMvc.perform(delete("/api/markets/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message")
                        .value("시장을 찾을 수 없습니다: 404"));
    }

    @Test
    void 미션_대상_시장은_삭제하지_않고_409를_반환한다() throws Exception {
        when(marketService.findById(3L)).thenReturn(response());
        doThrow(new MarketInUseException(
                "미션 대상 시장은 삭제할 수 없습니다: 3"
        )).when(missionMarketCoordinator).validateDelete(
                any(MarketResponse.class)
        );

        mockMvc.perform(delete("/api/markets/3"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message")
                        .value("미션 대상 시장은 삭제할 수 없습니다: 3"));

        verify(marketService, never()).delete(3L);
    }

    @Test
    void 미션_대상_시장_이름은_변경하지_않고_409를_반환한다() throws Exception {
        when(marketService.findById(3L)).thenReturn(response());
        doThrow(new MarketInUseException(
                "미션 대상 시장의 이름은 변경할 수 없습니다: 3"
        )).when(missionMarketCoordinator).validateUpdate(
                any(MarketResponse.class),
                org.mockito.ArgumentMatchers.eq("새 시장")
        );

        mockMvc.perform(put("/api/markets/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody("새 시장")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message")
                        .value("미션 대상 시장의 이름은 변경할 수 없습니다: 3"));

        verify(marketService, never()).update(any(Long.class), any());
        verify(missionMarketCoordinator, never()).marketUpdated(3L);
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
