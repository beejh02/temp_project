package com.nurigo.nurigo.market.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nurigo.nurigo.market.dto.MarketCreateRequest;
import com.nurigo.nurigo.market.dto.MarketResponse;
import com.nurigo.nurigo.market.entity.Market;
import com.nurigo.nurigo.market.service.MarketService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/markets")
public class MarketController {

    private final MarketService marketService;

    public MarketController(MarketService marketService) {
        this.marketService = marketService;
    }

    @PostMapping
    public ResponseEntity<Long> createMarket(
            @Valid @RequestBody MarketCreateRequest request
    ) {
        Market createdMarket = marketService.create(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdMarket.getId());
    }

    @GetMapping
    public ResponseEntity<List<MarketResponse>> getMarkets() {
        return ResponseEntity.ok(
                marketService.findAll()
        );
    }
}
