package com.nurigo.nurigo.wallet.runtime;

import java.util.List;
import com.nurigo.nurigo.wallet.dto.BenefitResponse;

public final class DemoBenefitCatalog {
    private DemoBenefitCatalog() {}

    private static final List<BenefitResponse> BENEFITS = List.of(
            new BenefitResponse("snack", "시장 간식 500원 할인", "시장 탐험 뒤 즐기는 작은 간식 혜택", 10, true),
            new BenefitResponse("market", "시장 장보기 1,000원 할인", "시장에서 발견하는 알뜰한 장보기 혜택", 20, true),
            new BenefitResponse("character", "누리고 캐릭터 키링", "시장 방문의 추억을 담은 캐릭터 선물", 30, true)
    );

    public static List<BenefitResponse> all() { return BENEFITS; }

    public static BenefitResponse require(String id) {
        return BENEFITS.stream().filter(item -> item.id().equals(id)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("교환할 수 없는 혜택입니다."));
    }
}
