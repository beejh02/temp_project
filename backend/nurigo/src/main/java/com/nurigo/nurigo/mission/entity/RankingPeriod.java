package com.nurigo.nurigo.mission.entity;

public enum RankingPeriod {
    WEEKLY("weekly", "주간"),
    MONTHLY("monthly", "월간");

    private final String apiValue;
    private final String label;

    RankingPeriod(String apiValue, String label) {
        this.apiValue = apiValue;
        this.label = label;
    }

    public String getApiValue() {
        return apiValue;
    }

    public String getLabel() {
        return label;
    }

    public static RankingPeriod from(String value) {
        for (RankingPeriod period : values()) {
            if (period.apiValue.equalsIgnoreCase(value)) {
                return period;
            }
        }

        throw new IllegalArgumentException(
                "지원하지 않는 랭킹 기간입니다: " + value
        );
    }
}
