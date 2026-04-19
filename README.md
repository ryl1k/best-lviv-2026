# Revela

**Revela** — GovTech SaaS that cross-references Ukraine's Land Registry (ДЗК) and Real Estate Registry (ДРПП) to surface discrepancies for municipal (ОТГ) review.

> *Revela — робить приховане видимим*

**Live:** https://chillin-revela.vercel.app  
**API:** `http://ec2-13-48-249-248.eu-north-1.compute.amazonaws.com:8080`  
**Swagger:** `http://ec2-13-48-249-248.eu-north-1.compute.amazonaws.com:8080/swagger/index.html`

---

## How it works

1. A municipal official uploads two Excel/CSV registry exports (land + real estate)
2. Revela normalizes records by tax ID (ЄДРПОУ/ІПН), runs 7 detection rules, and optionally re-ranks results with an XGBoost ML model
3. A prioritized list of suspicious cases is ready in seconds — ranked by cumulative risk score
4. Officials review, confirm, or dismiss each case; export to CSV for further action
5. AI generates a Ukrainian-language explanation for each discrepancy, citing the applicable law

---

## Rule engine

| Code | Severity | Score | Trigger |
|---|---|---|---|
| R01_TERMINATED_STILL_HAS_LAND | HIGH | +40 | Estate ownership terminated, person still active in land registry |
| R02_PURPOSE_MISMATCH | HIGH | +40 | Agricultural land + commercial building on same individual |
| R03_LAND_WITHOUT_ESTATE | MEDIUM | +25 | Tax ID in land registry with no estate records |
| R04_INVALID_TAX_ID | LOW | +10 | Missing or wrong-length tax ID |
| R05_DUPLICATE | MEDIUM | +30 | Duplicate cadastral number or duplicate estate record |
| R06_NAME_MISMATCH | MEDIUM | +25 | Same tax ID has different owner name spellings (Levenshtein > 3) |
| R07_INCOMPLETE | LOW | +5 | Record missing owner name, area, or address |

Risk bands: 0–30 LOW · 31–60 MEDIUM · 61+ HIGH

After rule scoring an XGBoost model (14 features per tax ID) produces a multiplier [0.8×–1.2×] applied to each owner's cumulative score.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Go 1.23, Echo v5, pgxpool |
| Database | PostgreSQL 16 |
| ML | Python 3.11, XGBoost, FastAPI |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| AI | OpenAI GPT-4o-mini (Ukrainian-language legal explanations) |
| Infra | Docker Compose, EC2 t3.small (eu-north-1), Vercel |

---

## Repository structure

```
backend/          Go REST API
frontend/         React SPA
models/
  risk_classifier.ipynb   XGBoost training notebook
  service/                FastAPI scoring microservice
.github/workflows/
  ci.yml          Lint check on every push
  cd.yml          SSH deploy to EC2 on push to main (backend/** or models/**)
```

---

## Quick start

### Backend

```bash
cp backend/.env.example backend/.env   # fill POSTGRES_CONNECTION_URI, JWT_SECRET
cd backend
make start-deps   # start Postgres 16 + run migrations
make start        # run API on :8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev       # dev server on :5173
```

### Full stack (Docker)

```bash
cd backend
docker compose up --build
```

This starts Postgres, runs migrations, builds + starts the ML service and the Go API.

---

## API overview

All endpoints are prefixed `/v1`. Protected endpoints require `Authorization: Bearer <token>`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/v1/auth/signup` | — | Register |
| POST | `/v1/auth/login` | — | Login → JWT |
| GET | `/v1/auth/me` | JWT | Current user |
| GET | `/v1/subscriptions` | — | List available plans |
| GET | `/v1/subscriptions/me` | JWT | Active subscription |
| POST | `/v1/subscriptions/:id/purchase` | JWT | Purchase a plan |
| POST | `/v1/audits/upload` | JWT+sub | Upload land + estate files → `task_id` |
| GET | `/v1/tasks` | JWT | List tasks |
| GET | `/v1/tasks/:id` | JWT | Task status + stats |
| GET | `/v1/tasks/:id/results` | JWT | Paginated discrepancies (filters: severity, rule_code, status, tax_id, search) |
| GET | `/v1/tasks/:id/results/summary` | JWT | Counts by rule / severity |
| GET | `/v1/tasks/:id/persons` | JWT | Owners ranked by ML-reranked risk score |
| GET | `/v1/tasks/:id/discrepancies/:id` | JWT | Single discrepancy detail |
| PATCH | `/v1/tasks/:id/discrepancies/:id` | JWT | Update resolution status |
| GET | `/v1/tasks/:id/discrepancies/:id/explain` | JWT | AI explanation (Ukrainian + legal basis) |
| GET | `/v1/tasks/:id/export` | JWT | CSV download |

---

## Subscription tiers

| Tier | Price | CSV analyses | Satellite analyses |
|---|---|---|---|
| One-Shot | ₴500 one-time | 1 | 0 |
| Basic | ₴1,700/mo | 5 | 5 |
| Professional | ₴9,999/mo | 100 | 30 |

---

## Environment variables

See `backend/.env.example` for the full list. Minimum required:

| Variable | Description |
|---|---|
| `POSTGRES_CONNECTION_URI` | PostgreSQL DSN |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `HTTP_SERVER_PORT` | API port (default `:8080`) |
| `OPENAI_API_KEY` | Optional — enables `/explain` endpoint |
| `ML_SERVICE_URL` | Optional — enables ML score reranking (default `http://ml:8000`) |
