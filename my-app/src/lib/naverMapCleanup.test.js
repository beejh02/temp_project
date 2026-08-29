import { describe, expect, it, vi } from "vitest";
import {
  safelyDetachNaverMapObject,
  safelyRemoveNaverMapListener,
} from "./naverMapCleanup";

describe("네이버 지도 객체 정리", () => {
  it("SDK가 먼저 깨져도 React 정리 단계에 예외를 전파하지 않는다", () => {
    const overlay = {
      setMap: vi.fn(() => {
        throw new TypeError("SDK unavailable");
      }),
    };
    const eventApi = {
      removeListener: vi.fn(() => {
        throw new TypeError("Event unavailable");
      }),
    };

    expect(() => safelyDetachNaverMapObject(overlay)).not.toThrow();
    expect(() =>
      safelyRemoveNaverMapListener(eventApi, {}),
    ).not.toThrow();
  });
});
