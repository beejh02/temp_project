import { useCallback, useEffect, useMemo, useState } from "react";
import {
  safelyDetachNaverMapObject,
  safelyRemoveNaverMapListener,
} from "../lib/naverMapCleanup";
import { getDominantStoreCategory } from "./storeCategories";
import "./StoreLayer.css";
import { apiUrl } from "../utils/api";

const MAP_INTERACTION_EVENTS = ["pointerdown", "mousedown", "touchstart"];
const CATEGORY_MARKER_THRESHOLD = 20;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";

function createSvgIcon(iconId, className) {
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  const use = document.createElementNS(SVG_NAMESPACE, "use");

  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add(className);
  use.setAttribute("href", `/store-icons.svg#${iconId}`);
  use.setAttributeNS(
    XLINK_NAMESPACE,
    "xlink:href",
    `/store-icons.svg#${iconId}`,
  );
  svg.appendChild(use);

  return svg;
}

function stopMapInteractionEvents(element) {
  MAP_INTERACTION_EVENTS.forEach((eventName) => {
    element.addEventListener(eventName, (event) => event.stopPropagation());
  });
}

function createStoreOverlayElement({
  group,
  selected,
  selectedStoreId,
  onToggle,
  onStoreSelect,
}) {
  const dominantCategory = getDominantStoreCategory(group.stores);
  const usesCategoryMarker =
    group.stores.length >= CATEGORY_MARKER_THRESHOLD;
  const root = document.createElement("div");
  const pinButton = document.createElement("button");
  const pin = document.createElement("span");

  root.className = [
    "store-map-overlay",
    usesCategoryMarker ? "is-category-cluster" : "is-point",
    selected ? "is-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");
  root.style.setProperty("--store-marker-color", dominantCategory.color);
  root.style.zIndex = selected ? "2000" : "100";

  pinButton.type = "button";
  pinButton.className = "store-map-overlay__pin-button";
  pinButton.title =
    group.stores.length === 1
      ? group.stores[0].name
      : `주변 점포 ${group.stores.length}개`;
  pinButton.setAttribute("aria-expanded", String(selected));
  pinButton.addEventListener("click", (event) => {
    event.stopPropagation();
    onToggle(group.key);

    if (group.stores.length === 1) {
      onStoreSelect(group.stores[0]);
    }
  });

  pin.className = "store-map-overlay__pin";
  pin.setAttribute("aria-hidden", "true");

  if (usesCategoryMarker) {
    pin.appendChild(
      createSvgIcon(dominantCategory.iconId, "store-map-overlay__pin-icon"),
    );
  }

  pinButton.appendChild(pin);

  if (usesCategoryMarker) {
    const countBadge = document.createElement("span");

    countBadge.className = "store-map-overlay__count";
    countBadge.textContent = String(group.stores.length);
    pinButton.appendChild(countBadge);
  }

  root.appendChild(pinButton);

  if (selected) {
    const details = document.createElement("div");

    details.className = "store-map-overlay__details";
    details.addEventListener("click", (event) => event.stopPropagation());

    if (group.stores.length === 1) {
      const [store] = group.stores;
      const summary = document.createElement("div");
      const name = document.createElement("strong");
      const categoryName = document.createElement("small");

      details.classList.add("is-single");
      summary.className = "store-map-overlay__summary";
      name.textContent = store.name;
      categoryName.textContent = store.majorCategoryName || "기타";
      summary.append(name, categoryName);
      details.appendChild(summary);
      root.appendChild(details);

      stopMapInteractionEvents(root);

      return root;
    }

    const heading = document.createElement("div");
    const storeList = document.createElement("div");

    heading.className = "store-map-overlay__heading";
    heading.textContent = `주변 점포 ${group.stores.length}개`;
    storeList.className = "store-map-overlay__list";

    group.stores.forEach((store) => {
      const storeButton = document.createElement("button");
      const name = document.createElement("strong");
      const categoryName = document.createElement("small");

      storeButton.type = "button";
      storeButton.className = "store-map-overlay__store";

      if (selectedStoreId === store.id) {
        storeButton.classList.add("is-active");
      }

      storeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        onStoreSelect(store);
      });

      name.textContent = store.name;
      categoryName.textContent = store.majorCategoryName || "기타";
      storeButton.append(name, categoryName);
      storeList.appendChild(storeButton);
    });

    details.append(heading, storeList);
    root.appendChild(details);
  }

  stopMapInteractionEvents(root);

  return root;
}

function createStoreOverlay(map, group, element) {
  const position = new window.naver.maps.LatLng(
    group.latitude,
    group.longitude,
  );

  function StoreOverlay() {
    this.position = position;
    this.element = element;
    this.setMap(map);
  }

  StoreOverlay.prototype = Object.create(
    window.naver.maps.OverlayView.prototype,
  );
  StoreOverlay.prototype.constructor = StoreOverlay;

  StoreOverlay.prototype.onAdd = function onAdd() {
    this.getPanes().overlayLayer.appendChild(this.element);
  };

  StoreOverlay.prototype.draw = function draw() {
    if (!this.getMap()) {
      return;
    }

    const pixelPosition = this.getProjection().fromCoordToOffset(this.position);

    this.element.style.left = `${pixelPosition.x}px`;
    this.element.style.top = `${pixelPosition.y}px`;
  };

  StoreOverlay.prototype.onRemove = function onRemove() {
    this.element.remove();
  };

  return new StoreOverlay();
}

