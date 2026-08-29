package com.nurigo.nurigo.mission.policy;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.nurigo.nurigo.mission.config.DemoMissionCatalog;
import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionTargetType;

class MissionLocationPolicyTest {

    private final MissionLocationPolicy policy = new MissionLocationPolicy();
    private final MissionDefinition storeMission = new DemoMissionCatalog()
            .getDefinitions()
            .stream()
            .filter(definition -> definition.getTargetType()
                    == MissionTargetType.STORE)
            .findFirst()
            .orElseThrow();

    @Test
    void 점포_반경_30미터_안쪽은_접근으로_판정한다() {
        assertTrue(policy.isWithinStoreRadius(
                storeMission,
                storeMission.getTargetLatitude(),
                storeMission.getTargetLongitude()
        ));
    }

    @Test
    void 점포_반경_30미터_바깥은_접근으로_판정하지_않는다() {
        assertFalse(policy.isWithinStoreRadius(
                storeMission,
                storeMission.getTargetLatitude() + 0.001,
                storeMission.getTargetLongitude()
        ));
    }

    @Test
    void 정확도_기준을_넘는_GPS는_거부한다() {
        assertTrue(policy.hasAcceptableAccuracy(50));
        assertFalse(policy.hasAcceptableAccuracy(50.1));
        assertFalse(policy.hasAcceptableAccuracy(Double.NaN));
    }
}
