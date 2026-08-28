package com.nurigo.nurigo.mission.config;

import java.util.List;

import org.springframework.stereotype.Component;

import com.nurigo.nurigo.mission.entity.MissionDefinition;
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
}
