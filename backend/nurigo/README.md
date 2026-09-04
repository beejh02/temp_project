# Nurigo Backend

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
