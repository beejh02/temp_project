# Nurigo Frontend

## 로컬 실행

Node.js 환경에서 의존성을 설치하고 개발 서버를 실행한다.

```powershell
npm install
npm run dev
```

프로젝트 루트의 `.env.example`을 `.env`로 복사한 뒤 네이버 지도 Client ID를
설정한다. 로컬 프런트엔드의 `/api/*` 요청은 기본적으로
`http://localhost:8080`으로 전달된다. 다른 백엔드를 사용할 때만
`VITE_API_TARGET`을 변경한다.

`VITE_API_TARGET`과 `VITE_API_BASE_URL`에는 경로나 인증 정보가 붙지 않은
HTTP(S) origin만 사용할 수 있다. 예: `http://localhost:8080`,
`https://api.example.com`.

## API 연결 방식

| 환경 | 모드 | 브라우저 요청 | 설정 |
| --- | --- | --- | --- |
| 로컬 개발 | `proxy` | Vite `/api/*` | `VITE_API_TARGET` |
| Vercel 운영 | `proxy` | Vercel `/api/*` rewrite | `VITE_API_MODE=proxy` |
| 백엔드 직접 호출 | `direct` | Render origin | `VITE_API_MODE=direct`, `VITE_API_BASE_URL` |

운영 기본값은 Vercel 프록시다. `vercel.json`의 API rewrite가 SPA fallback보다
먼저 적용되어 브라우저의 익명 세션 쿠키가 Vercel 동일 출처 쿠키로 유지된다.
직접 호출 모드는 브라우저의 서드파티 쿠키 제한을 받을 수 있으므로 필요한
경우에만 사용한다.

Vercel 환경변수:

```text
VITE_NAVER_MAP_CLIENT_ID=your_naver_maps_client_id
VITE_NAVER_MAP_STYLE_ID=your_optional_style_id
VITE_API_MODE=proxy
```

프록시 모드에서는 `VITE_API_BASE_URL`을 비워 둔다. 남아 있는 값도
`VITE_API_MODE=direct`가 아니면 사용되지 않는다.

Render 환경변수:

```text
CORS_ALLOWED_ORIGINS=https://nurigo.vercel.app
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=Lax
```

Render를 직접 호출할 때는 Vercel에 `VITE_API_MODE=direct`와 HTTPS
`VITE_API_BASE_URL`을 설정하고, Render에는 호출하는 프런트엔드 origin과
`SESSION_COOKIE_SECURE=true`, `SESSION_COOKIE_SAME_SITE=None`을 설정한다.

## 검증

### 위치 미션 시연

1. 사용자 지도의 `위치 시연`을 열고 배정된 미션을 선택한다.
2. `시연 시작`을 누르면 실제 GPS 권한 없이 대상 남쪽에 시연 위치가 표시된다.
3. 점포 미션은 `W`로 접근한다. `W/A/S/D`로 상하좌우 이동하고
   `PageUp`/`PageDown`으로 이동 속도를 조절할 수 있다.
4. 기존 위치 API가 방문을 판정하면 미션 카드에서 완료를 확인하고,
   상세 화면에서 `보상 받기`를 누른다.
5. 보상 결과 아래 `내 포인트·순위 보기`를 누르면 서버가 집계한 누적 포인트와
   내 순위를 확인할 수 있다. 주간·월간 탭으로 집계 기간을 바꾼다.
6. `지도에서 미션 이어가기`로 돌아오면 이전 시연 위치와 이동 속도로 이어갈 수 있다.
   미션 상태가 자동 갱신돼도 사용자가 옮긴 지도 시점은 유지된다.

시연 시작에는 지도와 미션 API 데이터가 필요하다. 시장 미션은 시장 경계도
읽어야 시작할 수 있다. 시작 위치는 서버의 실제 대상 정보에서 계산한다.
`시연 시작`을 다시 눌러도 미션·보상 기록은 초기화하지 않는다.
`내 위치`를 누르면 저장한 시연 위치를 해제하고 실제 GPS 추적으로 전환한다.
시연 위치는 화면 이동 중 메모리에만 보관하며 새로고침하면 초기화된다.
미션·보상 기록은 기존 서버 세션 기준으로 유지된다.
지도 밖에서는 시연 위치를 주기적으로 전송하지 않는다.

### 자동 검사

```powershell
npm test
npm run lint
npm run build
```

설정 테스트는 개발 프록시 대상의 형식, Vercel API rewrite의 HTTPS 주소와
우선순위, 직접 호출 주소와 쿠키 포함 요청을 검증한다.

GitHub에 push하거나 pull request를 만들면 `.github/workflows/ci.yml`이
동일한 테스트·lint·build를 자동으로 실행한다.

## 실행 문제 진단

- 로컬 `/api` 요청이 502라면 백엔드가 실행 중인지와 `VITE_API_TARGET`을 확인한다.
- 브라우저에 CORS 오류가 보이면 직접 호출 모드인지와 Render의
  `CORS_ALLOWED_ORIGINS`에 현재 프런트엔드 origin이 정확히 있는지 확인한다.
- 새로고침 때 미션 상태가 초기화되면 응답의 `Set-Cookie`와 다음 요청의
  `Cookie`를 확인한다. 로컬 HTTP에서는 `SESSION_COOKIE_SECURE=false`여야 한다.
- 설정값이 잘못되면 Vite 또는 Spring 시작 단계에서 오류가 발생한다. 오류에
  표시된 환경변수를 수정한 뒤 다시 실행한다.
