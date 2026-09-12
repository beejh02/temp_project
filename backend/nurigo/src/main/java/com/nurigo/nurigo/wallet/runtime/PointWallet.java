package com.nurigo.nurigo.wallet.runtime;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.nurigo.nurigo.wallet.dto.WalletResponse;
import com.nurigo.nurigo.wallet.dto.WalletResponse.PointTransaction;
import com.nurigo.nurigo.wallet.dto.BenefitResponse;
import com.nurigo.nurigo.wallet.dto.CouponResponse;

/** MissionRunStateStore의 세션 잠금 안에서만 변경하는 실행 단위 지갑. */
public final class PointWallet {
    private int balance;
    private int totalEarned;
    private int totalSpent;
    private final Map<String, PointTransaction> transactions = new LinkedHashMap<>();
    private final Map<UUID, CouponResponse> exchanges = new LinkedHashMap<>();

    public void credit(String sourceId, String title, int points, Instant occurredAt) {
        if (points <= 0) {
            throw new IllegalArgumentException("적립 포인트는 양수여야 합니다.");
        }
        if (transactions.containsKey(sourceId)) {
            return;
        }
        balance += points;
        totalEarned += points;
        transactions.put(sourceId, new PointTransaction(
                sourceId, "earned", title, points, balance, occurredAt
        ));
    }

    public WalletResponse snapshot(String nickname) {
        List<PointTransaction> history = new ArrayList<>(transactions.values());
        Collections.reverse(history);
        List<CouponResponse> coupons = new ArrayList<>(exchanges.values());
        Collections.reverse(coupons);
        Instant now = Instant.now();
        return new WalletResponse(nickname, balance, totalEarned, totalSpent,
                List.copyOf(history), coupons.stream().map(coupon -> coupon.at(now)).toList());
    }

    public CouponResponse exchange(BenefitResponse benefit, UUID requestId, Instant now) {
        if (requestId == null) throw new IllegalArgumentException("교환 요청 번호가 필요합니다.");
        CouponResponse previous = exchanges.get(requestId);
        if (previous != null) {
            if (!previous.benefitId().equals(benefit.id())) {
                throw new IllegalStateException("이미 다른 혜택에 사용한 요청 번호입니다.");
            }
            return previous.at(now);
        }
        if (balance < benefit.cost()) throw new IllegalStateException("사용 가능한 포인트가 부족해요.");
        var coupon = new CouponResponse(UUID.randomUUID().toString(), benefit.id(), benefit.title(),
                benefit.cost(), now, now.plus(30, ChronoUnit.DAYS), "available", benefit.demo());
        balance -= benefit.cost();
        totalSpent += benefit.cost();
        String transactionId = "exchange:" + requestId;
        transactions.put(transactionId, new PointTransaction(transactionId, "spent",
                benefit.title() + " 교환", -benefit.cost(), balance, now));
        exchanges.put(requestId, coupon);
        return coupon;
    }
}
