package com.nurigo.nurigo.mission.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nurigo.nurigo.mission.dto.MissionResponse;
import com.nurigo.nurigo.mission.dto.RankingResponse;
import com.nurigo.nurigo.mission.service.MissionDemoService;
import com.nurigo.nurigo.mission.service.MissionSessionResult;

@RestController
@RequestMapping("/api/missions")
public class MissionController {

    public static final String SESSION_COOKIE_NAME
            = "nurigo_anonymous_session";

    private final MissionDemoService missionDemoService;

    public MissionController(MissionDemoService missionDemoService) {
        this.missionDemoService = missionDemoService;
    }

    @GetMapping("/daily")
    public ResponseEntity<List<MissionResponse>> getDailyMissions(
            @CookieValue(
                    name = SESSION_COOKIE_NAME,
                    required = false
            ) String sessionId
    ) {
        return response(
                missionDemoService.getDailyMissions(sessionId)
        );
    }

    @PostMapping("/{missionId}/complete")
    public ResponseEntity<MissionResponse> completeMission(
            @CookieValue(
                    name = SESSION_COOKIE_NAME,
                    required = false
            ) String sessionId,
            @PathVariable Long missionId
    ) {
        return response(
                missionDemoService.completeMission(sessionId, missionId)
        );
    }

    @PostMapping("/{missionId}/claim")
    public ResponseEntity<MissionResponse> claimReward(
            @CookieValue(
                    name = SESSION_COOKIE_NAME,
                    required = false
            ) String sessionId,
            @PathVariable Long missionId
    ) {
        return response(
                missionDemoService.claimReward(sessionId, missionId)
        );
    }

    @GetMapping("/rankings")
    public ResponseEntity<RankingResponse> getRanking(
            @CookieValue(
                    name = SESSION_COOKIE_NAME,
                    required = false
            ) String sessionId,
            @RequestParam(defaultValue = "weekly") String period
    ) {
        return response(
                missionDemoService.getRanking(sessionId, period)
        );
    }

    private <T> ResponseEntity<T> response(
            MissionSessionResult<T> result
    ) {
        ResponseEntity.BodyBuilder response = ResponseEntity.ok();

        if (result.newSession()) {
            ResponseCookie cookie = ResponseCookie
                    .from(SESSION_COOKIE_NAME, result.sessionId())
                    .httpOnly(true)
                    .sameSite("Lax")
                    .path("/")
                    .build();
            response.header(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        return response.body(result.data());
    }
}
