package com.nurigo.nurigo.mission.controller;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

import com.nurigo.nurigo.mission.dto.MissionResponse;
import com.nurigo.nurigo.mission.service.MissionDemoService;
import com.nurigo.nurigo.mission.service.MissionSessionResult;

class MissionControllerTest {

    @Test
    void 새_익명_세션에만_세션_쿠키를_발급한다() {
        MissionDemoService service = mock(MissionDemoService.class);
        MissionController controller = new MissionController(
                service,
                new MissionSessionCookieFactory(false, "Lax")
        );
        when(service.getDailyMissions(null)).thenReturn(
                new MissionSessionResult<>("new-session", true, List.of())
        );
        when(service.getDailyMissions("existing-session")).thenReturn(
                new MissionSessionResult<>(
                        "existing-session",
                        false,
                        List.of()
                )
        );

        ResponseEntity<List<MissionResponse>> created
                = controller.getDailyMissions(null);
        ResponseEntity<List<MissionResponse>> reused
                = controller.getDailyMissions("existing-session");

        assertTrue(created.getHeaders()
                .getFirst(HttpHeaders.SET_COOKIE)
                .contains("nurigo_anonymous_session=new-session"));
        assertTrue(created.getHeaders()
                .getFirst(HttpHeaders.SET_COOKIE)
                .contains("HttpOnly"));
        assertTrue(created.getHeaders()
                .getFirst(HttpHeaders.SET_COOKIE)
                .contains("SameSite=Lax"));
        assertNull(reused.getHeaders().getFirst(HttpHeaders.SET_COOKIE));
    }
}
