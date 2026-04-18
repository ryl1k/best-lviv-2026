# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Revela

GovTech SaaS that ingests two Ukrainian state registries (Land — ДЗК, Real Estate — ДРПП) as Excel/CSV files, cross-references records by tax ID (ЄДРПОУ/ІПН), runs a rule engine to detect discrepancies, and surfaces a prioritized review list for municipal (ОТГ) officials. Decision support only — no registry modification.

---

## Backend (Go)

All backend code lives in `backend/`. The module is `github.com/ryl1k/best-lviv-2026`.

### Commands (run from `backend/`)

```bash
make start-deps      # start Postgres + run migrations via Docker Compose
make start           # run the API (with -race on non-Windows CGO builds)
make migrate-up      # apply migrations
make migrate-down    # roll back all migrations
make test            # go test ./...
make gen-swag        # regenerate docs/ from swagger annotations in router.go
```

Lint: `golangci-lint run ./...`

Single test: `go test ./internal/usecase/auth/... -run TestName`

### Environment

Copy `backend/.env.example` to `backend/.env`. Key vars: `POSTGRES_CONNECTION_URI`, `JWT_SECRET`, `HTTP_SERVER_PORT`.

### Target folder layout (hexagonal)

```
cmd/api/main.go
internal/
  domain/              # pure business types, no framework deps
    task.go
    land_record.go
    estate_record.go
    discrepancy.go
    rules/             # rule engine
      engine.go        # Rule interface + Engine.Run(records) []Discrepancy
      r01_terminated.go
      r02_purpose_mismatch.go
      r03_land_without_estate.go
      r04_invalid_tax_id.go
      r05_duplicate.go
      r06_name_mismatch.go
      r07_incomplete.go
  app/                 # use cases / application services
    upload_service.go
    task_service.go
    results_service.go
  ports/
    repository.go      # TaskRepo, LandRepo, EstateRepo, DiscrepancyRepo interfaces
    parser.go          # FileParser interface
  adapters/
    http/              # Echo handlers, DTOs, middleware (current controller/ maps here)
    postgres/          # pgxpool implementations of repos
    parser/            # excelize-based xlsx/csv parser
  cfg/
  dto/
  entity/
migrations/
```

The current `internal/` structure (controller/, repo/, usecase/, entity/, dto/) maps to the hexagonal layout above — new algorithm code goes into `domain/`, `app/`, `ports/`, `adapters/`.

### Core pipeline (async task pattern)

```
POST /api/v1/audits/upload (multipart: land_file, estate_file)
  → returns 202 {task_id}
  → goroutine:
      1. stream-parse both xlsx files (excelize)
      2. normalize in memory (tax ID, name, address)
      3. build hashmap index by tax_id (O(1) lookup)
      4. run rule engine → []Discrepancy
      5. pgxpool.SendBatch insert raw rows + discrepancies
      6. update task status: COMPLETED | FAILED

GET /api/v1/tasks/{id}              — status + progress + stats
GET /api/v1/tasks/{id}/results      — paginated discrepancies (filters: severity, rule_code, resolution_status, tax_id, search, page, page_size, sort)
GET /api/v1/tasks/{id}/results/summary  — counts per rule / severity for dashboard
GET /api/v1/tasks/{id}/discrepancies/{disc_id}  — full detail + source records
PATCH /api/v1/tasks/{id}/discrepancies/{disc_id} — update resolution_status
GET /api/v1/tasks/{id}/export?format=csv
```

### Database schema

Four tables: `tasks`, `land_records`, `estate_records`, `discrepancies`. See MASTER_PROMPT.md §4.4 for full DDL. Key indexes:

- `idx_land_tax_id ON land_records(task_id, tax_id)`
- `idx_estate_tax_id ON estate_records(task_id, tax_id)`
- `idx_estate_term ON estate_records(task_id, terminated_at) WHERE terminated_at IS NOT NULL`
- `idx_disc_task_severity ON discrepancies(task_id, severity)`

### Rule engine

Each rule implements a `Rule` interface and outputs `[]Discrepancy`. Rules fire independently; scores are additive per tax_id. The highest-severity rule is the "headline" but all fired rules are stored.

| Code | Severity | Score | Trigger |
|---|---|---|---|
| R01_TERMINATED_STILL_HAS_LAND | HIGH | +40 | estate `terminated_at` set, tax_id still in land |
| R02_PURPOSE_MISMATCH | HIGH | +40 | land purpose starts `01.` (agri) + commercial building in estate |
| R03_LAND_WITHOUT_ESTATE | MEDIUM | +25 | tax_id in land but no estate record |
| R04_INVALID_TAX_ID | LOW | +10 | NULL or wrong-length tax ID (10 for individuals, 8 for legal entities) |
| R05_DUPLICATE | MEDIUM | +30 | same cadastral number twice, or same (tax_id+address+area) in estate |
| R06_NAME_MISMATCH | MEDIUM | +25 | same tax_id → different normalized owner names (Levenshtein > 3) |
| R07_INCOMPLETE | LOW | +5 | missing area, address, or owner name |

Risk bands: 0-30 LOW, 31-60 MEDIUM, 61+ HIGH.

**Every rule must have a unit test on a tiny in-memory dataset. At least one integration test runs the full pipeline on 100 rows.**

### Normalization rules

- Tax ID: strip spaces, zero-pad to 10 digits for individuals / 8 for legal entities
- Owner name: trim, NFC, lowercase for comparison only (store original)
- Address: lowercase + collapse Cyrillic `і` ↔ Latin `i` (pervasive in the dataset), trim

### Coding conventions

- `context.Context` threaded through every call
- Parameterized SQL only — never string concatenation
- Errors wrapped with `fmt.Errorf("context: %w", err)`; user-friendly message surfaced at HTTP layer
- No global state
- Conventional commits (English)

### Infrastructure

- `docker-compose.deps.yaml` — Postgres 16 only (local dev)
- `docker-compose.yaml` — full stack
- `backend/Dockerfile` — production image
- Deploy target: EC2 at `ec2-13-48-249-248.eu-north-1.compute.amazonaws.com`, path `/app/backend`

---

## Frontend (React)

Stack: React 18 + TypeScript (strict, no `any`) + Vite + Tailwind + shadcn/ui + TanStack Table + Recharts.

Three pages:
- `/` — upload screen, two drop zones (land + estate), "Запустити аналіз" button, polls after submit
- `/tasks/{id}` — dashboard: 4 stat cards, rule breakdown bar chart, discrepancies table with filters + export
- `/tasks/{id}/discrepancies/{disc_id}` — side-by-side land/estate record comparison, all fired rules, status actions

UI language: Ukrainian. Hyphens not em dashes. One accent color (blue `#3B82F6` or emerald `#10B981`, pick one). No unnecessary animations (150ms max transitions). Desktop-first.

---

## CI/CD

Workflows in `.github/workflows/`:

- `ci.yml` — runs on every push/PR (placeholder)
- `cd.yml` — SSH deploy to EC2 on push to `main` when `backend/**` changes; secrets: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`
- `release-please.yml` — opens release PRs + creates GitHub releases on push to `main`
