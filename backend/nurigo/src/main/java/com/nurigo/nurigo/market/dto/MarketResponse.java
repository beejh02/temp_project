package com.nurigo.nurigo.market.dto;

import java.time.LocalDateTime;
import java.util.List;

public record MarketResponse(
        Long id,
        String name,
        GeoJsonPolygon boundary,
        LocationResponse location,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
        ) {

    public record LocationResponse(
            double latitude,
            double longitude
            ) {
    }

    public record GeoJsonPolygon(
            String type,
            List<List<List<Double>>> coordinates
            ) {

    }
}
