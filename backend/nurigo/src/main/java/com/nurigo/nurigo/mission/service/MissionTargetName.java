package com.nurigo.nurigo.mission.service;

import java.util.Locale;

final class MissionTargetName {

    private MissionTargetName() {
    }

    static String normalize(String value) {
        if (value == null) {
            return "";
        }

        return value.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }
}
