package com.nurigo.nurigo.market.service;

public class DuplicateMarketNameException extends RuntimeException {

    public DuplicateMarketNameException(String name) {
        super("같은 이름의 시장이 이미 존재합니다: " + name);
    }
}
