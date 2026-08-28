package com.nurigo.nurigo.mission.dto;

import java.time.Instant;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record MissionLocationRequest(
        @DecimalMin("-90.0")
        @DecimalMax("90.0")
        double latitude,
        @DecimalMin("-180.0")
        @DecimalMax("180.0")
        double longitude,
        @PositiveOrZero
        double accuracy,
        @NotNull
        Instant recordedAt
        ) {
}
