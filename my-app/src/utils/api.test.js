import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch, apiUrl, resolveApiBaseUrl } from "./api";

describe("API utility", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("API 기본 주소와 요청 경로를 결합한다", () => {
    expect(apiUrl("/api/markets")).toBe("/api/markets");
  });

  it("기본 프록시 모드에서는 설정에 남은 직접 호출 주소를 무시한다", () => {
    expect(resolveApiBaseUrl(
      undefined,
      "https://temp-project-i5yu.onrender.com",
    )).toBe("");
    expect(resolveApiBaseUrl(
      "proxy",
      "https://temp-project-i5yu.onrender.com",
    )).toBe("");
  });

  it("명시적인 직접 호출 모드에서만 API 기본 주소를 사용한다", () => {
    expect(resolveApiBaseUrl(
      "direct",
      "https://temp-project-i5yu.onrender.com/",
    )).toBe("https://temp-project-i5yu.onrender.com");
  });

  it("직접 호출 모드의 잘못된 주소 설정을 거부한다", () => {
    expect(() => resolveApiBaseUrl("direct", "")).toThrow(
      "VITE_API_BASE_URL",
    );
    expect(() => resolveApiBaseUrl("direct", "ftp://example.com")).toThrow(
      "HTTP(S) origin",
    );
    expect(() => resolveApiBaseUrl("unknown", "https://example.com")).toThrow(
      "proxy 또는 direct",
    );
  });

  it("변환된 주소를 fetch에 전달한다", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const options = { method: "POST" };

    await apiFetch("/api/missions/location", options);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/missions/location",
      {
        credentials: "include",
        ...options,
      },
    );
  });
});
