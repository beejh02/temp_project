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
    vi.useRealTimers();

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

  it("GPS 위치에서 WASD로 이동한 좌표를 미션 판정에 전달한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T12:00:00Z"));
    const map = {
      panTo: vi.fn(),
      setZoom: vi.fn(),
    };
    const onMissionLocation = vi.fn().mockResolvedValue([]);

    render(
      <CurrentLocation map={map} onMissionLocation={onMissionLocation} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "내 위치" }));
    onMissionLocation.mockClear();
    vi.setSystemTime(new Date("2026-09-04T12:00:02Z"));

    fireEvent.keyDown(window, { key: "w" });

    expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(1);
    expect(onMissionLocation).toHaveBeenCalledTimes(1);
    const submitted = onMissionLocation.mock.calls[0][0];

    expect(submitted.latitude).toBeCloseTo(36.32755);
    expect(submitted.longitude).toBeCloseTo(127.4274);
    expect(submitted.accuracy).toBe(5);
    expect(submitted.recordedAt).toBe("2026-09-04T12:00:02.000Z");
    expect(screen.getByText(/테스트 위치: 36\.327550, 127\.427400/))
      .toBeInTheDocument();
  });

  it("위치 권한이 거부되면 이전 좌표 전송을 멈추고 재시도 방법을 알린다", async () => {
    vi.useFakeTimers();
    const map = {
      panTo: vi.fn(),
      setZoom: vi.fn(),
    };
    const onMissionLocation = vi.fn().mockResolvedValue([]);
    let watchCount = 0;

    navigator.geolocation.watchPosition.mockImplementation(
      (onSuccess, onError) => {
        watchCount += 1;

        if (watchCount === 1) {
          onSuccess({
            coords: {
              latitude: 36.3275,
              longitude: 127.4274,
              accuracy: 5,
            },
          });
        } else {
          onError({
            code: 1,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          });
        }

        return watchCount;
      },
    );

    render(
      <CurrentLocation map={map} onMissionLocation={onMissionLocation} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "내 위치" }));
    onMissionLocation.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "내 위치" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "브라우저 설정에서 위치 권한을 허용한 후 다시 시도해주세요.",
    );
    expect(screen.getByRole("button", { name: "내 위치" })).toBeEnabled();

    await vi.advanceTimersByTimeAsync(10000);

    expect(onMissionLocation).not.toHaveBeenCalled();
  });

  it("미션 위치 판정 실패를 오류 알림으로 표시한다", async () => {
    const map = {
      panTo: vi.fn(),
      setZoom: vi.fn(),
    };
    const onMissionLocation = vi
      .fn()
      .mockRejectedValue(new Error("미션 서버에 연결할 수 없습니다."));
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <CurrentLocation map={map} onMissionLocation={onMissionLocation} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "내 위치" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "미션 서버에 연결할 수 없습니다.",
    );
  });
});
