package com.nurigo.nurigo.market.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nurigo.nurigo.market.entity.Market;

public interface MarketRepository extends JpaRepository<Market, Long> {
}
