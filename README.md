# Revela

**Revela** — GovTech SaaS that cross-references Ukraine's Land Registry (ДЗК) and Real Estate Registry (ДРПП) to surface discrepancies for municipal (ОТГ) review.

> *Revela — робить приховане видимим*

---

## What it does

1. Municipal official uploads two Excel/CSV registry exports
2. Revela normalizes records by tax ID (ЄДРПОУ/ІПН), runs a 7-rule engine, and detects anomalies
3. A prioritized list of suspicious cases is ready in seconds — ranked by risk score
4. Officials review, confirm, or dismiss each case; export to CSV for further action

---

## Rule engine

| Code | Severity | Score | Trigger |
|---|---|---|---|
| R01 | HIGH | +40 | Estate ownership terminated, person still active in land registry |
| R02 | HIGH | +40 | Agricultural land + commercial building on same individual |
| R03 | MEDIUM | +25 | Tax ID in land registry with no estate records |
| R04 | LOW | +10 | Missing or wrong-length tax ID |
| R05 | MEDIUM | +30 | Duplicate cadastral number or duplicate estate record |
| R06 | MEDIUM | +25 | Same tax ID has different owner name spellings (Levenshtein > 3) |
| R07 | LOW | +5 | Record missing owner name, area, or address |

Risk bands: 0–30 LOW · 31–60 MEDIUM · 61+ HIGH

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Go 1.25, Echo v5, pgxpool |
| Database | PostgreSQL 16 |
| Frontend | React 18, TypeScript, Vite, Tailwind, shadcn/ui |
| AI | OpenAI gpt-4o-mini (Ukrainian-language explanations) |
| Infra | Docker Compose, EC2 (eu-north-1), Nginx, Certbot |

---

## Project structure

```
backend/     Go API (hexagonal layout)
frontend/    React SPA
migrations/  SQL migrations
```

---

## Quick start

### Backend

```bash
cp backend/.env.example backend/.env   # fill in POSTGRES_CONNECTION_URI, JWT_SECRET
cd backend
make start-deps   # start Postgres + run migrations
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
docker compose up --build
```

---

## API

Swagger UI: `http://localhost:8080/swagger/index.html`

Base URL: `https://api.logisync.systems`

Key endpoints:

| Method | Path | Description |
|---|---|---|
| POST | `/v1/auth/signup` | Register |
| POST | `/v1/auth/login` | Login → JWT |
| POST | `/v1/audits/upload` | Upload land + estate files → task ID |
| GET | `/v1/tasks/{id}` | Task status + stats |
| GET | `/v1/tasks/{id}/results` | Paginated discrepancies (filterable) |
| GET | `/v1/tasks/{id}/results/summary` | Counts by rule / severity |
| PATCH | `/v1/tasks/{id}/discrepancies/{disc_id}` | Update resolution status |
| GET | `/v1/tasks/{id}/discrepancies/{disc_id}/explain` | AI explanation (Ukrainian) |
| GET | `/v1/tasks/{id}/persons` | Owners ranked by cumulative risk score |
| GET | `/v1/tasks/{id}/export` | Download CSV of all discrepancies |

---

## Environment variables

| Variable | Description |
|---|---|
| `POSTGRES_CONNECTION_URI` | PostgreSQL DSN |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `HTTP_SERVER_PORT` | API port (default `8080`) |
| `OPENAI_API_KEY` | Optional — enables AI explanations |
