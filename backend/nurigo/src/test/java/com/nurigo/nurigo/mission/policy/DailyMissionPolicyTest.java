package com.nurigo.nurigo.mission.policy;

import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.nurigo.nurigo.mission.config.DemoMissionCatalog;
import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionGroup;

class DailyMissionPolicyTest {

    private final DailyMissionPolicy dailyMissionPolicy
            = new DailyMissionPolicy();
    private final List<MissionDefinition> definitions
            = new DemoMissionCatalog().getDefinitions();

    @Test
    void 개인_미션_2개를_실행_시드에_따라_선택한다() {
        List<MissionDefinition> selected
                = dailyMissionPolicy.selectDailyMissions(
                        definitions,
                        new Random(42L)
                );

        assertEquals(2, selected.size());
        assertTrue(selected.stream().noneMatch(MissionDefinition::isShared));
        assertTrue(selected.stream().allMatch(
                definition -> definition.getMissionGroup()
                == MissionGroup.DAILY
        ));
    }

    @Test
    void 우선_미션은_공동_1개와_개인_1개를_선택한다() {
        List<MissionDefinition> selected
                = dailyMissionPolicy.selectRunSpecialMissions(
                        definitions,
                        new Random(42L)
                );

        assertEquals(2, selected.size());
        assertEquals(
                1,
                selected.stream()
                        .filter(MissionDefinition::isShared)
                        .count()
        );
        assertTrue(selected.stream().allMatch(
                definition -> definition.getMissionGroup()
                == MissionGroup.SPECIAL
        ));
    }

    @Test
    void 공동_미션_후보가_없으면_실행_구성을_만들지_않는다() {
        List<MissionDefinition> withoutShared = definitions.stream()
                .filter(definition -> !definition.isShared())
                .toList();

        assertThrows(
                IllegalStateException.class,
                () -> dailyMissionPolicy.selectRunSpecialMissions(
                        withoutShared,
                        new Random(42L)
                )
        );
    }
}
