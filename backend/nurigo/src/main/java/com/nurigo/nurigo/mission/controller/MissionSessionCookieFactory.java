package com.nurigo.nurigo.mission.controller;

import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class MissionSessionCookieFactory {

    private final boolean secure;
    private final String sameSite;

    public MissionSessionCookieFactory(
            @Value("${app.session-cookie.secure:false}") boolean secure,
            @Value("${app.session-cookie.same-site:Lax}") String sameSite
    ) {
        this.secure = secure;
        this.sameSite = normalizeSameSite(sameSite);

        if (this.sameSite.equals("None") && !secure) {
            throw new IllegalArgumentException(
                    "SameSite=None 세션 쿠키에는 Secure 설정이 필요합니다."
            );
        }
    }

    public ResponseCookie create(String name, String value) {
        return ResponseCookie
                .from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .build();
    }

    private String normalizeSameSite(String value) {
        String normalized = value == null
                ? ""
                : value.trim().toLowerCase(Locale.ROOT);

        return switch (normalized) {
            case "lax" -> "Lax";
            case "strict" -> "Strict";
            case "none" -> "None";
            default -> throw new IllegalArgumentException(
                    "세션 쿠키 SameSite는 Lax, Strict, None 중 하나여야 합니다."
            );
        };
    }
}
