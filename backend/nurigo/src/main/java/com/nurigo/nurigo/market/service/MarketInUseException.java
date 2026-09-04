package com.nurigo.nurigo.market.service;

public class MarketInUseException extends RuntimeException {

    public MarketInUseException(String message) {
        super(message);
    }
}
