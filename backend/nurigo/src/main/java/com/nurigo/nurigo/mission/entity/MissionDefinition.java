package com.nurigo.nurigo.mission.entity;

public final class MissionDefinition {

    private final Long id;
    private final String missionKey;
    private final MissionGroup missionGroup;
    private final MissionCategory category;
    private final String title;
    private final String description;
    private final String activationReason;
    private final int rewardPoints;
    private final MissionTargetType targetType;
    private final Long targetId;
    private final String targetName;
    private final String targetAddress;
    private final double targetLatitude;
    private final double targetLongitude;
    private final String verificationLabel;
    private final int progressTarget;
    private final Integer capacity;
    private final int displayOrder;
    private final boolean shared;

    public MissionDefinition(
            Long id,
            String missionKey,
            MissionGroup missionGroup,
            MissionCategory category,
            String title,
            String description,
            String activationReason,
            int rewardPoints,
            MissionTargetType targetType,
            Long targetId,
            String targetName,
            String targetAddress,
            double targetLatitude,
            double targetLongitude,
            String verificationLabel,
            int progressTarget,
            Integer capacity,
            int displayOrder,
            boolean shared
    ) {
        this.id = id;
        this.missionKey = missionKey;
        this.missionGroup = missionGroup;
        this.category = category;
        this.title = title;
        this.description = description;
        this.activationReason = activationReason;
        this.rewardPoints = rewardPoints;
        this.targetType = targetType;
        this.targetId = targetId;
        this.targetName = targetName;
        this.targetAddress = targetAddress;
        this.targetLatitude = targetLatitude;
        this.targetLongitude = targetLongitude;
        this.verificationLabel = verificationLabel;
        this.progressTarget = progressTarget;
        this.capacity = capacity;
        this.displayOrder = displayOrder;
        this.shared = shared;
    }

    public Long getId() {
        return id;
    }

    public String getMissionKey() {
        return missionKey;
    }

    public MissionGroup getMissionGroup() {
        return missionGroup;
    }

    public MissionCategory getCategory() {
        return category;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getActivationReason() {
        return activationReason;
    }

    public int getRewardPoints() {
        return rewardPoints;
    }

    public MissionTargetType getTargetType() {
        return targetType;
    }

    public Long getTargetId() {
        return targetId;
    }

    public String getTargetName() {
        return targetName;
    }

    public String getTargetAddress() {
        return targetAddress;
    }

    public double getTargetLatitude() {
        return targetLatitude;
    }

    public double getTargetLongitude() {
        return targetLongitude;
    }

    public String getVerificationLabel() {
        return verificationLabel;
    }

    public int getProgressTarget() {
        return progressTarget;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public boolean isShared() {
        return shared;
    }
}
