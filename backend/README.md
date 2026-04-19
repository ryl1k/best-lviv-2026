# Revela — Backend

Go REST API for the Revela registry audit platform.

**Production:** `http://ec2-13-48-249-248.eu-north-1.compute.amazonaws.com:8080`  
**Swagger:** `http://ec2-13-48-249-248.eu-north-1.compute.amazonaws.com:8080/swagger/index.html`

---

## Commands

Run from `backend/`:

```bash
make start-deps      # start Postgres 16 + run migrations (docker-compose.deps.yaml)
make start           # run API server (with -race on CGO builds)
make test            # go test ./...
make migrate-up      # apply pending migrations
make migrate-down    # roll back all migrations
make gen-swag        # regenerate docs/ from swagger annotations in router.go
```

```bash
golangci-lint run ./...                          # lint
go test ./internal/usecase/audit/... -run TestR01  # single test
```

---

## Configuration

Copy `.env.example` to `.env`:

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_CONNECTION_URI` | yes | PostgreSQL DSN |
| `JWT_SECRET` | yes | Secret for signing JWT tokens |
| `HTTP_SERVER_PORT` | yes | e.g. `:8080` |
| `JWT_DURATION` | yes | e.g. `6h` |
| `ENVIRONMENT` | yes | `development` or `production` |
| `POSTGRES_MAX_CONNS` | yes | pgxpool max connections |
| `POSTGRES_MIN_CONNS` | yes | pgxpool min connections |
| `POSTGRES_MAX_CONN_LIFETIME` | yes | e.g. `30m` |
| `POSTGRES_MAX_CONN_IDLE_TIME` | yes | e.g. `10m` |
| `OPENAI_API_KEY` | no | Enables `/explain` AI endpoint |
| `ML_SERVICE_URL` | no | Enables ML risk reranking (e.g. `http://ml:8000`) |

---

## Architecture

Layered / hexagonal layout:

```
cmd/api/main.go                   entry point — wires all dependencies
internal/
  cfg/                            env-based config (caarlos0/env)
  entity/                         pure domain types, no framework deps
    task.go                       Task + status enum (PENDING/PROCESSING/COMPLETED/FAILED)
    land_record.go                LandRecord (cadastral num, area, purpose, normative value)
    estate_record.go              EstateRecord (address, area, object type, terminated_at)
    discrepancy.go                Discrepancy + RuleCode + Severity enums
    subscription.go               SubscriptionTier (ONESHOT/BASIC/PRO), UserSubscription
    user.go / error.go / filter.go
  dto/
    httprequest/                  request structs + CustomValidator
    httpresponse/                 ApiResponse[T] envelope, error mapping
  controller/http/
    router.go                     Echo route registration, CORS, Swagger spec
    v1/audit.go                   Upload, GetTask, GetResults, GetSummary, GetPersons,
                                  GetDiscrepancy, UpdateResolutionStatus, ExplainDiscrepancy, Export
    v1/auth.go                    SignUp, Login, GetMe
    v1/subscription.go            List, GetMine, Purchase
    v1/middleware/
      jwt.go                      validates Bearer token, injects UserClaims
      subscription.go             WithSubscription(minTier, resource) — tier + tries check
      pagination.go               injects page/page_size into context
  repo/
    common_contracts.go           repository interfaces
    persistent/                   pgxpool implementations
  usecase/
    audit/
      usecase.go                  Upload (async), GetResults, GetPersons, Export, applyMLMultiplier
      rules.go                    runRules() + R01–R07 + Levenshtein helper
      parser.go                   ParseLandFile/ParseEstateFile — excelize streaming reader
      normalizer.go               normalizeTaxID, normalizeName, normalizeAddress
    auth/usecase.go               SignUp (bcrypt), Login (JWT), GetById
    subscription/usecase.go       List, Purchase, GetUserSubscription
    ml/client.go                  ScoreRecords — builds per-tax-id features, POSTs to ML service
    ai/explainer.go               ExplainDiscrepancy — GPT-4o-mini, Ukrainian legal prompts
migrations/                       numbered SQL migrations (golang-migrate format)
docs/                             generated Swagger JSON (do not edit manually — use make gen-swag)
```

---

## Async upload pipeline

