const API_MODE_PROXY = "proxy";
const API_MODE_DIRECT = "direct";

export function resolveApiBaseUrl(mode, baseUrl) {
  const normalizedMode = (mode || API_MODE_PROXY).trim().toLowerCase();

  if (normalizedMode === API_MODE_PROXY) {
    return "";
  }

  if (normalizedMode !== API_MODE_DIRECT) {
    throw new Error("VITE_API_MODE는 proxy 또는 direct여야 합니다.");
  }

  if (!baseUrl?.trim()) {
    throw new Error("direct 모드에는 VITE_API_BASE_URL이 필요합니다.");
  }

  const url = new URL(baseUrl.trim());

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("VITE_API_BASE_URL에는 HTTP(S) origin만 사용할 수 있습니다.");
  }

  return url.origin;
}

const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_MODE,
  import.meta.env.VITE_API_BASE_URL,
);

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), {
    ...options,
    credentials: "include",
  });
}
