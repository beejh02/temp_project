package com.nurigo.nurigo.market.mapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Polygon;

import com.nurigo.nurigo.market.dto.MarketCreateRequest;

class MarketGeometryMapperTest {

    private MarketGeometryMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new MarketGeometryMapper();
    }

    @Test
    void 닫히지_않은_GeoJSON_ring을_닫아_Polygon으로_변환한다() {
        Polygon polygon = mapper.toPolygon(polygon(List.of(
                point(127.43, 36.32),
                point(127.44, 36.32),
                point(127.44, 36.33)
        )));

        assertEquals(4326, polygon.getSRID());
        assertEquals(4, polygon.getExteriorRing().getNumPoints());
        assertTrue(polygon.isValid());
    }

    @Test
    void 자기_교차하는_Polygon을_거부한다() {
        MarketCreateRequest.GeoJsonPolygon polygon = polygon(List.of(
                point(127.43, 36.32),
                point(127.44, 36.33),
                point(127.44, 36.32),
                point(127.43, 36.33),
                point(127.43, 36.32)
        ));

        assertThrows(
                IllegalArgumentException.class,
                () -> mapper.toPolygon(polygon)
        );
    }

    @Test
    void 좌표_범위를_벗어난_Polygon을_거부한다() {
        MarketCreateRequest.GeoJsonPolygon polygon = polygon(List.of(
                point(181, 36.32),
                point(127.44, 36.32),
                point(127.44, 36.33)
        ));

        assertThrows(
                IllegalArgumentException.class,
                () -> mapper.toPolygon(polygon)
        );
    }

    @Test
    void 면적이_없는_Polygon을_거부한다() {
        MarketCreateRequest.GeoJsonPolygon polygon = polygon(List.of(
                point(127.43, 36.32),
                point(127.44, 36.32),
                point(127.45, 36.32),
                point(127.43, 36.32)
        ));

        assertThrows(
                IllegalArgumentException.class,
                () -> mapper.toPolygon(polygon)
        );
    }

    private MarketCreateRequest.GeoJsonPolygon polygon(
            List<List<Double>> ring
    ) {
        return new MarketCreateRequest.GeoJsonPolygon(
                "Polygon",
                List.of(ring)
        );
    }

    private List<Double> point(double longitude, double latitude) {
        return List.of(longitude, latitude);
    }
}
