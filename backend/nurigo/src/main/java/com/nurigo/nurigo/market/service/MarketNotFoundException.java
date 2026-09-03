package com.nurigo.nurigo.market.service;

public class MarketNotFoundException extends RuntimeException {

    public MarketNotFoundException(Long marketId) {
        super("시장을 찾을 수 없습니다: " + marketId);
    }
}
