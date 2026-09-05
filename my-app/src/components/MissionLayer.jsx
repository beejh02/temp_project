import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  safelyDetachNaverMapObject,
  safelyRemoveNaverMapListener,
} from "../lib/naverMapCleanup";

import {
  MISSION_CATEGORY_LABEL,
  MISSION_STATUS_LABEL,
  MISSION_TARGET_TYPE,
} from "../data/missionConstants";

import "./MissionLayer.css";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function createMissionIcon() {
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  const circle = document.createElementNS(SVG_NAMESPACE, "circle");
  const path = document.createElementNS(SVG_NAMESPACE, "path");

  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "7.5");
  path.setAttribute("d", "M12 2v4M22 12h-4M12 22v-4M2 12h4");
  svg.append(circle, path);

  return svg;
}

function isFiniteCoordinate(value) {
  return value !== null && value !== "" && Number.isFinite(Number(value));
}

function getMarketCenter(market) {
  const ring = market?.boundary?.coordinates?.[0];

  if (!Array.isArray(ring) || ring.length === 0) {
    return null;
  }

  const validCoordinates = ring.filter(
    ([longitude, latitude]) =>
      isFiniteCoordinate(latitude) && isFiniteCoordinate(longitude),
  );

  if (validCoordinates.length === 0) {
    return null;
  }

  const longitudes = validCoordinates.map(([longitude]) => Number(longitude));
  const latitudes = validCoordinates.map(([, latitude]) => Number(latitude));

  return {
    latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
  };
}

function getMarketRepresentativeLocation(market) {
  const { latitude, longitude } = market?.location ?? {};

  if (!isFiniteCoordinate(latitude) || !isFiniteCoordinate(longitude)) {
    return null;
  }

  return {
    latitude: Number(latitude),
    longitude: Number(longitude),
  };
}

function getFallbackLocation(target) {
  const { latitude, longitude } = target.location ?? {};

  if (!isFiniteCoordinate(latitude) || !isFiniteCoordinate(longitude)) {
    return null;
  }

  return {
    latitude: Number(latitude),
    longitude: Number(longitude),
  };
}

function resolveMissionTarget(mission, stores, markets) {
  const { target } = mission;

  if (target.type === MISSION_TARGET_TYPE.STORE) {
    const store = stores.find(
      ({ id }) => String(id) === String(target.storeId),
    );
    const location =
      store
      && isFiniteCoordinate(store.latitude)
      && isFiniteCoordinate(store.longitude)
        ? {
            latitude: Number(store.latitude),
            longitude: Number(store.longitude),
          }
        : getFallbackLocation(target);

    if (!location) {
      return null;
    }

    return {
      key: `store:${target.storeId}`,
      targetType: MISSION_TARGET_TYPE.STORE,
      targetId: target.storeId,
      name: store?.name || target.name,
      address: store?.roadAddress || target.address,
      categoryName: store?.majorCategoryName || "미션 지정 점포",
      ...location,
    };
  }

  if (target.type === MISSION_TARGET_TYPE.MARKET) {
    const market = markets.find(
      ({ id }) => String(id) === String(target.marketId),
    );
    const location =
      getMarketRepresentativeLocation(market)
      || getFallbackLocation(target)
      || getMarketCenter(market);

    if (!location) {
      return null;
    }

    return {
      key: `market:${target.marketId}`,
      targetType: MISSION_TARGET_TYPE.MARKET,
      targetId: target.marketId,
      name: market?.name || target.name,
      address: target.address,
      categoryName: "시장 공통 미션",
      ...location,
    };
  }

  return null;
}

function resolveMissionLocations(missions, stores, markets) {
  const locations = new Map();

  missions.forEach((mission) => {
    const target = resolveMissionTarget(mission, stores, markets);

    if (!target) {
      return;
    }

    const existingLocation = locations.get(target.key);

    if (existingLocation) {
      existingLocation.missions.push(mission);
      return;
    }

    locations.set(target.key, {
      ...target,
      missions: [mission],
    });
  });

  return [...locations.values()];
}

