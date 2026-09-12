package com.nurigo.nurigo.wallet.runtime;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.nurigo.nurigo.wallet.dto.WalletResponse;
import com.nurigo.nurigo.wallet.dto.WalletResponse.PointTransaction;

/** MissionRunStateStore의 세션 잠금 안에서만 변경하는 실행 단위 지갑. */
public final class PointWallet {
    private int balance;
    private int totalEarned;
    private final Map<String, PointTransaction> transactions = new LinkedHashMap<>();

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
        return new WalletResponse(nickname, balance, totalEarned, 0, List.copyOf(history));
    }
}
