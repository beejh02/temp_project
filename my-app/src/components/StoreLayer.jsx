import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDominantStoreCategory,
  getStoreCategory,
} from "./storeCategories";
import "./StoreLayer.css";

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

function createStoreOverlayElement({
  group,
  selected,
  selectedStoreId,
  onToggle,
  onStoreSelect,
}) {
  const dominantCategory = getDominantStoreCategory(group.stores);
  const root = document.createElement("div");
  const pinButton = document.createElement("button");
  const pin = document.createElement("span");

  root.className = `store-map-overlay${selected ? " is-selected" : ""}`;
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
  pin.appendChild(
    createSvgIcon(
      dominantCategory.iconId,
      "store-map-overlay__pin-icon",
    ),
  );
  pinButton.appendChild(pin);

  if (group.stores.length > 1) {
    const countBadge = document.createElement("span");
    countBadge.className = "store-map-overlay__count";
    countBadge.textContent = String(group.stores.length);
    pinButton.appendChild(countBadge);
  }

  root.appendChild(pinButton);

  if (selected) {
    const details = document.createElement("div");
    const heading = document.createElement("div");
    const storeList = document.createElement("div");

    details.className = "store-map-overlay__details";
    details.addEventListener("click", (event) => event.stopPropagation());
    heading.className = "store-map-overlay__heading";
    heading.textContent =
      group.stores.length === 1
        ? "점포 정보"
        : `주변 점포 ${group.stores.length}개`;
    storeList.className = "store-map-overlay__list";

    group.stores.forEach((store) => {
      const category = getStoreCategory(store.majorCategoryCode);
      const storeButton = document.createElement("button");
      const iconWrap = document.createElement("span");
      const textWrap = document.createElement("span");
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

      iconWrap.className = "store-map-overlay__store-icon";
      iconWrap.style.color = category.color;
      iconWrap.appendChild(
        createSvgIcon(category.iconId, "store-map-overlay__store-svg"),
      );

      textWrap.className = "store-map-overlay__store-text";
      name.textContent = store.name;
      categoryName.textContent = store.majorCategoryName;
      textWrap.append(name, categoryName);
      storeButton.append(iconWrap, textWrap);
      storeList.appendChild(storeButton);
    });

    details.append(heading, storeList);
    root.appendChild(details);
  }

  ["pointerdown", "mousedown", "touchstart"].forEach((eventName) => {
    root.addEventListener(eventName, (event) => event.stopPropagation());
  });

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

    const pixelPosition = this.getProjection().fromCoordToOffset(
      this.position,
    );

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
      overlay.setMap(null);
    };
  }, [
    map,
    group,
    selected,
    selectedStoreId,
    onToggle,
    onStoreSelect,
  ]);

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
        Math.hypot(horizontalDistance, verticalDistance)
        < minimumMarkerDistance
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
    nearbyGroup.pixelX
      = (nearbyGroup.pixelX * nearbyGroup.stores.length + pixel.x) / nextCount;
    nearbyGroup.pixelY
      = (nearbyGroup.pixelY * nearbyGroup.stores.length + pixel.y) / nextCount;
    nearbyGroup.latitude
      = (
        nearbyGroup.latitude * nearbyGroup.stores.length
        + store.latitude
      ) / nextCount;
    nearbyGroup.longitude
      = (
        nearbyGroup.longitude * nearbyGroup.stores.length
        + store.longitude
      ) / nextCount;
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

function StoreLayer({ map, refreshKey = 0, onStoreSelect }) {
  const [stores, setStores] = useState([]);
  const [selectedLocationKey, setSelectedLocationKey] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [mapRevision, setMapRevision] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchStores = async () => {
      try {
        const response = await fetch("/api/stores/in-markets", {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`점포 조회 실패: ${response.status}`);
        }

        const data = await response.json();
        setStores(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Polygon 내부 점포 조회 중 오류:", error);
        }
      }
    };

    fetchStores();

    return () => {
      abortController.abort();
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!map || !window.naver?.maps) {
      return;
    }

    const listener = window.naver.maps.Event.addListener(
      map,
      "zoom_changed",
      () => {
        setMapRevision((revision) => revision + 1);
        setSelectedLocationKey(null);
      },
    );

    return () => {
      window.naver.maps.Event.removeListener(listener);
    };
  }, [map]);

  const storeGroups = useMemo(
    () => clusterStores(stores, map, mapRevision),
    [stores, map, mapRevision],
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
