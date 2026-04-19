# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Revela

GovTech SaaS that ingests two Ukrainian state registries (Land — ДЗК, Real Estate — ДРПП) as Excel/CSV files, cross-references records by tax ID (ЄДРПОУ/ІПН), runs a rule engine to detect discrepancies, and surfaces a prioritized review list for municipal (ОТГ) officials. Decision support only — no registry modification.

**Live deployments:**
- Frontend: https://chillin-revela.vercel.app (Vercel, auto-deploys from `main`)
- Backend API: `http://ec2-13-48-249-248.eu-north-1.compute.amazonaws.com:8080` (EC2 t3.small, eu-north-1)
- Swagger UI: `http://ec2-13-48-249-248.eu-north-1.compute.amazonaws.com:8080/swagger/index.html`

---

## Repository layout

```
backend/          Go API + rule engine
frontend/         React SPA (Vite)
models/
  risk_classifier.ipynb   XGBoost training notebook
  service/                FastAPI scoring microservice
.github/workflows/        CI + CD
```

---

## Backend (Go)

Module: `github.com/ryl1k/best-lviv-2026`. All commands run from `backend/`.

### Commands

```bash
make start-deps      # start Postgres 16 + run migrations (docker-compose.deps.yaml)
make start           # run API server (-race on CGO builds)
make migrate-up      # apply all pending migrations
make migrate-down    # roll back all migrations
make test            # go test ./...
make gen-swag        # regenerate docs/ from swagger annotations in router.go
```

Single test: `go test ./internal/usecase/audit/... -run TestR01`

Lint: `golangci-lint run ./...`

### Environment

Copy `backend/.env.example` → `backend/.env`. Required vars:

| Var | Example |
|---|---|
| `POSTGRES_CONNECTION_URI` | `postgres://postgres:password@localhost:5433/best?sslmode=disable` |
| `JWT_SECRET` | any strong secret |
| `HTTP_SERVER_PORT` | `:8080` |
| `JWT_DURATION` | `6h` |
| `OPENAI_API_KEY` | optional — AI explanations disabled if blank |
| `ML_SERVICE_URL` | `http://localhost:8001` — ML scoring disabled if blank |
| `ENVIRONMENT` | `development` or `production` |

### Internal package structure

```
cmd/api/main.go                     entrypoint — wires deps, starts Echo
internal/
  cfg/                              env config (caarlos0/env)
  entity/                           pure domain types — no framework deps
    discrepancy.go                  Discrepancy, RuleCode, Severity enums
    land_record.go / estate_record.go
    subscription.go                 SubscriptionTier (ONESHOT/BASIC/PRO), UserSubscription
    task.go                         Task with status PENDING/PROCESSING/COMPLETED/FAILED
    user.go / error.go / filter.go
  dto/
    httprequest/                    request structs + CustomValidator (go-playground/validator)
    httpresponse/                   ApiResponse[T] envelope + error mapping
  controller/http/
    router.go                       Echo route registration, CORS, Swagger
    v1/audit.go                     Upload, GetTask, GetResults, GetSummary, Export, GetPersons, ExplainDiscrepancy
    v1/auth.go                      SignUp, Login, GetMe
    v1/subscription.go              List, GetMine, Purchase
    v1/middleware/
      jwt.go                        validates Bearer token, injects UserClaims into context
      subscription.go               WithSubscription(minTier, resource) — checks tier + tries remaining
      pagination.go                 injects page/page_size into context
  repo/
    common_contracts.go             repository interfaces
    persistent/                     pgxpool implementations
      task_postgres.go
      land_record_postgres.go / estate_record_postgres.go
      discrepancy_postgres.go       ListByTaskID supports all filter combos
      subscription_postgres.go      GetByTier, GetActive, IncrementCSVTries, IncrementSatelliteTries
      ml_score_postgres.go
  usecase/
    audit/
      usecase.go                    Upload (async goroutine), GetResults, GetPersons, Export, applyMLMultiplier
      rules.go                      runRules() + R01–R07 implementations + Levenshtein helper
      parser.go                     ParseLandFile / ParseEstateFile — excelize streaming reader
      normalizer.go                 normalizeTaxID, normalizeName, normalizeAddress
    auth/
      usecase.go                    SignUp (bcrypt), Login (JWT issue), GetById
    subscription/
      usecase.go                    List, Purchase, GetUserSubscription, AssignFreeTier (no-op)
    ml/
      client.go                     ScoreRecords — builds per-tax-id features, POSTs to ML service
    ai/
      explainer.go                  ExplainDiscrepancy — GPT-4o-mini, Ukrainian legal prompts
    common_contracts.go             usecase interfaces
```

