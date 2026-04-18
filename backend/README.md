# Revela — Backend

Go REST API for the Revela registry audit platform.

## Commands

Run from `backend/`:

```bash
make start-deps      # start Postgres 16 + run migrations (Docker Compose)
make start           # run API server (with -race)
make test            # go test ./...
make migrate-up      # apply pending migrations
make migrate-down    # roll back all migrations
make gen-swag        # regenerate Swagger docs from annotations
```

Lint:
```bash
golangci-lint run ./...
```

Single test:
```bash
go test ./internal/usecase/audit/... -run TestR01
```

## Configuration

Copy `.env.example` to `.env`:

```env
POSTGRES_CONNECTION_URI=postgres://user:pass@localhost:5432/revela?sslmode=disable
JWT_SECRET=change_me
HTTP_SERVER_PORT=8080
OPENAI_API_KEY=          # optional — enables /explain endpoint
```

## Architecture

Hexagonal layout:

```
cmd/api/main.go                  entry point — wires dependencies
internal/
  entity/                        pure domain types (Task, Discrepancy, LandRecord, EstateRecord)
  usecase/
    audit/                       core pipeline: parse → normalize → rules → persist
      rules.go                   R01–R07 rule functions
      parser.go                  xlsx/csv → entity.LandRecord / entity.EstateRecord
      normalizer.go              tax ID, name, address normalization
      usecase.go                 Upload(), GetResults(), GetPersons(), etc.
    auth/                        JWT login/signup
    subscription/                subscription plan management
    ai/                          OpenAI explainer (gpt-4o-mini, Ukrainian)
  repo/
    persistent/                  pgxpool implementations of all repo interfaces
  controller/http/
    v1/                          Echo handlers (audit, auth, subscription)
    v1/middleware/               JWT auth, request logger, pagination
    router.go                    route registration + Swagger spec header
  cfg/                           env-based config struct
  dto/                           request/response DTOs
migrations/                      numbered SQL migrations
docs/                            generated Swagger files (do not edit manually)
```

## Async task pipeline

`POST /v1/audits/upload` returns `202` immediately with a `task_id`, then a goroutine runs:

1. Parse both files (excelize)
2. Normalize tax IDs, names, addresses
3. Build in-memory index by tax ID
4. Run rule engine → `[]Discrepancy`
5. Batch-insert raw records + discrepancies via pgxpool
6. Mark task `COMPLETED` (or `FAILED` with error message)

Poll `GET /v1/tasks/{id}` to check status.

## Database

Four tables: `tasks`, `land_records`, `estate_records`, `discrepancies`.

Key indexes:
- `idx_land_tax_id ON land_records(task_id, tax_id)`
- `idx_estate_tax_id ON estate_records(task_id, tax_id)`
- `idx_estate_term ON estate_records(task_id, terminated_at) WHERE terminated_at IS NOT NULL`
- `idx_disc_task_severity ON discrepancies(task_id, severity)`
