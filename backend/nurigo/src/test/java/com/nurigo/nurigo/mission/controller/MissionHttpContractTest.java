package com.nurigo.nurigo.mission.controller;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.nurigo.nurigo.mission.service.MissionDemoService;
import com.nurigo.nurigo.mission.service.MissionSessionResult;
import com.nurigo.nurigo.mission.dto.ChallengeResponse;

class MissionHttpContractTest {

    private MissionDemoService service;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(MissionDemoService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new MissionController(service))
                .setControllerAdvice(new MissionExceptionHandler())
                .build();
    }

    @Test
    void 일일_미션_HTTP_응답에_익명_세션_쿠키를_발급한다() throws Exception {
        when(service.getDailyMissions(null)).thenReturn(
                new MissionSessionResult<>("session-1", true, List.of())
        );

        mockMvc.perform(get("/api/missions/daily"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"))
                .andExpect(cookie().value(
                        MissionController.SESSION_COOKIE_NAME,
                        "session-1"
                ));
    }

    @Test
    void 잘못된_위치_요청은_HTTP_400을_반환한다() throws Exception {
        mockMvc.perform(post("/api/missions/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "latitude": 36.33,
                                  "longitude": 127.43,
                                  "accuracy": -1,
                                  "recordedAt": "2026-08-29T00:00:00Z"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void 완료되지_않은_보상_요청은_HTTP_409를_반환한다() throws Exception {
        when(service.claimReward(null, 1L)).thenThrow(
                new IllegalStateException("완료한 미션만 수령할 수 있습니다.")
        );

        mockMvc.perform(post("/api/missions/1/claim"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message")
                        .value("완료한 미션만 수령할 수 있습니다."));
    }

    @Test
    void 도전_기록_HTTP_응답은_진행도와_방문일을_포함한다() throws Exception {
        ChallengeResponse challenge = new ChallengeResponse(
                "three-day-streak",
                "3일 연속 시장 방문",
                "시장 방문 기록",
                "in_progress",
                2,
                3,
                5,
                List.of(new ChallengeResponse.VisitDayResponse(
                        "1일차",
                        "8.27",
                        true
                ))
        );
        when(service.getChallenges(null)).thenReturn(
                new MissionSessionResult<>(
                        "session-1",
                        true,
                        List.of(challenge)
                )
        );

        mockMvc.perform(get("/api/missions/challenges"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("three-day-streak"))
                .andExpect(jsonPath("$[0].current").value(2))
                .andExpect(jsonPath("$[0].visits[0].completed").value(true));
    }
}
