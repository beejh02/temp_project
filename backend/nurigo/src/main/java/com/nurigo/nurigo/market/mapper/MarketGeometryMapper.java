package com.nurigo.nurigo.market.mapper;

import java.util.ArrayList;
import java.util.List;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Component;

import com.nurigo.nurigo.market.dto.MarketCreateRequest;

@Component
public class MarketGeometryMapper {

    private final GeometryFactory geometryFactory
            = new GeometryFactory(new PrecisionModel(), 4326);

    public Polygon toPolygon(MarketCreateRequest.GeoJsonPolygon geoJson) {

        if (geoJson == null) {
            throw new IllegalArgumentException("boundary는 필수입니다.");
        }
        if (!"Polygon".equalsIgnoreCase(geoJson.type())) {
            throw new IllegalArgumentException("boundary type은 Polygon이어야 합니다.");
        }

        List<List<List<Double>>> rings = geoJson.coordinates();

        if (rings == null || rings.isEmpty()) {
            throw new IllegalArgumentException(
                    "Polygon 좌표가 비어 있습니다."
            );
        }

        LinearRing shell = toLinearRing(rings.get(0));
        LinearRing[] holes = new LinearRing[rings.size() - 1];

        for (int i = 1; i < rings.size(); i++) {
            holes[i - 1] = toLinearRing(rings.get(i));
        }

        return geometryFactory.createPolygon(shell, holes);
    }

    private LinearRing toLinearRing(List<List<Double>> ring) {
        if (ring == null || ring.size() < 3) {
            throw new IllegalArgumentException(
                    "Polygon은 최소 3개의 좌표가 필요합니다."
            );
        }

        List<Coordinate> coordinates = new ArrayList<>();

        for (List<Double> point : ring) {
            if (point == null || point.size() < 2) {
                throw new IllegalArgumentException(
                        "각 좌표는 [longitude, latitude] 형식이어야 합니다."
                );
            }

            double longitude = point.get(0);
            double latitude = point.get(1);

            coordinates.add(
                    new Coordinate(longitude, latitude)
            );
        }

        Coordinate first = coordinates.get(0);
        Coordinate last = coordinates.get(coordinates.size() - 1);

        if (!first.equals2D(last)) {
            coordinates.add(
                    new Coordinate(first.x, first.y)
            );
        }

        if (coordinates.size() < 4) {
            throw new IllegalArgumentException(
                    "Polygon은 서로 다른 최소 3개의 점이 필요합니다."
            );
        }

        return geometryFactory.createLinearRing(
                coordinates.toArray(Coordinate[]::new)
        );
    }
}
