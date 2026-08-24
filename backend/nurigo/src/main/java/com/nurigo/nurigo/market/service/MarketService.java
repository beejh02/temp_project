package com.nurigo.nurigo.market.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.nurigo.nurigo.market.entity.Market;
import com.nurigo.nurigo.market.repository.MarketRepository;

@Service
public class MarketService {
    private final MarketRepository marketRepository;

    public MarketService(MarketRepository marketRepository) {
        this.marketRepository = marketRepository;
    }

    public Market save(Market market) {
        return marketRepository.save(market);
    }

    public List<Market> findAll() {
        return marketRepository.findAll();
    }
}
