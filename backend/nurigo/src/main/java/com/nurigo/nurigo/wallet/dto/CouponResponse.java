package com.nurigo.nurigo.wallet.dto;

import java.time.Instant;

public record CouponResponse(String id, String benefitId, String title, int cost,
        Instant issuedAt, Instant expiresAt, String status, boolean demo) {
    public CouponResponse at(Instant now) {
        return new CouponResponse(id, benefitId, title, cost, issuedAt, expiresAt,
                now.isBefore(expiresAt) ? "available" : "expired", demo);
    }
}
