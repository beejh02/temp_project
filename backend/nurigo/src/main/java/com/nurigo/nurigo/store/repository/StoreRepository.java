package com.nurigo.nurigo.store.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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
}
