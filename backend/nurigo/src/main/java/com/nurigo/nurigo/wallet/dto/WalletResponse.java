package com.nurigo.nurigo.wallet.dto;

import java.time.Instant;
import java.util.List;

public record WalletResponse(
        String nickname,
        int balance,
        int totalEarned,
        int totalSpent,
        List<PointTransaction> transactions, List<CouponResponse> coupons
) {
    public record PointTransaction(
            String id,
            String type,
            String title,
            int amount,
            int balanceAfter,
            Instant occurredAt
    ) {
    }
}
