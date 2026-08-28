package com.nurigo.nurigo.mission.entity;

public enum MissionCategory {
    VISIT("visit"),
    EXPLORATION("exploration"),
    CHALLENGE("challenge"),
    OTHER("other");

    private final String apiValue;

    MissionCategory(String apiValue) {
        this.apiValue = apiValue;
    }

    public String getApiValue() {
        return apiValue;
    }
}
