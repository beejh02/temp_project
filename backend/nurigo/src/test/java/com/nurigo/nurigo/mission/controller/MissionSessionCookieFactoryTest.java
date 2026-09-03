package com.nurigo.nurigo.mission.controller;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

class MissionSessionCookieFactoryTest {

    @Test
    void Vercel_프록시용_쿠키는_Secure와_Lax_정책을_사용한다() {
        MissionSessionCookieFactory factory
                = new MissionSessionCookieFactory(true, "Lax");

        String cookie = factory.create("session", "value").toString();

        assertTrue(cookie.contains("session=value"));
        assertTrue(cookie.contains("Path=/"));
        assertTrue(cookie.contains("Secure"));
        assertTrue(cookie.contains("HttpOnly"));
        assertTrue(cookie.contains("SameSite=Lax"));
    }

    @Test
    void 로컬_HTTP용_쿠키는_Secure를_사용하지_않는다() {
        MissionSessionCookieFactory factory
                = new MissionSessionCookieFactory(false, "lax");

        String cookie = factory.create("session", "value").toString();

        assertFalse(cookie.contains("Secure"));
        assertTrue(cookie.contains("SameSite=Lax"));
    }

    @Test
    void SameSite_None은_Secure_설정과_함께_사용한다() {
        assertThrows(
                IllegalArgumentException.class,
                () -> new MissionSessionCookieFactory(false, "None")
        );

        MissionSessionCookieFactory factory
                = new MissionSessionCookieFactory(true, "None");

        assertTrue(factory.create("session", "value")
                .toString()
                .contains("SameSite=None"));
    }
}
