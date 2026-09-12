package com.nurigo.nurigo.mission.config;

import java.util.List;

import org.springframework.stereotype.Component;

import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionTargetType;
import com.nurigo.nurigo.mission.service.MissionTargetResolver;

@Component
public class MissionRunCatalog {

    private final DemoMissionCatalog templateCatalog;
    private final MissionTargetResolver targetResolver;

    private volatile List<MissionDefinition> definitions;

    public MissionRunCatalog(
            DemoMissionCatalog templateCatalog,
            MissionTargetResolver targetResolver
    ) {
        this.templateCatalog = templateCatalog;
        this.targetResolver = targetResolver;
    }

    public List<MissionDefinition> getDefinitions() {
        List<MissionDefinition> currentDefinitions = definitions;

        if (currentDefinitions != null) {
            return currentDefinitions;
        }

        synchronized (this) {
            if (definitions == null) {
                definitions = List.copyOf(targetResolver.resolve(
                        templateCatalog.getDefinitions()
                ));
            }

            return definitions;
        }
    }

    // 세션의 배정·보상 기록은 시장의 등록·삭제와 별개로 서버 실행 동안 유지한다.
    public List<MissionDefinition> getAssignmentDefinitions() {
        return templateCatalog.getDefinitions();
    }

    public synchronized void invalidate() {
        definitions = null;
    }

    public synchronized boolean isResolvedTargetMarket(Long marketId) {
        return definitions != null && definitions.stream()
                .filter(definition -> definition.getTargetType()
                        == MissionTargetType.MARKET)
                .anyMatch(definition -> definition.getTargetId()
                        .equals(marketId));
    }

    public synchronized boolean invalidateIfTargetMarket(Long marketId) {
        if (!(definitions != null && definitions.isEmpty()) && !isResolvedTargetMarket(marketId)) {
            return false;
        }

        definitions = null;
        return true;
    }
}
