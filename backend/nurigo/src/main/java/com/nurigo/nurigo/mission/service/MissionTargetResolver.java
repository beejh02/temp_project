package com.nurigo.nurigo.mission.service;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Component;

import com.nurigo.nurigo.market.dto.MarketResponse;
import com.nurigo.nurigo.market.service.MarketService;
import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionTargetType;

@Component
public class MissionTargetResolver {

    private final MarketService marketService;

    public MissionTargetResolver(MarketService marketService) {
        this.marketService = marketService;
    }

    public List<MissionDefinition> resolve(
            List<MissionDefinition> templates
    ) {
        List<MarketResponse> markets = marketService.findAll();

        return templates.stream()
                .map(template -> resolveTarget(template, markets))
                .toList();
    }

    private MissionDefinition resolveTarget(
            MissionDefinition template,
            List<MarketResponse> markets
    ) {
        if (template.getTargetType() != MissionTargetType.MARKET) {
            return template;
        }

        List<MarketResponse> matches = markets.stream()
                .filter(market -> normalizeName(market.name()).equals(
                        normalizeName(template.getTargetName())
                ))
                .toList();

        if (matches.isEmpty()) {
            throw new IllegalStateException(
                    "미션 대상 시장을 DB에서 찾을 수 없습니다: "
                    + template.getTargetName()
            );
        }

        if (matches.size() > 1) {
            throw new IllegalStateException(
                    "동일한 이름의 미션 대상 시장이 여러 개입니다: "
                    + template.getTargetName()
            );
        }

        MarketResponse market = matches.get(0);
        MarketResponse.LocationResponse location = market.location();

        if (location == null
                || !Double.isFinite(location.latitude())
                || !Double.isFinite(location.longitude())) {
            throw new IllegalStateException(
                    "미션 대상 시장의 대표 좌표가 없습니다: "
                    + market.id()
            );
        }

        return template.withTarget(
                market.id(),
                market.name(),
                location.latitude(),
                location.longitude()
        );
    }

    private String normalizeName(String value) {
        if (value == null) {
            return "";
        }

        return value.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }
}
