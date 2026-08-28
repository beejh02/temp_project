package com.nurigo.nurigo.mission.policy;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.random.RandomGenerator;

import org.springframework.stereotype.Component;

import com.nurigo.nurigo.mission.entity.MissionDefinition;
import com.nurigo.nurigo.mission.entity.MissionGroup;

@Component
public class DailyMissionPolicy {

    public static final int DAILY_MISSION_COUNT = 2;
    public static final int SHARED_SPECIAL_MISSION_COUNT = 1;
    public static final int PERSONAL_SPECIAL_MISSION_COUNT = 1;
    public static final int SPECIAL_MISSION_COUNT
            = SHARED_SPECIAL_MISSION_COUNT + PERSONAL_SPECIAL_MISSION_COUNT;
    public static final int TOTAL_MISSION_COUNT
            = DAILY_MISSION_COUNT + SPECIAL_MISSION_COUNT;

    public List<MissionDefinition> selectDailyMissions(
            List<MissionDefinition> definitions,
            RandomGenerator random
    ) {
        return selectRandom(
                definitions.stream()
                        .filter(definition -> definition.getMissionGroup()
                        == MissionGroup.DAILY)
                        .filter(definition -> !definition.isShared())
                        .toList(),
                DAILY_MISSION_COUNT,
                random,
                "개인 데일리"
        );
    }

    public List<MissionDefinition> selectRunSpecialMissions(
            List<MissionDefinition> definitions,
            RandomGenerator random
    ) {
        List<MissionDefinition> selected = new ArrayList<>();
        selected.addAll(selectRandom(
                definitions.stream()
                        .filter(definition -> definition.getMissionGroup()
                        == MissionGroup.SPECIAL)
                        .filter(MissionDefinition::isShared)
                        .toList(),
                SHARED_SPECIAL_MISSION_COUNT,
                random,
                "공동 우선"
        ));
        selected.addAll(selectRandom(
                definitions.stream()
                        .filter(definition -> definition.getMissionGroup()
                        == MissionGroup.SPECIAL)
                        .filter(definition -> !definition.isShared())
                        .toList(),
                PERSONAL_SPECIAL_MISSION_COUNT,
                random,
                "개인 우선"
        ));
        selected.sort(Comparator.comparingInt(MissionDefinition::getDisplayOrder));

        return List.copyOf(selected);
    }

    private List<MissionDefinition> selectRandom(
            List<MissionDefinition> candidates,
            int count,
            RandomGenerator random,
            String label
    ) {
        if (candidates.size() < count) {
            throw new IllegalStateException(
                    "%s 미션 정의가 %d개 이상 필요합니다. 현재 %d개입니다."
                            .formatted(label, count, candidates.size())
            );
        }

        List<MissionDefinition> shuffled = new ArrayList<>(candidates);

        for (int index = shuffled.size() - 1; index > 0; index--) {
            int swapIndex = random.nextInt(index + 1);
            MissionDefinition current = shuffled.get(index);
            shuffled.set(index, shuffled.get(swapIndex));
            shuffled.set(swapIndex, current);
        }

        return shuffled.stream()
                .limit(count)
                .sorted(Comparator.comparingInt(
                        MissionDefinition::getDisplayOrder
                ))
                .toList();
    }
}
