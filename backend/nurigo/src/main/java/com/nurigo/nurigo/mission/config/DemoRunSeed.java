package com.nurigo.nurigo.mission.config;

import java.security.SecureRandom;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DemoRunSeed {

    private final long value;

    public DemoRunSeed(
            @Value("${nurigo.demo-seed:}") String configuredSeed
    ) {
        this.value = resolve(configuredSeed);
    }

    public long value() {
        return value;
    }

    public static long resolve(String configuredSeed) {
        if (configuredSeed == null || configuredSeed.isBlank()) {
            return new SecureRandom().nextLong();
        }

        try {
            return Long.parseLong(configuredSeed);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException(
                    "nurigo.demo-seed는 정수여야 합니다.",
                    exception
            );
        }
    }
}