### Full API surface

```
GET  /health
GET  /swagger/*

POST /v1/auth/signup              { username, email, password }
POST /v1/auth/login               { email, password } → { token }
GET  /v1/auth/me                  [JWT] → User

GET  /v1/subscriptions            → []Subscription (public)
GET  /v1/subscriptions/me         [JWT] → UserSubscription
POST /v1/subscriptions/:id/purchase  [JWT]

POST /v1/audits/upload            [JWT+sub] multipart(land_file, estate_file) → { task_id }
POST /v1/audits/upload/json       [JWT+sub] JSON variant

GET  /v1/tasks                    [JWT] → []Task
GET  /v1/tasks/:id                [JWT] → Task (status, stats)
GET  /v1/tasks/:id/results        [JWT] ?severity=&rule_code=&resolution_status=&tax_id=&search=&page=&page_size=&sort=
GET  /v1/tasks/:id/results/summary [JWT] → counts by rule + severity
GET  /v1/tasks/:id/persons        [JWT] → deduplicated owner list with ML-reranked risk scores
GET  /v1/tasks/:id/discrepancies/:disc_id        [JWT]
PATCH /v1/tasks/:id/discrepancies/:disc_id       [JWT] { resolution_status }
GET  /v1/tasks/:id/discrepancies/:disc_id/explain [JWT] → AI explanation (Ukrainian)
GET  /v1/tasks/:id/export         [JWT] → CSV download
```

### Async upload pipeline

```
POST /v1/audits/upload
  → 202 { task_id }              (task created with status PENDING)
  → goroutine:
      1. stream-parse xlsx/csv with excelize f.Rows() iterator (~130MB peak vs 450MB with GetRows)
      2. normalize: tax ID (strip+pad), name (NFC lowercase), address (Cyrillic і ↔ Latin i)
      3. build map[taxID][]LandRecord + map[taxID][]EstateRecord
      4. run R01–R07 rules → []Discrepancy
      5. ML scoring: build per-tax-id features → POST /score → map[taxID]float64
      6. pgxpool.SendBatch insert land_records + estate_records + discrepancies
      7. task.status = COMPLETED (or FAILED on any error)
```

### Rule engine

All rules are in `internal/usecase/audit/rules.go`. They run independently and scores accumulate per tax_id.

| Code | Severity | Score | Trigger |
|---|---|---|---|
| R01_TERMINATED_STILL_HAS_LAND | HIGH | +40 | estate `terminated_at` set, tax_id still active in land |
| R02_PURPOSE_MISMATCH | HIGH | +40 | land purpose starts `01.` (agri) + estate has commercial building |
| R03_LAND_WITHOUT_ESTATE | MEDIUM | +25 | tax_id in land registry but zero estate records |
| R04_INVALID_TAX_ID | LOW | +10 | NULL or wrong-length tax ID (10 digits for individuals, 8 for legal entities) |
| R05_DUPLICATE | MEDIUM | +30 | duplicate cadastral number in land, or duplicate (tax_id+address+area) in estate |
| R06_NAME_MISMATCH | MEDIUM | +25 | same tax_id has 2+ distinct normalized names with Levenshtein distance > 3 |
| R07_INCOMPLETE | LOW | +5 | missing AreaHa/AreaM2, address, or owner name |

