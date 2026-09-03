import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CurrentLocation from "./CurrentLocation";

const { apiFetchMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({
  apiFetch: apiFetchMock,
}));

describe("CurrentLocation", () => {
  let originalGeolocation;

  beforeEach(() => {
    originalGeolocation = Object.getOwnPropertyDescriptor(
      navigator,
      "geolocation",
    );
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        clearWatch: vi.fn(),
        watchPosition: vi.fn((onSuccess) => {
          onSuccess({
            coords: {
              latitude: 36.3275,
              longitude: 127.4274,
              accuracy: 5,
            },
          });
          return 1;
        }),
      },
    });

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
    if (originalGeolocation) {
      Object.defineProperty(navigator, "geolocation", originalGeolocation);
    } else {
      delete navigator.geolocation;
    }

    delete window.naver;
    vi.restoreAllMocks();
  });

  it("공통 API 클라이언트로 현재 위치의 시장을 조회한다", async () => {
    const map = {
      panTo: vi.fn(),
      setZoom: vi.fn(),
    };
    const onMissionLocation = vi.fn().mockResolvedValue([]);

    render(
      <CurrentLocation map={map} onMissionLocation={onMissionLocation} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "내 위치" }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/api/markets/location?latitude=36.3275&longitude=127.4274",
      );
    });
    expect(onMissionLocation).toHaveBeenCalledWith({
      latitude: 36.3275,
      longitude: 127.4274,
      accuracy: 5,
      recordedAt: expect.any(String),
    });
  });
});
