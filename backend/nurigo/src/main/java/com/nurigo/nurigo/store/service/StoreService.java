package com.nurigo.nurigo.store.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nurigo.nurigo.store.dto.StoreResponse;
import com.nurigo.nurigo.store.entity.Store;
import com.nurigo.nurigo.store.repository.StoreRepository;

@Service
public class StoreService {

    private final StoreRepository storeRepository;

    public StoreService(StoreRepository storeRepository) {
        this.storeRepository = storeRepository;
    }

    @Transactional(readOnly = true)
    public List<StoreResponse> findStoresInsideMarkets() {
        return storeRepository.findStoresInsideMarkets()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StoreResponse> findStoresNearLocation(
            double latitude,
            double longitude,
            double radiusMeters
    ) {
        return storeRepository.findStoresNearLocation(
                latitude,
                longitude,
                radiusMeters
        ).stream()
                .map(this::toResponse)
                .toList();
    }

    private StoreResponse toResponse(Store store) {
        return new StoreResponse(
                store.getId(),
                store.getSourceId(),
                store.getName(),
                store.getBranchName(),
                store.getMajorCategoryCode(),
                store.getMajorCategoryName(),
                store.getMiddleCategoryCode(),
                store.getMiddleCategoryName(),
                store.getSmallCategoryCode(),
                store.getSmallCategoryName(),
                store.getRoadAddress(),
                store.getLocation().getY(),
                store.getLocation().getX()
        );
    }
}