function createMissionOverlayElement({
  location,
  selected,
  focusedMissionId,
  onToggle,
  onMissionSelect,
}) {
  const root = document.createElement("div");
  const markerButton = document.createElement("button");
  const marker = document.createElement("span");
  const markerLabel = document.createElement("span");

  root.className = `mission-map-overlay${selected ? " is-selected" : ""}`;
  root.style.zIndex = selected ? "3200" : "1500";

  markerButton.type = "button";
  markerButton.className = "mission-map-overlay__marker-button";
  markerButton.title = `${location.name} 미션 ${location.missions.length}개`;
  markerButton.setAttribute("aria-expanded", String(selected));
  markerButton.addEventListener("click", (event) => {
    event.stopPropagation();
    onToggle(location.key);
  });

  marker.className = "mission-map-overlay__marker";
  marker.appendChild(createMissionIcon());
  markerLabel.className = "mission-map-overlay__label";
  markerLabel.textContent = "MISSION";
  markerButton.append(marker, markerLabel);

  if (location.missions.length > 1) {
    const count = document.createElement("span");
    count.className = "mission-map-overlay__count";
    count.textContent = String(location.missions.length);
    markerButton.appendChild(count);
  }

  root.appendChild(markerButton);

  if (selected) {
    const details = document.createElement("section");
    const header = document.createElement("header");
    const eyebrow = document.createElement("span");
    const title = document.createElement("strong");
    const description = document.createElement("small");
    const list = document.createElement("div");

    details.className = "mission-map-overlay__details";
    header.className = "mission-map-overlay__header";
    eyebrow.className = "mission-map-overlay__eyebrow";
    eyebrow.textContent =
      location.targetType === MISSION_TARGET_TYPE.STORE
        ? "STORE MISSION"
        : "MARKET MISSION";
    title.textContent = location.name;
    description.textContent = [location.categoryName, location.address]
      .filter(Boolean)
      .join(" · ");
    header.append(eyebrow, title, description);
    list.className = "mission-map-overlay__list";

    location.missions.forEach((mission) => {
      const missionButton = document.createElement("button");
      const meta = document.createElement("span");
      const category = document.createElement("span");
      const status = document.createElement("span");
      const missionTitle = document.createElement("strong");
      const footer = document.createElement("span");
      const reward = document.createElement("span");
      const action = document.createElement("span");

      missionButton.type = "button";
      missionButton.className = "mission-map-overlay__mission";

      if (String(mission.id) === String(focusedMissionId)) {
        missionButton.classList.add("is-focused");
      }

      missionButton.addEventListener("click", (event) => {
        event.stopPropagation();
        onMissionSelect(mission.id);
      });

      meta.className = "mission-map-overlay__mission-meta";
      category.className = "mission-map-overlay__category";
      category.textContent = MISSION_CATEGORY_LABEL[mission.category];
      status.className = `mission-map-overlay__status is-${mission.status}`;
      status.textContent = MISSION_STATUS_LABEL[mission.status];
      meta.append(category, status);

      missionTitle.textContent = mission.title;
      footer.className = "mission-map-overlay__mission-footer";
      reward.textContent = `+ ${mission.reward.toLocaleString()} NP`;
      action.textContent = "상세보기 →";
      footer.append(reward, action);
      missionButton.append(meta, missionTitle, footer);
      list.appendChild(missionButton);
    });

    details.append(header, list);
    details.addEventListener("click", (event) => event.stopPropagation());
    root.appendChild(details);
  }

  ["pointerdown", "mousedown", "touchstart"].forEach((eventName) => {
    root.addEventListener(eventName, (event) => event.stopPropagation());
  });

  return root;
}

