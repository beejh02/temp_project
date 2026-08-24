package com.nurigo.nurigo.market.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MarketCreateRequest(
        @NotBlank
        @Size(max = 100)
        String name,
        @NotNull
        GeoJsonPolygon boundary
        ) {

    public record GeoJsonPolygon(
            String type,
            List<List<List<Double>>> coordinates
            ) {

    }
}
