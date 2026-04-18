# Revela — Frontend

React SPA for the Revela registry audit platform.

## Stack

- React 18 + TypeScript (strict)
- Vite
- Tailwind CSS + shadcn/ui
- TanStack Table
- react-leaflet (map)
- react-i18next (Ukrainian UI)

## Commands

```bash
npm install       # install dependencies
npm run dev       # dev server on :5173
npm run build     # production build → dist/
npm run lint      # ESLint
```

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | LandingPage | Marketing landing + pricing |
| `/upload` | UploadPage | Upload land + estate files, start analysis |
| `/tasks/:id` | DashboardPage | Results dashboard: stats, rule breakdown, discrepancies table |
| `/tasks/:id/discrepancies/:disc_id` | ObjectDetailsPage | Side-by-side land/estate record detail |
| `/satellite` | SatelliteAnalysisPage | Leaflet map with cadastral polygons + AI detection |
| `/login` | LoginPage | JWT login |
| `/register` | RegisterPage | Sign up |

## API layer

All backend calls live in `src/api/`:

```
http-client.ts       base fetch wrapper with auth header injection
endpoints.ts         all URL constants
modules/
  audits.ts          uploadFiles(), uploadJson()
  tasks.ts           getTask(), getResults(), getSummary(), getPersons(), export()
  auth.ts            login(), signup(), getMe()
  subscriptions.ts   list(), purchase(), getMine()
models.ts            shared TypeScript types matching backend DTOs
```

## Environment

```env
VITE_API_BASE_URL=https://api.logisync.systems
```
