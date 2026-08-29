import { beforeEach, describe, expect, it, vi } from "vitest";

describe("네이버 지도 SDK 로더", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    delete window.naver;
    delete window.__nurigoNaverMapsReady;
    delete window.navermap_authFailure;
    vi.resetModules();
  });

  it("GL 지도와 주소 검색 모듈을 함께 요청한다", async () => {
    const { loadNaverMaps } = await import("./naverMaps");
    const loading = loadNaverMaps();
    const script = document.getElementById("naver-maps-sdk");

    expect(script).not.toBeNull();
    expect(script.src).toContain("submodules=gl%2Cgeocoder");

    window.naver = { maps: { Map: class Map {} } };
    window.__nurigoNaverMapsReady();

    await expect(loading).resolves.toBe(window.naver.maps);
  });

  it("인증 실패를 화면 구독자에게 전달한다", async () => {
    const { loadNaverMaps, subscribeNaverMapsFailure } = await import(
      "./naverMaps"
    );
    const onFailure = vi.fn();
    const unsubscribe = subscribeNaverMapsFailure(onFailure);
    const loading = loadNaverMaps();
    const rejected = expect(loading).rejects.toThrow(
      "네이버 지도 서버에 연결하지 못했습니다.",
    );

    window.navermap_authFailure();

    await rejected;
    expect(onFailure).toHaveBeenCalledOnce();
    unsubscribe();
  });
});
