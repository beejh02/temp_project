package com.nurigo.nurigo.store.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.nurigo.nurigo.store.dto.StoreImportResult;
import com.nurigo.nurigo.store.dto.StoreResponse;
import com.nurigo.nurigo.store.service.StoreImportService;
import com.nurigo.nurigo.store.service.StoreService;

@RestController
@RequestMapping("/api/stores")
public class StoreController {

    private final StoreService storeService;
    private final StoreImportService storeImportService;

    public StoreController(
            StoreService storeService,
            StoreImportService storeImportService
    ) {
        this.storeService = storeService;
        this.storeImportService = storeImportService;
    }

    @GetMapping("/in-markets")
    public ResponseEntity<List<StoreResponse>> getStoresInsideMarkets() {
        return ResponseEntity.ok(
                storeService.findStoresInsideMarkets()
        );
    }

    @PostMapping("/import")
    public ResponseEntity<StoreImportResult> importStores(
            @RequestPart("file") MultipartFile file
    ) {
        try {
            return ResponseEntity.ok(
                    storeImportService.importCsv(file)
            );
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    exception.getMessage(),
                    exception
            );
        }
    }
}
