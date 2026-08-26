let naverMapsPromise = null;

export function getNaverMapStyleId() {
  return import.meta.env.VITE_NAVER_MAP_STYLE_ID?.trim() || "";
}

export function loadNaverMaps() {
  if (window.naver?.maps) {
    return Promise.resolve(window.naver.maps);
  }

  if (naverMapsPromise) {
    return naverMapsPromise;
  }

  naverMapsPromise = new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID?.trim();

    if (!clientId) {
      reject(new Error("VITE_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다."));
      return;
    }

    const styleId = getNaverMapStyleId();
    const callbackName = "__nurigoNaverMapsReady";
    const script = document.createElement("script");
    const parameters = new URLSearchParams({
      ncpKeyId: clientId,
      submodules: styleId ? "gl" : "geocoder",
      callback: callbackName,
    });

    window[callbackName] = () => {
      delete window[callbackName];

      if (!window.naver?.maps) {
        reject(new Error("네이버 지도 API 초기화에 실패했습니다."));
        return;
      }

      resolve(window.naver.maps);
    };

    window.navermap_authFailure = () => {
      delete window[callbackName];
      naverMapsPromise = null;
      reject(new Error("네이버 지도 API 인증에 실패했습니다."));
    };

    script.id = "naver-maps-sdk";
    script.async = true;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${parameters}`;
    script.onerror = () => {
      delete window[callbackName];
      naverMapsPromise = null;
      reject(new Error("네이버 지도 API를 불러오지 못했습니다."));
    };

    document.head.appendChild(script);
  });

  return naverMapsPromise;
}
