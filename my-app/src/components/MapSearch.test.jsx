import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MapSearch from "./MapSearch";

describe("MapSearch", () => {
  beforeEach(() => {
    window.naver = {
      maps: {
        LatLng: class LatLng {
          constructor(latitude, longitude) {
            this.latitude = latitude;
            this.longitude = longitude;
          }
        },
        Marker: class Marker {
          setMap() {}

          setPosition() {}
        },
      },
    };
  });

  afterEach(() => {
    delete window.naver;
    vi.restoreAllMocks();
  });

  it("접근 가능한 이름이 있는 검색 입력에서 Enter로 좌표를 검색한다", () => {
    const map = {
      getZoom: vi.fn(() => 15),
      panTo: vi.fn(),
      setZoom: vi.fn(),
    };

    render(<MapSearch map={map} />);

    const input = screen.getByRole("textbox", { name: "주소 또는 좌표 검색" });
    fireEvent.change(input, { target: { value: "36.3275, 127.4274" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(map.panTo).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 36.3275, longitude: 127.4274 }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "위도 36.3275, 경도 127.4274",
    );
  });
});
