package com.nurigo.nurigo.store.dto;

public record StoreImportResult(
        int processedRows,
        int upsertedRows,
        int skippedRows
        ) {
}