function StoreLocationMarker({
  map,
  group,
  selected,
  selectedStoreId,
  onToggle,
  onStoreSelect,
}) {
  useEffect(() => {
    if (!map || !window.naver?.maps) {
      return;
    }

    const element = createStoreOverlayElement({
      group,
      selected,
      selectedStoreId,
      onToggle,
      onStoreSelect,
    });
    const overlay = createStoreOverlay(map, group, element);

    return () => {
      safelyDetachNaverMapObject(overlay);
    };
  }, [map, group, selected, selectedStoreId, onToggle, onStoreSelect]);

  return null;
}

function clusterStores(stores, map, mapRevision) {
  /* mapRevision은 확대/축소 후 화면 좌표 재계산을 유도한다. */
  void mapRevision;

  if (!map || !window.naver?.maps) {
    return [];
  }

  const projection = map.getProjection();

  if (!projection) {
    return [];
  }

  const minimumMarkerDistance = 52;
  const groups = [];

  stores.forEach((store) => {
    const position = new window.naver.maps.LatLng(
      store.latitude,
      store.longitude,
    );
    const pixel = projection.fromCoordToOffset(position);
    const nearbyGroup = groups.find((group) => {
      const horizontalDistance = group.pixelX - pixel.x;
      const verticalDistance = group.pixelY - pixel.y;

      return (
        Math.hypot(horizontalDistance, verticalDistance) < minimumMarkerDistance
      );
    });

    if (!nearbyGroup) {
      groups.push({
        pixelX: pixel.x,
        pixelY: pixel.y,
        latitude: store.latitude,
        longitude: store.longitude,
        stores: [store],
      });
      return;
    }

    const nextCount = nearbyGroup.stores.length + 1;
    nearbyGroup.pixelX =
      (nearbyGroup.pixelX * nearbyGroup.stores.length + pixel.x) / nextCount;
    nearbyGroup.pixelY =
      (nearbyGroup.pixelY * nearbyGroup.stores.length + pixel.y) / nextCount;
    nearbyGroup.latitude =
      (nearbyGroup.latitude * nearbyGroup.stores.length + store.latitude) /
      nextCount;
    nearbyGroup.longitude =
      (nearbyGroup.longitude * nearbyGroup.stores.length + store.longitude) /
      nextCount;
    nearbyGroup.stores.push(store);
  });

  return groups.map((group) => {
    const sortedStores = [...group.stores].sort((left, right) =>
      left.name.localeCompare(right.name, "ko"),
    );

    return {
      key: sortedStores.map((store) => store.id).join(":"),
      latitude: group.latitude,
      longitude: group.longitude,
      stores: sortedStores,
    };
  });
}

function StoreLayer({
  map,
  refreshKey = 0,
  excludedStoreIds = [],
  onStoresLoad,
  onLoadStateChange,
  onStoreSelect,
}) {
  const [stores, setStores] = useState([]);
  const [selectedLocationKey, setSelectedLocationKey] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [mapRevision, setMapRevision] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchStores = async () => {
      onLoadStateChange?.("loading");

      try {
        const response = await fetch(apiUrl("/api/stores/in-markets"), {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`점포 조회 실패: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("점포 조회 응답 형식이 올바르지 않습니다.");
        }

        setStores(data);
        onStoresLoad?.(data);
        onLoadStateChange?.("success");
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Polygon 내부 점포 조회 중 오류:", error);
          onLoadStateChange?.("error");
        }
      }
    };

    fetchStores();

    return () => {
      abortController.abort();
    };
  }, [refreshKey, onStoresLoad, onLoadStateChange]);

  useEffect(() => {
    if (!map || !window.naver?.maps) {
      return;
    }

    const eventApi = window.naver.maps.Event;
    const listener = eventApi.addListener(
      map,
      "zoom_changed",
      () => {
        setMapRevision((revision) => revision + 1);
        setSelectedLocationKey(null);
      },
    );

    return () => {
      safelyRemoveNaverMapListener(eventApi, listener);
    };
  }, [map]);

  const excludedStoreIdSet = useMemo(
    () => new Set(excludedStoreIds.map(String)),
    [excludedStoreIds],
  );
  const visibleStores = useMemo(
    () => stores.filter((store) => !excludedStoreIdSet.has(String(store.id))),
    [stores, excludedStoreIdSet],
  );
  const storeGroups = useMemo(
    () => clusterStores(visibleStores, map, mapRevision),
    [visibleStores, map, mapRevision],
  );

  const handleToggle = useCallback((locationKey) => {
    setSelectedLocationKey((currentKey) =>
      currentKey === locationKey ? null : locationKey,
    );
  }, []);

  const handleStoreSelect = useCallback(
    (store) => {
      setSelectedStoreId(store.id);
      onStoreSelect?.(store);
    },
    [onStoreSelect],
  );

  return storeGroups.map((group) => (
    <StoreLocationMarker
      key={group.key}
      map={map}
      group={group}
      selected={selectedLocationKey === group.key}
      selectedStoreId={selectedStoreId}
      onToggle={handleToggle}
      onStoreSelect={handleStoreSelect}
    />
  ));
}

export default StoreLayer;
