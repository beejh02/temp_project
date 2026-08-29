let naverMapsPromise = null;
let naverMapsFailure = null;
const failureListeners = new Set();

function notifyNaverMapsFailure(error) {
  naverMapsFailure = error;
  failureListeners.forEach((listener) => listener(error));
}

function resetNaverMapsSdk() {
  document.getElementById("naver-maps-sdk")?.remove();
  delete window.__nurigoNaverMapsReady;
  delete window.navermap_authFailure;

  try {
    delete window.naver;
  } catch {
    window.naver = undefined;
  }

  naverMapsPromise = null;
  naverMapsFailure = null;
}

export function getNaverMapStyleId() {
  return import.meta.env.VITE_NAVER_MAP_STYLE_ID?.trim() || "";
}

export function subscribeNaverMapsFailure(listener) {
  failureListeners.add(listener);

  return () => {
    failureListeners.delete(listener);
  };
}

export function loadNaverMaps({ forceReload = false } = {}) {
  if (forceReload) {
    resetNaverMapsSdk();
  }

  if (window.naver?.maps && !naverMapsFailure) {
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

    const callbackName = "__nurigoNaverMapsReady";
    const script = document.createElement("script");
    const parameters = new URLSearchParams({
      ncpKeyId: clientId,
      // 래스터 지도의 HTTP 타일 대신 HTTPS 기반 GL 지도를 사용한다.
      submodules: "gl,geocoder",
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
      const error = new Error(
        "네이버 지도 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );

      notifyNaverMapsFailure(error);
      reject(error);
    };

    script.id = "naver-maps-sdk";
    script.async = true;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${parameters}`;
    script.onerror = () => {
      delete window[callbackName];
      naverMapsPromise = null;
      const error = new Error(
        "네이버 지도 서버에 연결하지 못했습니다. 네트워크를 확인해주세요.",
      );

      notifyNaverMapsFailure(error);
      reject(error);
    };

    document.head.appendChild(script);
  });

  return naverMapsPromise;
}
