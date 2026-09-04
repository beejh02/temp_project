package com.nurigo.nurigo.mission.service;

import org.springframework.stereotype.Component;

import com.nurigo.nurigo.market.dto.MarketResponse;
import com.nurigo.nurigo.market.service.MarketInUseException;
import com.nurigo.nurigo.mission.config.DemoMissionCatalog;
import com.nurigo.nurigo.mission.config.MissionRunCatalog;
import com.nurigo.nurigo.mission.entity.MissionTargetType;

@Component
public class MissionMarketCoordinator {

    private final DemoMissionCatalog templateCatalog;
    private final MissionRunCatalog runCatalog;

    public MissionMarketCoordinator(
            DemoMissionCatalog templateCatalog,
            MissionRunCatalog runCatalog
    ) {
        this.templateCatalog = templateCatalog;
        this.runCatalog = runCatalog;
    }

    public void validateUpdate(
            MarketResponse currentMarket,
            String requestedName
    ) {
        if (!isMissionTarget(currentMarket)) {
            return;
        }

        String currentName = MissionTargetName.normalize(
                currentMarket.name()
        );
        String nextName = MissionTargetName.normalize(requestedName);

        if (!currentName.equals(nextName)) {
            throw new MarketInUseException(
                    "미션 대상 시장의 이름은 변경할 수 없습니다: "
                    + currentMarket.id()
            );
        }
    }

    public void validateDelete(MarketResponse currentMarket) {
        if (isMissionTarget(currentMarket)) {
            throw new MarketInUseException(
                    "미션 대상 시장은 삭제할 수 없습니다: "
                    + currentMarket.id()
            );
        }
    }

    public void marketUpdated(Long marketId) {
        runCatalog.invalidateIfTargetMarket(marketId);
    }

    private boolean isMissionTarget(MarketResponse market) {
        if (runCatalog.isResolvedTargetMarket(market.id())) {
            return true;
        }

        String marketName = MissionTargetName.normalize(market.name());

        return templateCatalog.getDefinitions()
                .stream()
                .filter(definition -> definition.getTargetType()
                        == MissionTargetType.MARKET)
                .map(definition -> MissionTargetName.normalize(
                        definition.getTargetName()
                ))
                .anyMatch(marketName::equals);
    }
}
