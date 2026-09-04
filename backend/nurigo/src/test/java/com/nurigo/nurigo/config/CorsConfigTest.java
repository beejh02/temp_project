package com.nurigo.nurigo.config;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

class CorsConfigTest {

    @Test
    void 명시한_origin의_인증_요청만_허용한다() {
        InspectableCorsRegistry registry = new InspectableCorsRegistry();
        CorsConfig config = new CorsConfig(
                "http://localhost:5173, https://nurigo.vercel.app/, "
                + "http://localhost:5173"
        );

        config.addCorsMappings(registry);

        CorsConfiguration cors = registry.configurations().get("/api/**");
        assertEquals(
                java.util.List.of(
                        "http://localhost:5173",
                        "https://nurigo.vercel.app"
                ),
                cors.getAllowedOrigins()
        );
        assertEquals(
                java.util.List.of(
                        "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
                ),
                cors.getAllowedMethods()
        );
        assertEquals(java.util.List.of("*"), cors.getAllowedHeaders());
        assertTrue(cors.getAllowCredentials());
        assertEquals(3600L, cors.getMaxAge());
    }

    @Test
    void 인증_CORS에_와일드카드를_사용할_수_없다() {
        CorsConfig config = new CorsConfig("*");

        assertThrows(
                IllegalArgumentException.class,
                () -> config.addCorsMappings(new CorsRegistry())
        );
    }

    @Test
    void CORS_origin은_HTTP_origin_형식이어야_한다() {
        assertInvalidOrigin("ftp://nurigo.example.com");
        assertInvalidOrigin("https://user:pass@nurigo.example.com");
        assertInvalidOrigin("https://nurigo.example.com/path");
        assertInvalidOrigin("https://nurigo.example.com?preview=true");
    }

    @Test
    void 빈_CORS_origin_설정을_거부한다() {
        assertInvalidOrigin(" , ");
    }

    private void assertInvalidOrigin(String origin) {
        CorsConfig config = new CorsConfig(origin);

        assertThrows(
                IllegalArgumentException.class,
                () -> config.addCorsMappings(new CorsRegistry())
        );
    }

    private static final class InspectableCorsRegistry extends CorsRegistry {

        private Map<String, CorsConfiguration> configurations() {
            return getCorsConfigurations();
        }
    }
}
