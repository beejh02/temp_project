package com.nurigo.nurigo.market.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.nurigo.nurigo.market.entity.Market;

public interface MarketRepository extends JpaRepository<Market, Long> {

    @Query(
            value = """
                    SELECT *
                    FROM markets m
                    WHERE ST_Covers(
                        m.boundary,
                        ST_SetSRID(
                            ST_MakePoint(:longitude, :latitude),
                            4326
                        )
                    )
                    """,
            nativeQuery = true
    )
    List<Market> findMarketsCoveringPoint(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude
    );
}
