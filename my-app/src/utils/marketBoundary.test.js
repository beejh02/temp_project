import { describe, expect, it } from "vitest";

import { toEditableBoundary } from "./marketBoundary";

describe("marketBoundary", () => {
  it("GeoJSON의 닫힘 좌표를 편집 정점에서 제외한다", () => {
    expect(toEditableBoundary({
      coordinates: [[
        [127.43, 36.32],
        [127.44, 36.32],
        [127.44, 36.33],
        [127.43, 36.32],
      ]],
    })).toEqual([
      { lat: 36.32, lng: 127.43 },
      { lat: 36.32, lng: 127.44 },
      { lat: 36.33, lng: 127.44 },
    ]);
  });

  it("좌표가 없으면 빈 편집 영역을 반환한다", () => {
    expect(toEditableBoundary(null)).toEqual([]);
  });
});
