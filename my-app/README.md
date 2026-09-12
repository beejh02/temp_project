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
5. 보상 결과 아래 `내 포인트 보기`를 누르면 마이페이지에서 실제 수령한 포인트와
   적립 내역을 확인할 수 있다. 참여 순위는 미션 화면의 랭킹에서 별도로 확인한다.
6. 하단 `지도`로 돌아오면 이전 시연 위치와 이동 속도로 이어갈 수 있다.
   미션 상태가 자동 갱신돼도 사용자가 옮긴 지도 시점은 유지된다.

시연 시작에는 지도와 미션 API 데이터가 필요하다. 시장 미션은 시장 경계도
읽어야 시작할 수 있다. 시작 위치는 서버의 실제 대상 정보에서 계산한다.
`시연 시작`을 다시 눌러도 미션·보상 기록은 초기화하지 않는다.
`내 위치`를 누르면 저장한 시연 위치를 해제하고 실제 GPS 추적으로 전환한다.
시연 위치는 화면 이동 중 메모리에만 보관하며 새로고침하면 초기화된다.
미션·보상 기록은 기존 서버 세션 기준으로 유지된다.
지도 밖에서는 시연 위치를 주기적으로 전송하지 않는다.

사용자 화면에는 테스트 좌표·이동 속도·키보드 조작·시연 복원 안내를 출력하지 않는다.
위의 개발용 조작은 그대로 사용할 수 있다. GPS 정확도 수치 안내는 화면에서 제외하지만
서버의 위치 판정 기준은 유지하며, 위치 권한·연결 실패 안내는 계속 표시한다.

### 포인트 마이페이지·교환 시연

1. 미션 또는 3일 연속 방문 도전의 보상을 수령한다. 지갑은 실제 수령액만 0 NP부터 쌓인다.
2. 하단 `마이`에서 사용 가능 NP와 누적 적립·사용을 확인한다. `전체 보기`에서는
   적립·사용 내역을 나눠 보고 각 거래 후 잔액을 확인할 수 있다.
3. `포인트로 혜택 교환하기`에서 10·20·30 NP 시연 혜택을 확인한다.
   부족한 포인트는 버튼에 표시되며, 잔액이 충분한 혜택만 선택할 수 있다.
4. 교환 확인창에서 비용과 예상 잔액을 검토한 뒤 확정한다. 서버가 차감과 쿠폰 발급을
   완료하면 결과와 남은 포인트를 표시한다. 사용해도 누적 적립액·랭킹 점수는 줄지 않는다.
5. `내 쿠폰`에서 발급된 쿠폰, 시연 보관 기한 30일과 만료 상태를 확인한다.
6. 교환 응답이 끊기면 `같은 요청으로 다시 확인` 또는 재진입 후 `이전 교환 결과 확인`을
   이용한다. 같은 요청 번호는 추가 차감 없이 기존 쿠폰을 반환한다.

교환 목록과 쿠폰은 실제 매장에서 사용할 수 없는 예시다. 실제 할인·물품 수령이나
직원 확인 기능은 없다. 포인트·쿠폰은 현재 익명 세션의 서버 메모리에만 보관되므로
서버 재시작이나 새 익명 세션에서 초기화된다. 로그인을 통한 계정별 보관은 후속 범위다.
브라우저가 탭 저장소를 차단하면 응답 유실 후 재진입 복원은 제공하지 못하지만,
현재 화면을 유지한 상태에서는 같은 요청으로 재시도할 수 있다.

### 관리자 시장 삭제

관리자 화면에서는 미션 대상인 대전중앙시장도 삭제할 수 있다. 삭제 확인 후
해당 시장은 목록에서 제거되고 편집 선택이 해제된다. 해당 시장의 미션은 사용자
화면의 다음 조회 때 제외되며, 이미 받은 포인트와 쿠폰은 유지된다.
대상 시장을 다시 등록하면 서버 재시작 없이 새 시장 ID로 미션을 다시 연결한다.

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
