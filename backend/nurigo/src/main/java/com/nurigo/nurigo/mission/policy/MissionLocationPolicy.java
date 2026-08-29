package com.nurigo.nurigo.mission.policy;

import org.springframework.stereotype.Component;

import com.nurigo.nurigo.mission.entity.MissionDefinition;

@Component
public class MissionLocationPolicy {

    public static final double STORE_RADIUS_METERS = 30.0;
    public static final double MAX_ACCEPTED_ACCURACY_METERS = 50.0;
    private static final double EARTH_RADIUS_METERS = 6_371_000.0;

    public boolean hasAcceptableAccuracy(double accuracy) {
        return Double.isFinite(accuracy)
                && accuracy >= 0
                && accuracy <= MAX_ACCEPTED_ACCURACY_METERS;
    }

    public boolean isWithinStoreRadius(
            MissionDefinition definition,
            double latitude,
            double longitude
    ) {
        return distanceMeters(
                latitude,
                longitude,
                definition.getTargetLatitude(),
                definition.getTargetLongitude()
        ) <= STORE_RADIUS_METERS;
    }

    public double distanceMeters(
            double firstLatitude,
            double firstLongitude,
            double secondLatitude,
            double secondLongitude
    ) {
        double latitudeDistance = Math.toRadians(
                secondLatitude - firstLatitude
        );
        double longitudeDistance = Math.toRadians(
                secondLongitude - firstLongitude
        );
        double firstLatitudeRadians = Math.toRadians(firstLatitude);
        double secondLatitudeRadians = Math.toRadians(secondLatitude);
        double haversine = Math.sin(latitudeDistance / 2)
                * Math.sin(latitudeDistance / 2)
                + Math.cos(firstLatitudeRadians)
                * Math.cos(secondLatitudeRadians)
                * Math.sin(longitudeDistance / 2)
                * Math.sin(longitudeDistance / 2);

        return 2 * EARTH_RADIUS_METERS * Math.atan2(
                Math.sqrt(haversine),
                Math.sqrt(1 - haversine)
        );
    }
}
