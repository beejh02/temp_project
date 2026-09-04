import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_API_TARGET = "http://localhost:8080";

export function resolveApiTarget(value) {
  const candidate = value?.trim() || DEFAULT_API_TARGET;
  let url;

  try {
    url = new URL(candidate);
  } catch {
    throw new Error(
      "VITE_API_TARGET에는 경로가 없는 HTTP(S) origin을 설정해야 합니다.",
    );
  }

  const hasRootPathOnly = url.pathname === "/";
  const isHttpOrigin = url.protocol === "http:" || url.protocol === "https:";

  if (
    !isHttpOrigin ||
    url.username ||
    url.password ||
    !hasRootPathOnly ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "VITE_API_TARGET에는 경로가 없는 HTTP(S) origin만 설정할 수 있습니다.",
    );
  }

  return url.origin;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react()],

    server: {
      proxy: {
        "/api": {
          target: resolveApiTarget(env.VITE_API_TARGET),
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.js",
    },
  };
});
