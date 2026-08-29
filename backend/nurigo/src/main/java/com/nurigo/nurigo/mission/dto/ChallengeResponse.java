package com.nurigo.nurigo.mission.dto;

import java.util.List;

public record ChallengeResponse(
        String id,
        String title,
        String description,
        String status,
        int current,
        int target,
        int reward,
        List<VisitDayResponse> visits
        ) {

    public record VisitDayResponse(
            String day,
            String date,
            boolean completed
            ) {

    }
}
