import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch, apiUrl } from "./api";

describe("API utility", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("API 기본 주소와 요청 경로를 결합한다", () => {
    expect(apiUrl("/api/markets")).toBe("/api/markets");
  });

  it("변환된 주소를 fetch에 전달한다", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const options = { method: "POST" };

    await apiFetch("/api/missions/location", options);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/missions/location",
      options,
    );
  });
});
