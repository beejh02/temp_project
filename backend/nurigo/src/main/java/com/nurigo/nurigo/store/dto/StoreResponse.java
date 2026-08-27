package com.nurigo.nurigo.store.dto;

public record StoreResponse(
        Long id,
        String sourceId,
        String name,
        String branchName,
        String majorCategoryCode,
        String majorCategoryName,
        String middleCategoryCode,
        String middleCategoryName,
        String smallCategoryCode,
        String smallCategoryName,
        String roadAddress,
        double latitude,
        double longitude
        ) {

}
