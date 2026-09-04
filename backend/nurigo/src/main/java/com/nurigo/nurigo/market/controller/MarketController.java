package com.nurigo.nurigo.market.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nurigo.nurigo.market.dto.MarketCreateRequest;
import com.nurigo.nurigo.market.dto.MarketResponse;
import com.nurigo.nurigo.market.entity.Market;
import com.nurigo.nurigo.market.service.MarketService;
import com.nurigo.nurigo.mission.service.MissionMarketCoordinator;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/markets")
public class MarketController {

    private final MarketService marketService;
    private final MissionMarketCoordinator missionMarketCoordinator;

    public MarketController(
            MarketService marketService,
            MissionMarketCoordinator missionMarketCoordinator
    ) {
        this.marketService = marketService;
        this.missionMarketCoordinator = missionMarketCoordinator;
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

    @PutMapping("/{marketId}")
    public ResponseEntity<MarketResponse> updateMarket(
            @PathVariable Long marketId,
            @Valid @RequestBody MarketCreateRequest request
    ) {
        MarketResponse currentMarket = marketService.findById(marketId);
        missionMarketCoordinator.validateUpdate(
                currentMarket,
                request.name()
        );
        MarketResponse updatedMarket = marketService.update(
                marketId,
                request
        );
        missionMarketCoordinator.marketUpdated(marketId);

        return ResponseEntity.ok(updatedMarket);
    }

    @DeleteMapping("/{marketId}")
    public ResponseEntity<Void> deleteMarket(
            @PathVariable Long marketId
    ) {
        MarketResponse currentMarket = marketService.findById(marketId);
        missionMarketCoordinator.validateDelete(currentMarket);
        marketService.delete(marketId);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/location")
    public ResponseEntity<List<MarketResponse>> getMarketsAtLocation(
            @RequestParam double latitude,
            @RequestParam double longitude
    ) {
        return ResponseEntity.ok(
                marketService.findMarketsAtLocation(
                        latitude,
                        longitude
                )
        );
    }
}
