package com.nurigo.nurigo.market.service;

import java.util.List;

import org.locationtech.jts.geom.Polygon;
import org.springframework.stereotype.Service;

import com.nurigo.nurigo.market.dto.MarketCreateRequest;
import com.nurigo.nurigo.market.dto.MarketResponse;
import com.nurigo.nurigo.market.entity.Market;
import com.nurigo.nurigo.market.mapper.MarketGeometryMapper;
import com.nurigo.nurigo.market.repository.MarketRepository;

@Service
public class MarketService {

    private final MarketRepository marketRepository;
    private final MarketGeometryMapper marketGeometryMapper;

    public MarketService(
            MarketRepository marketRepository,
            MarketGeometryMapper marketGeometryMapper
    ) {
        this.marketRepository = marketRepository;
        this.marketGeometryMapper = marketGeometryMapper;
    }

    public Market create(MarketCreateRequest request) {
        Polygon boundary
                = marketGeometryMapper.toPolygon(request.boundary());

        Market market = new Market(
                request.name(),
                boundary
        );

        return marketRepository.save(market);
    }

    public List<MarketResponse> findAll() {
        return marketRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<MarketResponse> findMarketsAtLocation(
            double latitude,
            double longitude
    ) {
        return marketRepository
                .findMarketsCoveringPoint(latitude, longitude)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private MarketResponse toResponse(Market market) {
        return new MarketResponse(
                market.getId(),
                market.getName(),
                marketGeometryMapper.toGeoJson(market.getBoundary()),
                market.getCreatedAt(),
                market.getUpdatedAt()
        );
    }
}
