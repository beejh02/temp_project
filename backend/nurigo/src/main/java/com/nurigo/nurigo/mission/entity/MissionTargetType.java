package com.nurigo.nurigo.mission.entity;

public enum MissionTargetType {
    MARKET("market"),
    STORE("store");

    private final String apiValue;

    MissionTargetType(String apiValue) {
        this.apiValue = apiValue;
    }

    public String getApiValue() {
        return apiValue;
    }
}
