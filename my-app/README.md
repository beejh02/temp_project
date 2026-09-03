# React + Vite

## API 및 익명 세션 배포 설정

운영 배포에서는 브라우저가 Render를 직접 호출하지 않고 Vercel의
`/api/*` rewrite를 통해 호출한다. 이 구조에서는 익명 세션 쿠키가 Vercel
도메인의 동일 출처 쿠키로 유지된다.

Vercel 프로젝트에는 다음 환경변수를 설정한다. 운영 Render 주소는
`vercel.json`에 `https://temp-project-i5yu.onrender.com`으로 지정되어 있다.

```text
VITE_NAVER_MAP_CLIENT_ID=your_naver_maps_client_id
VITE_NAVER_MAP_STYLE_ID=your_optional_style_id
VITE_API_MODE=proxy
```

프록시를 사용할 때 `VITE_API_BASE_URL`은 설정하지 않는다. 값이 기존 배포
설정에 남아 있어도 `VITE_API_MODE=direct`를 명시하지 않으면 무시된다.
`/api` rewrite는 SPA catch-all보다 먼저 적용되며 API 응답을 캐시하지 않는다.

Render 프로젝트에는 다음 환경변수를 설정한다.

```text
CORS_ALLOWED_ORIGINS=https://nurigo.vercel.app
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=Lax
```

Render를 브라우저에서 직접 호출해야 하는 경우에만 Vercel의
`VITE_API_MODE=direct`와 `VITE_API_BASE_URL`을 함께 설정하고, Render의
`SESSION_COOKIE_SAME_SITE=None`을 사용한다. 직접 호출 모드는 브라우저의
서드파티 쿠키 제한을 받을 수 있으므로 기본 배포 방식으로 사용하지 않는다.

로컬 개발에서는 `.env.example`을 참고해 `VITE_API_TARGET`을 설정한다.
로컬 HTTP에서는 백엔드의 `SESSION_COOKIE_SECURE=false`와
`SESSION_COOKIE_SAME_SITE=Lax` 기본값을 그대로 사용한다.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