`POST /v1/audits/upload` returns `202` immediately with a `task_id`, then a goroutine runs:

1. **Parse** both xlsx/csv files using excelize streaming reader (`f.Rows()`) — ~130MB peak memory
2. **Normalize** tax IDs (strip + pad to 10/8 digits), owner names (NFC lowercase), addresses (Cyrillic і ↔ Latin i)
3. **Index** records into `map[taxID][]LandRecord` and `map[taxID][]EstateRecord`
4. **Rules** — run R01–R07 independently → `[]Discrepancy`
5. **ML scoring** — build 14 features per tax ID → POST `/score` → rerank multiplier [0.8×–1.2×] applied to rule scores. ML errors are non-fatal; raw rule score used as fallback.
6. **Persist** — pgxpool `SendBatch` inserts land records, estate records, discrepancies
7. Mark task `COMPLETED` (or `FAILED` with error message stored in `tasks.error_message`)

Poll `GET /v1/tasks/:id` to check status (`PENDING` → `PROCESSING` → `COMPLETED`).

---

## Rule engine

All rules live in `internal/usecase/audit/rules.go` and fire independently. Scores accumulate per tax ID.

| Code | Severity | Score | Trigger |
|---|---|---|---|
| R01_TERMINATED_STILL_HAS_LAND | HIGH | +40 | `estate.terminated_at` is set, tax ID still has active land record |
| R02_PURPOSE_MISMATCH | HIGH | +40 | Land purpose starts `01.` (agricultural) + estate has commercial building |
| R03_LAND_WITHOUT_ESTATE | MEDIUM | +25 | Tax ID in land registry but zero estate records |
| R04_INVALID_TAX_ID | LOW | +10 | NULL or wrong-length tax ID (10 digits = individual, 8 = legal entity) |
| R05_DUPLICATE | MEDIUM | +30 | Duplicate cadastral number in land, or duplicate (tax_id+address+area) in estate |
| R06_NAME_MISMATCH | MEDIUM | +25 | Same tax ID → 2+ distinct normalized names with Levenshtein distance > 3 |
| R07_INCOMPLETE | LOW | +5 | Missing AreaHa/AreaM2, address, or owner name |

Risk bands: 0–30 = LOW · 31–60 = MEDIUM · 61+ = HIGH

---

## Database schema

Six tables managed by `golang-migrate`:

```
tasks               id (UUID), status, error_message, land_count, estate_count, discrepancy_count, created_at
land_records        id, task_id, tax_id, owner_name, cadastral_num, area_ha, purpose_text, normative_value, location
estate_records      id, task_id, tax_id, owner_name, address, area_m2, object_type, terminated_at
discrepancies       id, task_id, rule_code, severity, risk_score, tax_id, owner_name, description, details (JSONB), resolution_status
subscriptions       id, tier (ENUM), name, price_uah, max_csv_tries, max_satellite_tries
user_subscriptions  id, user_id, subscription_id, csv_tries_used, satellite_tries_used, starts_at, expires_at
```

Key indexes: `(task_id, tax_id)` on both record tables; `(task_id, severity)` on discrepancies; `(user_id, expires_at)` on user_subscriptions.

**Postgres enum caveat:** `ALTER TYPE ... ADD VALUE` cannot be used in the same transaction as statements that use the new value. Always split such changes into two consecutive migration files.

---

## Subscription tiers

| Tier enum | Name | Price | CSV | Satellite |
|---|---|---|---|---|
| `ONESHOT` | One-Shot | ₴500 one-time | 1 | 0 |
| `BASIC` | Basic | ₴1,700/mo | 5 | 5 |
| `PRO` | Professional | ₴9,999/mo | 100 | 30 |

New users start with no subscription. The `WithSubscription` middleware enforces tier level + remaining tries before upload and satellite endpoints.

---

## Infrastructure

```
docker-compose.deps.yaml    Postgres 16 only (local dev, port 5433)
docker-compose.yaml         Full stack: postgres + migrate + ml + backend
Dockerfile                  Multi-stage production image (Go builder → distroless)
```

**Production:** EC2 t3.small, Ubuntu, path `/app/backend/backend/`. 1GB swap is configured.  
**Deploy:** push to `main` → GitHub Actions CD runs `docker compose up --build -d` over SSH.