Risk bands: 0–30 = LOW, 31–60 = MEDIUM, 61+ = HIGH.

After rule scoring, the ML multiplier is applied: `applyMLMultiplier(ruleScore, mlScore)` normalizes the ML service output range [0.75, 0.82] → rerank multiplier [0.8×, 1.2×]. ML errors are non-fatal — raw rule score used as fallback.

### Database schema (6 tables)

```sql
tasks               (id UUID PK, status, error_message, land_count, estate_count, discrepancy_count, ...)
land_records        (id, task_id FK, tax_id, owner_name, cadastral_num, area_ha, purpose_text, normative_value, location, ...)
estate_records      (id, task_id FK, tax_id, owner_name, address, area_m2, object_type, terminated_at, ...)
discrepancies       (id, task_id FK, rule_code, severity, risk_score, tax_id, owner_name, description, details JSONB, resolution_status, ...)
subscriptions       (id, tier ENUM, name, price_uah, max_csv_tries, max_satellite_tries, ...)
user_subscriptions  (id, user_id FK, subscription_id FK, csv_tries_used, satellite_tries_used, starts_at, expires_at)
```

Key indexes: `(task_id, tax_id)` on both record tables; `(task_id, severity)` on discrepancies; `(user_id, expires_at)` on user_subscriptions.

### Subscription tiers

| Tier | Price | CSV analyses | Satellite analyses |
|---|---|---|---|
| ONESHOT | ₴500 one-time | 1 | 0 |
| BASIC | ₴1,700/mo | 5 | 5 |
| PRO | ₴9,999/mo | 100 | 30 |

New users start with no subscription. `AssignFreeTier` is a retained no-op (called on signup but does nothing). The `WithSubscription` middleware enforces tier level + remaining tries before upload and satellite endpoints.

### Normalization rules

- **Tax ID**: strip spaces; if 10 digits → individual (ФО); if 8 digits → legal entity (ЮО); else flagged by R04
- **Owner name**: Unicode NFC, lowercase for comparison only, original stored
- **Address**: lowercase, collapse Cyrillic `і` ↔ Latin `i`, trim whitespace

### Coding conventions

- `context.Context` threaded through every call
- Parameterized SQL only — never string concatenation
- Errors wrapped: `fmt.Errorf("context: %w", err)`; user-friendly messages surfaced at HTTP layer via `httpresponse` error mapping
- No global state; all dependencies injected via constructors
- Conventional commits in English

### Infrastructure

```
docker-compose.deps.yaml    Postgres 16 only (local dev, port 5433)
docker-compose.yaml         Full stack: postgres + migrate + ml + backend
backend/Dockerfile          Multi-stage production image
```

**Production server:** EC2 t3.small, Ubuntu, `/app/backend/backend/`. Has 1GB swap configured. Run `docker compose -f docker-compose.yaml up --build -d` to redeploy manually.

**Dirty migration fix (Postgres enum caveat):** `ALTER TYPE ... ADD VALUE` cannot be used in the same transaction as statements that use the new value. Always split into two consecutive migration files.

---

## ML Service (Python)

Lives in `models/service/`. Deployed as a Docker container alongside the backend.

```
models/
  risk_classifier.ipynb    Training notebook — run Kernel → Restart & Run All to retrain
  revela_risk_model.json   Trained XGBoost model (source of truth)
  service/
    main.py                FastAPI app — POST /score, GET /health
    revela_risk_model.json Copy of model loaded at container startup
    Dockerfile             python:3.11-slim, pip install xgboost fastapi uvicorn
```

**14 input features per tax_id** (no rule-derived features — avoids overfitting loop):
`land_parcel_count`, `land_total_area_ha`, `land_mean_area_ha`, `land_max_area_ha`, `land_unique_purposes`, `land_mean_normative_value`, `estate_record_count`, `estate_unique_object_types`, `estate_total_area_m2`, `in_land`, `in_estate`, `in_both`, `tax_id_length`, `is_legal_entity`

