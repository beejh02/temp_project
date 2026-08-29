package com.nurigo.nurigo.mission.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

import org.springframework.stereotype.Component;

import com.nurigo.nurigo.market.dto.MarketResponse;
import com.nurigo.nurigo.market.service.MarketService;
import com.nurigo.nurigo.mission.config.DemoRunSeed;
import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionTargetType;
import com.nurigo.nurigo.store.dto.StoreResponse;
import com.nurigo.nurigo.store.service.StoreService;

@Component
public class MissionTargetResolver {

    private static final long STORE_SELECTION_SALT = 0x4E555249474FL;

    private final MarketService marketService;
    private final StoreService storeService;
    private final DemoRunSeed runSeed;

    public MissionTargetResolver(
            MarketService marketService,
            StoreService storeService,
            DemoRunSeed runSeed
    ) {
        this.marketService = marketService;
        this.storeService = storeService;
        this.runSeed = runSeed;
    }

    public List<MissionDefinition> resolve(
            List<MissionDefinition> templates
    ) {
        List<MarketResponse> markets = marketService.findAll();
        MissionDefinition primaryMarketTemplate = templates.stream()
                .filter(template -> template.getTargetType()
                        == MissionTargetType.MARKET)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "점포 미션의 대상 시장 정의가 필요합니다."
                ));
        MarketResponse primaryMarket = findTargetMarket(
                markets,
                primaryMarketTemplate.getTargetName()
        );
        Map<Long, StoreResponse> uniqueStores = new LinkedHashMap<>();

        storeService.findStoresInsideMarket(primaryMarket.id())
                .stream()
                .filter(this::hasUsableLocation)
                .forEach(store -> uniqueStores.putIfAbsent(store.id(), store));

        List<StoreResponse> storeCandidates = new ArrayList<>(
                uniqueStores.values()
        );
        int storeMissionCount = (int) templates.stream()
                .filter(template -> template.getTargetType()
                        == MissionTargetType.STORE)
                .count();

        if (storeCandidates.size() < storeMissionCount) {
            throw new IllegalStateException(
                    "시장 내부의 유효한 점포가 %d개 이상 필요합니다. 현재 %d개입니다."
                            .formatted(storeMissionCount, storeCandidates.size())
            );
        }

        Collections.shuffle(
                storeCandidates,
                new Random(runSeed.value() ^ STORE_SELECTION_SALT)
        );

        int storeIndex = 0;
        List<MissionDefinition> resolved = new ArrayList<>(templates.size());

        for (MissionDefinition template : templates) {
            if (template.getTargetType() == MissionTargetType.MARKET) {
                MarketResponse market = findTargetMarket(
                        markets,
                        template.getTargetName()
                );
                MarketResponse.LocationResponse location = market.location();

                if (location == null
                        || !Double.isFinite(location.latitude())
                        || !Double.isFinite(location.longitude())) {
                    throw new IllegalStateException(
                            "미션 대상 시장의 대표 좌표가 없습니다: "
                            + market.id()
                    );
                }

                resolved.add(template.withTarget(
                        market.id(),
                        market.name(),
                        template.getTargetAddress(),
                        location.latitude(),
                        location.longitude()
                ));
                continue;
            }

            StoreResponse store = storeCandidates.get(storeIndex++);
            resolved.add(template.withTarget(
                    store.id(),
                    store.name(),
                    store.roadAddress(),
                    store.latitude(),
                    store.longitude()
            ));
        }

        return List.copyOf(resolved);
    }

    private MarketResponse findTargetMarket(
            List<MarketResponse> markets,
            String targetName
    ) {
        List<MarketResponse> matches = markets.stream()
                .filter(market -> normalizeName(market.name()).equals(
                        normalizeName(targetName)
                ))
                .toList();

        if (matches.isEmpty()) {
            throw new IllegalStateException(
                    "미션 대상 시장을 DB에서 찾을 수 없습니다: " + targetName
            );
        }

        if (matches.size() > 1) {
            throw new IllegalStateException(
                    "동일한 이름의 미션 대상 시장이 여러 개입니다: "
                    + targetName
            );
        }

        return matches.get(0);
    }

    private boolean hasUsableLocation(StoreResponse store) {
        return store.id() != null
                && store.name() != null
                && !store.name().isBlank()
                && Double.isFinite(store.latitude())
                && Double.isFinite(store.longitude());
    }

    private String normalizeName(String value) {
        if (value == null) {
            return "";
        }

        return value.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }
}
