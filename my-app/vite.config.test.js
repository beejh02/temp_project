import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { resolveApiTarget } from "./vite.config";

describe("Vite API proxy config", () => {
  it("설정이 없으면 로컬 백엔드 origin을 사용한다", () => {
    expect(resolveApiTarget()).toBe("http://localhost:8080");
    expect(resolveApiTarget(" https://api.example.com/ "))
      .toBe("https://api.example.com");
  });

  it("HTTP origin이 아닌 프록시 대상은 거부한다", () => {
    expect(() => resolveApiTarget("ftp://api.example.com")).toThrow(
      "VITE_API_TARGET",
    );
    expect(() => resolveApiTarget("https://user:pass@api.example.com"))
      .toThrow("VITE_API_TARGET");
    expect(() => resolveApiTarget("https://api.example.com/backend"))
      .toThrow("VITE_API_TARGET");
  });
});

describe("Vercel API proxy config", () => {
  it("API rewrite를 SPA fallback보다 먼저 HTTPS 백엔드로 전달한다", () => {
    const config = JSON.parse(
      readFileSync("vercel.json", "utf8"),
    );
    const [apiRewrite, spaFallback] = config.rewrites;

    expect(apiRewrite.source).toBe("/api/:path*");
    expect(apiRewrite.destination).toMatch(
      /^https:\/\/[^/]+\/api\/:path\*$/,
    );
    expect(spaFallback).toEqual({
      source: "/(.*)",
      destination: "/index.html",
    });
  });
});
