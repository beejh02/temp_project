package com.nurigo.nurigo.mission.entity;

public enum MissionGroup {
    DAILY("daily"),
    SPECIAL("special");

    private final String apiValue;

    MissionGroup(String apiValue) {
        this.apiValue = apiValue;
    }

    public String getApiValue() {
        return apiValue;
    }
}
