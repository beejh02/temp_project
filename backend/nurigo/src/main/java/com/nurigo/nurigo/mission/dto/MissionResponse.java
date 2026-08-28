package com.nurigo.nurigo.mission.dto;

public record MissionResponse(
        Long id,
        String missionKey,
        String group,
        String category,
        String title,
        String description,
        String activationReason,
        String status,
        boolean shared,
        SharedStateResponse sharedState,
        int reward,
        TargetResponse target,
        String verificationLabel,
        ProgressResponse progress,
        AvailabilityResponse availability
        ) {

    public record TargetResponse(
            String type,
            Long marketId,
            Long storeId,
            String name,
            String address,
            LocationResponse location
            ) {

    }

    public record LocationResponse(
            double latitude,
            double longitude
            ) {

    }

    public record ProgressResponse(
            int current,
            int target,
            String label
            ) {

    }

    public record SharedStateResponse(
            String status,
            int current,
            int target
            ) {

    }

    public record AvailabilityResponse(
            Integer capacity,
            Integer remainingSlots,
            String endsAtLabel
            ) {

    }
}
