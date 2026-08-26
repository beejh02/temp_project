package com.nurigo.nurigo.store.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SpatialIndexInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public SpatialIndexInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments arguments) {
        jdbcTemplate.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_markets_boundary_gist
                ON markets USING GIST (boundary)
                """
        );
        jdbcTemplate.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_stores_location_gist
                ON stores USING GIST (location)
                """
        );
    }
}
