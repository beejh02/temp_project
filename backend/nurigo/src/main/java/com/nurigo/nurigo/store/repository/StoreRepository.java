package com.nurigo.nurigo.store.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.nurigo.nurigo.store.entity.Store;

public interface StoreRepository extends JpaRepository<Store, Long> {

    Optional<Store> findBySourceId(String sourceId);

    @Query(
            value = """
                    SELECT s.*
                    FROM stores s
                    WHERE EXISTS (
                        SELECT 1
                        FROM markets m
                        WHERE ST_Covers(m.boundary, s.location)
                    )
                    ORDER BY s.id
                    """,
            nativeQuery = true
    )
    List<Store> findStoresInsideMarkets();

    @Query(
            value = """
                    SELECT s.*
                    FROM stores s
                    JOIN markets m ON m.id = :marketId
                    WHERE ST_Covers(m.boundary, s.location)
                    ORDER BY s.id
                    """,
            nativeQuery = true
    )
    List<Store> findStoresInsideMarket(
            @Param("marketId") Long marketId
    );

    @Query(
            value = """
                    SELECT s.*
                    FROM stores s
                    WHERE ST_DWithin(
                        s.location::geography,
                        ST_SetSRID(
                            ST_MakePoint(:longitude, :latitude),
                            4326
                        )::geography,
                        :radiusMeters
                    )
                    ORDER BY ST_Distance(
                        s.location::geography,
                        ST_SetSRID(
                            ST_MakePoint(:longitude, :latitude),
                            4326
                        )::geography
                    ), s.id
                    """,
            nativeQuery = true
    )
    List<Store> findStoresNearLocation(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("radiusMeters") double radiusMeters
    );
}
