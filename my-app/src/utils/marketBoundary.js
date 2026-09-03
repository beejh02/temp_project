export function toEditableBoundary(boundary) {
  const ring = boundary?.coordinates?.[0];

  if (!Array.isArray(ring)) {
    return [];
  }

  const coordinates = ring.map(([lng, lat]) => ({ lat, lng }));
  const first = coordinates[0];
  const last = coordinates.at(-1);

  if (
    coordinates.length > 1
    && first.lat === last.lat
    && first.lng === last.lng
  ) {
    return coordinates.slice(0, -1);
  }

  return coordinates;
}