function createMissionOverlay(map, location, element) {
  const position = new window.naver.maps.LatLng(
    location.latitude,
    location.longitude,
  );

  function MissionOverlay() {
    this.position = position;
    this.element = element;
    this.setMap(map);
  }

  MissionOverlay.prototype = Object.create(
    window.naver.maps.OverlayView.prototype,
  );
  MissionOverlay.prototype.constructor = MissionOverlay;

  MissionOverlay.prototype.onAdd = function onAdd() {
    this.getPanes().overlayLayer.appendChild(this.element);
  };

  MissionOverlay.prototype.draw = function draw() {
    if (!this.getMap()) {
      return;
    }

    const pixelPosition = this.getProjection().fromCoordToOffset(this.position);
    const mapHeight = this.getMap().getSize()?.height;

    this.element.style.left = `${pixelPosition.x}px`;
    this.element.style.top = `${pixelPosition.y}px`;

    if (Number.isFinite(mapHeight)) {
      const availableListHeight = Math.max(
        140,
        Math.min(300, mapHeight - pixelPosition.y - 170),
      );

      this.element.style.setProperty(
        "--mission-panel-list-height",
        `${availableListHeight}px`,
      );
    }
  };

  MissionOverlay.prototype.onRemove = function onRemove() {
    this.element.remove();
  };

  return new MissionOverlay();
}

function MissionLocationMarker({
  map,
  location,
  selected,
  focusedMissionId,
  onToggle,
  onMissionSelect,
}) {
  useEffect(() => {
    if (!map || !window.naver?.maps) {
      return;
    }

    const element = createMissionOverlayElement({
      location,
      selected,
      focusedMissionId,
      onToggle,
      onMissionSelect,
    });
    const overlay = createMissionOverlay(map, location, element);

    return () => {
      safelyDetachNaverMapObject(overlay);
    };
  }, [
    map,
    location,
    selected,
    focusedMissionId,
    onToggle,
    onMissionSelect,
  ]);

  return null;
}

function MissionLayer({
  map,
  markets = [],
  stores = [],
  missions = [],
  focusedMissionId,
}) {
  const navigate = useNavigate();
  const [selectedLocationKey, setSelectedLocationKey] = useState(null);
  const missionLocations = useMemo(
    () => resolveMissionLocations(missions, stores, markets),
    [missions, stores, markets],
  );
  const focusedLocation = useMemo(
    () =>
      focusedMissionId == null
        ? null
        : missionLocations.find((location) =>
            location.missions.some(
              ({ id }) => String(id) === String(focusedMissionId),
            ),
          ),
    [missionLocations, focusedMissionId],
  );
  const activeLocationKey =
    selectedLocationKey === null
      ? focusedLocation?.key ?? null
      : selectedLocationKey || null;
  const focusedLatitude = focusedLocation?.latitude;
  const focusedLongitude = focusedLocation?.longitude;

  const handleToggle = useCallback(
    (locationKey) => {
      setSelectedLocationKey(
        activeLocationKey === locationKey ? "" : locationKey,
      );
    },
    [activeLocationKey],
  );
  const handleMissionSelect = useCallback(
    (missionId) => navigate(`/missions/${missionId}`),
    [navigate],
  );

  useEffect(() => {
    if (!map || !window.naver?.maps || focusedMissionId == null) {
      return;
    }

    if (focusedLatitude == null || focusedLongitude == null) {
      return;
    }

    const position = new window.naver.maps.LatLng(
      focusedLatitude,
      focusedLongitude,
    );

    map.panTo(position);

    if (map.getZoom() < 17) {
      map.setZoom(17, true);
    }
  }, [map, focusedLatitude, focusedLongitude, focusedMissionId]);

  useEffect(() => {
    if (!map || !window.naver?.maps) {
      return;
    }

    const eventApi = window.naver.maps.Event;
    const listener = eventApi.addListener(map, "click", () => {
      setSelectedLocationKey(null);
    });

    return () => {
      safelyRemoveNaverMapListener(eventApi, listener);
    };
  }, [map]);

  return missionLocations.map((location) => (
    <MissionLocationMarker
      key={location.key}
      map={map}
      location={location}
      selected={activeLocationKey === location.key}
      focusedMissionId={focusedMissionId}
      onToggle={handleToggle}
      onMissionSelect={handleMissionSelect}
    />
  ));
}

export default MissionLayer;
