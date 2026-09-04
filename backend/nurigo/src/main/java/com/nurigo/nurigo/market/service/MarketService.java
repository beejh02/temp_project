package com.nurigo.nurigo.market.service;

import java.util.List;

import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public Market create(MarketCreateRequest request) {
        String name = normalizeName(request.name());
        ensureNameAvailable(name, null);
        Polygon boundary
                = marketGeometryMapper.toPolygon(request.boundary());

        Market market = new Market(
                name,
                boundary
        );

        return marketRepository.save(market);
    }

    @Transactional
    public MarketResponse update(
            Long marketId,
            MarketCreateRequest request
    ) {
        Market market = requireMarket(marketId);
        String name = normalizeName(request.name());
        ensureNameAvailable(name, marketId);
        Polygon boundary
                = marketGeometryMapper.toPolygon(request.boundary());

        market.update(name, boundary);

        return toResponse(marketRepository.save(market));
    }

    @Transactional
    public void delete(Long marketId) {
        marketRepository.delete(requireMarket(marketId));
    }

    public List<MarketResponse> findAll() {
        return marketRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MarketResponse findById(Long marketId) {
        return toResponse(requireMarket(marketId));
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

    private Market requireMarket(Long marketId) {
        return marketRepository.findById(marketId)
                .orElseThrow(() -> new MarketNotFoundException(marketId));
    }

    private String normalizeName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("시장 이름은 필수입니다.");
        }

        return name.trim();
    }

    private void ensureNameAvailable(String name, Long excludedMarketId) {
        boolean duplicate = excludedMarketId == null
                ? marketRepository.existsByNameIgnoreCase(name)
                : marketRepository.existsByNameIgnoreCaseAndIdNot(
                        name,
                        excludedMarketId
                );

        if (duplicate) {
            throw new DuplicateMarketNameException(name);
        }
    }

    private MarketResponse toResponse(Market market) {
        Point representativePoint = market.getBoundary().getInteriorPoint();

        if (representativePoint.isEmpty()) {
            throw new IllegalStateException(
                    "시장 Polygon의 대표 좌표를 계산할 수 없습니다: "
                    + market.getId()
            );
        }

        return new MarketResponse(
                market.getId(),
                market.getName(),
                marketGeometryMapper.toGeoJson(market.getBoundary()),
                new MarketResponse.LocationResponse(
                        representativePoint.getY(),
                        representativePoint.getX()
                ),
                market.getCreatedAt(),
                market.getUpdatedAt()
        );
    }
}
