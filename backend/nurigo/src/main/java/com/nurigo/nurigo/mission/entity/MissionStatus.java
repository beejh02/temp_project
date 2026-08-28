package com.nurigo.nurigo.mission.entity;

public enum MissionStatus {
    AVAILABLE("available"),
    IN_PROGRESS("in_progress"),
    COMPLETED("completed"),
    CLAIMED("claimed"),
    CLOSED("closed");

    private final String apiValue;

    MissionStatus(String apiValue) {
        this.apiValue = apiValue;
    }

    public String getApiValue() {
        return apiValue;
    }
}
