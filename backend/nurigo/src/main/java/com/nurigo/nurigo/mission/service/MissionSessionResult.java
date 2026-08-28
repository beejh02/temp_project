package com.nurigo.nurigo.mission.service;

public record MissionSessionResult<T>(
        String sessionId,
        boolean newSession,
        T data
        ) {

}
