package com.nurigo.nurigo.config;

import java.net.URI;
import java.util.Arrays;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String allowedOrigins;

    public CorsConfig(
            @Value("${app.cors.allowed-origins:http://localhost:5173,https://nurigo.vercel.app}") String allowedOrigins
    ) {
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] configuredOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toArray(String[]::new);

        if (configuredOrigins.length == 0) {
            throw new IllegalArgumentException(
                    "CORS 허용 origin을 하나 이상 설정해야 합니다."
            );
        }

        if (Arrays.asList(configuredOrigins).contains("*")) {
            throw new IllegalArgumentException(
                    "인증 요청의 CORS origin에는 와일드카드를 사용할 수 없습니다."
            );
        }

        String[] origins = Arrays.stream(configuredOrigins)
                .map(CorsConfig::normalizeOrigin)
                .distinct()
                .toArray(String[]::new);

        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    private static String normalizeOrigin(String origin) {
        URI uri;

        try {
            uri = URI.create(origin);
        } catch (IllegalArgumentException exception) {
            throw invalidOrigin(origin, exception);
        }

        String scheme = uri.getScheme();
        String path = uri.getRawPath();
        boolean isHttpOrigin = scheme != null
                && (scheme.equalsIgnoreCase("http")
                || scheme.equalsIgnoreCase("https"));
        boolean hasRootPathOnly = path == null
                || path.isEmpty()
                || path.equals("/");

        if (!isHttpOrigin
                || uri.isOpaque()
                || uri.getHost() == null
                || uri.getUserInfo() != null
                || !hasRootPathOnly
                || uri.getRawQuery() != null
                || uri.getRawFragment() != null
                || uri.getPort() > 65535) {
            throw invalidOrigin(origin, null);
        }

        return scheme.toLowerCase(Locale.ROOT) + "://" + uri.getRawAuthority();
    }

    private static IllegalArgumentException invalidOrigin(
            String origin,
            Exception cause
    ) {
        String message = "CORS 허용 origin에는 경로가 없는 HTTP(S) origin만 "
                + "설정해야 합니다: " + origin;

        return cause == null
                ? new IllegalArgumentException(message)
                : new IllegalArgumentException(message, cause);
    }
}