Output: probability [0.0–1.0]. Observed range on real data ≈ [0.75, 0.82]. Backend normalizes this to a [0.8×, 1.2×] multiplier on rule scores.

After retraining copy the model: `cp models/revela_risk_model.json models/service/revela_risk_model.json`

---

## Frontend (React)

Stack: React 18 + TypeScript (strict) + Vite + Tailwind CSS + shadcn/ui + react-i18next + framer-motion + Leaflet (satellite map).

Commands (run from `frontend/`):
```bash
npm install
npm run dev      # dev server
npm run build    # tsc -b && vite build (fails on any TS error)
npm run lint
```

### Pages and routes

| Route | File | Notes |
|---|---|---|
| `/` | `LandingPage.tsx` | Marketing landing, hero + stats + how-it-works |
| `/upload` | `UploadPage.tsx` | Two drop zones (land + estate), polls task status after submit |
| `/tasks/:id` | `DashboardPage.tsx` | Stat cards, rule breakdown chart, paginated discrepancy table |
| `/tasks/:id/discrepancies/:discId` | `ObjectDetailsPage.tsx` | Full discrepancy detail + AI explanation |
| `/satellite` | `SatelliteAnalysisPage.tsx` | Leaflet map, restricted to cadastral `4624884200:05:000:0009` for demo |
| `/pricing` | `PricingPage.tsx` | Live subscription tiers from API; purchase shows "unavailable" toast |
| `/login` `/register` | LoginPage / RegisterPage | JWT stored in localStorage |
| `/profile` | `ProfilePage.tsx` | User info |
| `/docs` `/support` | DocsPage / SupportPage | Static |

### API client (`src/api/`)

```
http-client.ts      fetch wrapper — builds URL, sets Auth header, unwraps ApiResponse<T> envelope
token-storage.ts    localStorage keys: revela.auth.access_token, revela.auth.user
contracts.ts        ApiResponse<T>, ApiError class
models.ts           TypeScript types mirroring backend entity structs
modules/
  auth.ts           signup, login, logout, getMe
  audits.ts         uploadFiles (multipart)
  tasks.ts          getTask, getResults, getSummary, getDiscrepancy, getDiscrepancyExplanation, exportCsv, getPersons
  subscriptions.ts  list, mine, purchase
index.ts            re-exports everything
```

All authenticated requests pass `auth: true` — the client reads the token from localStorage automatically.

### i18n

7 locales in `src/i18n/locales/` (uk, en, pl, de, fr, es, it). The `uk.json` file is the source of truth — keep other locales in sync when adding new keys. Default language is Ukrainian.

### Styling conventions

- Tailwind utility classes + custom CSS variables (`--landing-ink`, `--landing-signal`, etc.) defined in `index.css`
- Accent / signal color: `oklch(0.62 0.16 45)` (amber-orange) used as `SIGNAL_COLOR` constant in upload/pricing pages
- shadcn/ui components in `src/components/ui/` — do not modify directly
- No animations over 150ms; desktop-first layouts

### Auth state

`Navbar.tsx` syncs auth state from localStorage on every route change via `window.addEventListener('storage', ...)`. `LandingHero.tsx` reads `getAccessToken()` to hide the Sign In button when logged in.

---

## CI/CD

```
.github/workflows/
  ci.yml          Runs on every push/PR — currently a lint placeholder
  cd.yml          Push to main + paths backend/** or models/** → SSH deploy to EC2
```

**CD steps:** `docker system prune -af --volumes` → `git pull` → `docker compose up --build -d` → `docker image prune -f`

**GitHub secrets required:** `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`

**Vercel:** Frontend auto-deploys on push to `main`. Build command: `npm run build`. Root directory: `frontend`. No environment variables needed (API URL is hardcoded in `src/config/env.ts`).
