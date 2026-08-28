package com.nurigo.nurigo.mission.dto;

import java.util.List;

public record RankingResponse(
        String label,
        String period,
        CurrentParticipantResponse currentUser,
        List<RankingEntryResponse> leaders
        ) {

    public record CurrentParticipantResponse(
            int rank,
            String nickname,
            int points
            ) {

    }

    public record RankingEntryResponse(
            int rank,
            String nickname,
            int points
            ) {

    }
}
