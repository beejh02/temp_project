# Nurigo Backend

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

Stop the disposable database when testing is complete:

```powershell
docker compose -f docker-compose.test.yml down
```
