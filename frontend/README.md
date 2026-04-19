# Revela — Frontend

React SPA for the Revela registry audit platform.

**Live:** https://chillin-revela.vercel.app  
Auto-deploys from `main` via Vercel.

---

## Stack

| | |
|---|---|
| Framework | React 18 + TypeScript (strict, no `any`) |
| Build | Vite |
| Styling | Tailwind CSS + custom CSS variables |
| Components | shadcn/ui |
| Table | TanStack Table |
| Charts | Recharts |
| Map | react-leaflet |
| Animations | framer-motion (150ms max) |
| i18n | react-i18next (7 locales) |
| Notifications | sonner |

---

## Commands

```bash
npm install       # install dependencies
npm run dev       # dev server on :5173
npm run build     # tsc -b && vite build  (fails on any TS error)
npm run lint      # ESLint
```

---

## Pages

| Route | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Marketing landing — hero, stats, how-it-works, CTA |
| `/upload` | `UploadPage` | Two drop-zones (land + estate files), real-time task polling after submit |
| `/tasks/:id` | `DashboardPage` | Stat cards, rule breakdown bar chart, paginated + filterable discrepancy table, CSV export |
| `/tasks/:id/discrepancies/:discId` | `ObjectDetailsPage` | Full discrepancy detail, field-by-field data cards, AI explanation with legal basis |
| `/satellite` | `SatelliteAnalysisPage` | Leaflet map, cadastral polygon overlay, AI structure detection (demo: cadastral `4624884200:05:000:0009`) |
| `/pricing` | `PricingPage` | Live subscription tiers fetched from API |
| `/login` | `LoginPage` | Email + password, stores JWT in localStorage |
| `/register` | `RegisterPage` | Sign up |
| `/profile` | `ProfilePage` | User info + active subscription |
| `/docs` | `DocsPage` | Product documentation |
| `/support` | `SupportPage` | Support contact |

---

## API client (`src/api/`)

```
http-client.ts       fetch wrapper — builds URL with query params, injects Bearer token,
                     unwraps ApiResponse<T> envelope, throws typed ApiError on non-2xx
token-storage.ts     localStorage keys:
                       revela.auth.access_token
                       revela.auth.user
contracts.ts         ApiResponse<T>, ApiMetadata, ApiError class
models.ts            TypeScript types mirroring all backend entity structs
                     (Task, Discrepancy, LandRecord, EstateRecord, Subscription, User, ...)
modules/
  auth.ts            signup(), login(), logout(), getMe()
  audits.ts          uploadFiles(landFile, estateFile)
  tasks.ts           getTask(), getResults(), getSummary(), getPersons(),
                     getDiscrepancy(), getDiscrepancyExplanation(), exportCsv()
  subscriptions.ts   list(), mine(), purchase()
index.ts             re-exports all modules + types
```

All authenticated requests pass `auth: true` — the client reads the token from localStorage automatically.

---

## i18n

7 locales in `src/i18n/locales/`: `uk` (default), `en`, `pl`, `de`, `fr`, `es`, `it`.

`uk.json` is the source of truth. When adding new user-visible strings:
1. Add the key to `uk.json`
2. Add the same key to `en.json` (minimum)
3. Other locales can be filled in later

Language is persisted in `i18next` storage and synced via the Navbar language picker.

---

## Styling

- Tailwind utility classes + custom CSS variables defined in `src/index.css`
  - `--landing-ink`, `--landing-ink-soft`, `--landing-muted` — text hierarchy
  - `--landing-signal` — accent color (amber-orange `oklch(0.62 0.16 45)`)
  - `--landing-surface`, `--landing-paper`, `--landing-border` — backgrounds + borders
- shadcn/ui components in `src/components/ui/` — do not modify directly
- `SIGNAL_COLOR = 'oklch(0.62 0.16 45)'` is hardcoded in UploadPage and PricingPage for dynamic styles

---

## Auth

- JWT stored in `localStorage` under `revela.auth.access_token`
- `Navbar.tsx` re-reads auth state from localStorage on every route change via `window.storage` event
- `LandingHero.tsx` reads `getAccessToken()` to hide the Sign In button when logged in
- On logout: token + user cleared, redirected to `/login`

---

## Environment

```env
VITE_API_BASE_URL=http://ec2-13-48-249-248.eu-north-1.compute.amazonaws.com:8080
```

Set in `src/config/env.ts`. For local dev, create `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8080
```
