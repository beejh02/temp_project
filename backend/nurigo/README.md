# Nurigo Backend

## Point wallet and demo exchange

미션과 같은 `nurigo_anonymous_session` 쿠키로 지갑을 구분한다. 데이터는 서버 메모리에만
보관하며 서버 재시작 시 초기화한다. 새 지갑은 0 NP이며 실제 미션·도전 보상 수령만
적립한다. 랭킹의 시연용 초기 점수는 지갑 잔액이 아니다.

| API | 응답·동작 |
| --- | --- |
| `GET /api/wallet` | `nickname`, `balance`, `totalEarned`, `totalSpent`, 최신순 `transactions`, `coupons` |
| `GET /api/wallet/benefits` | 혜택 `id`, `title`, `description`, 서버 기준 `cost`, `demo` |
| `POST /api/wallet/exchanges` | `{ "benefitId": "snack", "requestId": "UUID" }`를 받아 `{ "coupon": ..., "wallet": ... }` 반환 |

지갑 조회와 교환 응답은 `Cache-Control: no-store`를 사용한다. 최초 지갑 조회는 세션을
발급할 수 있으므로 프런트에서는 일일 미션 요청으로 쿠키가 준비된 뒤 조회한다.
거래 내역의 `amount`는 적립이면 양수, 사용이면 음수이며 `balanceAfter`는 해당 거래 후
잔액이다. `occurredAt`, 쿠폰 `issuedAt`·`expiresAt`은 서버의 UTC 시각이다.

교환 혜택은 `snack` 10 NP, `market` 20 NP, `character` 30 NP의 시연용 예시다.
포인트 차감·사용 내역·쿠폰 발급은 같은 잠금 안에서 처리한다. 동일 세션에서 같은
`requestId`를 재전송하면 동일 쿠폰과 최신 지갑을 반환하며 추가 차감하지 않는다.
다른 혜택에 이미 사용한 요청 번호와 잔액 부족은 409, 잘못된 혜택·입력은 400이다.
클라이언트가 제출한 가격을 사용하지 않으며 누적 적립과 랭킹 점수는 교환으로 줄지 않는다.

쿠폰은 고유 ID, 혜택 정보, 비용, 발급·만료 시각, `available`/`expired`, `demo: true`를
제공한다. 발급일부터 30일이 지나면 만료로 조회되며 쿠폰 목록에는 남는다.
실제 매장 사용·재고·취소·복원·로그인·영구 저장은 구현 범위에 포함하지 않는다.

DB 없이 지갑·교환 계약과 동시 요청을 검증하려면 `./gradlew test --tests '*Wallet*'`를
실행한다. 전체 테스트는 아래의 독립 PostGIS 설정을 사용한다.

## Runtime HTTP settings

백엔드를 실행하려면 기존 Supabase 연결용 `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD`를 환경변수로 제공한다. 이 문서의 실행 설정은 Supabase 스키마나
데이터를 변경하지 않는다.

```powershell
.\gradlew.bat bootRun
```

| 환경변수 | 로컬 기본값 | 역할 |
| --- | --- | --- |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,https://nurigo.vercel.app` | 브라우저 직접 호출을 허용할 origin 목록 |
| `SESSION_COOKIE_SECURE` | `false` | HTTPS에서만 쿠키를 전송할지 여부 |
| `SESSION_COOKIE_SAME_SITE` | `Lax` | `Lax`, `Strict`, `None` 중 쿠키 SameSite 정책 |
| `PORT` | `8080` | HTTP 서버 포트 |

`CORS_ALLOWED_ORIGINS`는 쉼표로 구분하며 경로나 인증 정보가 붙지 않은
HTTP(S) origin만 허용한다. 자격 증명 요청을 사용하므로 `*`는 사용할 수
없다. 잘못된 origin은 서버 시작 단계에서 거부된다.

로컬 HTTP에서는 `SESSION_COOKIE_SECURE=false`,
`SESSION_COOKIE_SAME_SITE=Lax`를 사용한다. Vercel 프록시와 Render HTTPS
배포에서는 `true`, `Lax`를 사용한다. 브라우저가 Render를 직접 호출하는
경우에만 `true`, `None`을 사용한다. `SameSite=None`과 `Secure=false` 조합은
서버 시작 단계에서 거부된다.

런타임 HTTP 설정만 빠르게 확인하려면 다음 테스트를 실행한다.

```powershell
.\gradlew.bat test --tests '*CorsConfigTest' `
  --tests '*MissionSessionCookieFactoryTest' `
  --tests '*MissionHttpContractTest'
```

## Database roles

- Supabase is the application database. Runtime connections use `DB_URL`,
  `DB_USERNAME`, and `DB_PASSWORD`.
- Flyway is the only schema migration mechanism. Hibernate uses
  `ddl-auto=validate` and must not create or alter tables.
- `V1__init.sql` is immutable. Add schema changes as `V2`, `V3`, and later
  migrations.
- Do not enable `baseline-on-migrate` globally. A database without
  `flyway_schema_history` must be backed up and compared with the migration
  schema before a one-time baseline is considered.

## Isolated PostGIS tests

Start the disposable test database from the repository root:

```powershell
docker compose -f docker-compose.test.yml up -d --wait
```

Run the backend tests:

```powershell
cd backend/nurigo
./gradlew test
```

The test profile connects to `temp_project_test` on port `5434`, applies the
production Flyway migrations, and then loads deterministic market and store
fixtures from `src/test/resources/db/testdata`.

To use another dedicated PostGIS test database, override only the test
variables:

```text
TEST_DB_URL=jdbc:postgresql://localhost:5434/temp_project_test
TEST_DB_USERNAME=temp_test_user
TEST_DB_PASSWORD=temp_test_password
```

Never point `TEST_DB_URL` at Supabase or another database containing persistent
application data.

GitHub Actions는 같은 이름과 자격 증명의 임시 PostGIS 서비스를 만들고 전체
테스트를 실행한다. CI에는 `TEST_DB_*`만 설정하며 운영 `DB_*` 또는 Supabase
비밀값을 전달하지 않는다. 따라서 연결 실패, Flyway 적용 실패, Hibernate
스키마 검증 실패는 배포 전에 테스트 실패로 드러난다.

Stop the disposable database when testing is complete:

```powershell
docker compose -f docker-compose.test.yml down
```
