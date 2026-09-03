import { describe, expect, it } from "vitest";
import config from "../../vercel.json";

describe("Vercel configuration", () => {
  it("API 요청을 운영 Render로 전달한 뒤 SPA 경로를 처리한다", () => {
    expect(config.rewrites).toEqual([
      {
        source: "/api/:path*",
        destination:
          "https://temp-project-i5yu.onrender.com/api/:path*",
      },
      {
        source: "/(.*)",
        destination: "/index.html",
      },
    ]);
  });
});
