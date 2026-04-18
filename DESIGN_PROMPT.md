# Design Prompt - Revela Frontend Mockups

> Single prompt for generating the complete Revela frontend. Feed this to v0.dev, Lovable, Bolt, Claude Artifacts, or any React+Tailwind+shadcn generator. It produces a fully designed app in a consistent "editorial Nordic GovTech" visual language.

---

## How to use this prompt

Copy everything between the `--- PROMPT START ---` and `--- PROMPT END ---` markers into your tool of choice. For best results with v0.dev, submit it as a single message - do not split.

If the tool hits length limits, generate in this order: (1) shared design tokens + layout shell, (2) Landing page, (3) Upload + Dashboard, (4) Object Details + Satellite. Paste the design tokens section at the top of each follow-up.

---

--- PROMPT START ---

# Build: Revela - a GovTech SaaS frontend for Ukrainian municipalities

I need you to design and build a complete React + TypeScript + Tailwind + Framer Motion frontend for a product called **Revela**. Revela is a GovTech SaaS that compares two Ukrainian state registries (Land Registry and Real Estate Registry), reveals discrepancies that cost municipalities tax revenue, and uses satellite imagery to detect unregistered structures on land parcels. The user is a civil servant in a Ukrainian ОТГ (united territorial community) land management department.

The product must look like a premium editorial publication crossed with a serious analytical tool - think architecture portfolio meets Linear dashboard. Not a government portal from 2010. Every screen must communicate trust, precision, and calm authority. All UI copy is in Ukrainian. Use hyphens, never em dashes.

## Visual language - editorial Nordic with warm accent

This is non-negotiable. Match it exactly.

### Color palette (OKLCH-based)

The design uses a warm paper-based palette, not cold SaaS grays. All colors defined via OKLCH for perceptual uniformity.

```css
.landing-page {
  /* Core palette */
  --landing-paper: oklch(0.985 0.005 80);        /* warm off-white background */
  --landing-ink: oklch(0.14 0.015 250);           /* near-black text */
  --landing-ink-soft: oklch(0.32 0.015 250);      /* secondary text */
  --landing-surface: oklch(0.965 0.006 80);       /* card backgrounds */
  --landing-surface-elevated: oklch(1 0 0);       /* elevated cards (pure white) */
  --landing-border: oklch(0.9 0.008 80);          /* subtle borders */
  --landing-border-strong: oklch(0.82 0.01 80);   /* stronger borders */
  --landing-signal: oklch(0.62 0.16 45);          /* warm amber accent - logo dot, avatar, brand highlight */
  --landing-success: oklch(0.55 0.13 155);        /* green confirmations */
  --landing-secondary: oklch(0.94 0.008 80);      /* secondary backgrounds */
  --landing-muted: oklch(0.5 0.012 250);          /* muted text, labels */

  /* Shadows (OKLCH-based, not rgba black) */
  --landing-shadow-md: 0 4px 16px -4px oklch(0.18 0.015 250 / 8%);
  --landing-shadow-lg: 0 24px 48px -16px oklch(0.18 0.015 250 / 12%);
  --landing-shadow-xl: 0 40px 80px -24px oklch(0.18 0.015 250 / 16%);

  /* Easing */
  --landing-ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

For functional UI (severity badges, CTAs, status indicators), use the GovTech accent tokens:
```css
:root {
  --accent: #0050B5;           /* Ukrainian navy - primary CTA, links, focus rings */
  --accent-hover: #003D8A;
  --accent-subtle: #E6EEF8;
  --danger: #DC2626;    --danger-subtle: #FEE2E2;
  --warning: #F59E0B;   --warning-subtle: #FEF3C7;
  --success: #16A34A;   --success-subtle: #DCFCE7;
  --info: #0284C7;      --info-subtle: #E0F2FE;
}
```

### Typography

Four font families, each with a specific role:

| Role | Font | Weight | Usage |
|---|---|---|---|
| **Display / wordmark** | Instrument Serif | 400, 400-italic | Logo "Revela" text, section display headers |
| **Headings + hero** | Inter | 600 (semibold) | Hero title (14vw/8.2rem, tracking -0.035em), page titles, card headers |
| **Body + UI** | Inter | 400, 500 | Navigation links, body text (14px, 1.5 lh), button labels |
| **Mono labels** | JetBrains Mono | 400-500 | Uppercase tracking (10-12px, 0.16-0.18em), tax IDs, cadastral numbers, status tags |

Key typography rules:
- Hero title uses Inter semibold (NOT Instrument Serif) for readability at large sizes
- Instrument Serif reserved for wordmark and editorial accents only
- Mono labels always uppercase with wide tracking
- Numbers in tables always in JetBrains Mono

### Spacing, geometry, textures

- **Max content width**: 1400px, centered, `px-6 md:px-10`
- **Border radius**: 2xl (16px) for large cards, lg (8px) for small cards, full for chips/avatars
- **Borders**: 1px solid `--landing-border`, never shadows-instead-of-borders
- **Shadows**: minimal, OKLCH-based (see shadow tokens above), never rgba black
- **Paper grain**: `radial-gradient(oklch(0.18 0.015 250 / 4%) 1px, transparent 1px)` at 24px grid — use on hero sections
- **Rule grid**: vertical + horizontal lines at 56px intervals — use for background sections

### Interactive states and animations

- **Header entrance**: Framer Motion `initial={{ y: -20, opacity: 0 }}` → `animate={{ y: 0, opacity: 1 }}`, 700ms, expo ease `[0.16, 1, 0.3, 1]`
- **Scroll-aware header**: backdrop blur + border appears after 12px scroll, background transitions to `oklch(0.985 0.005 80 / 80%)`
- **Link underline**: CSS `background-image` trick, `background-size: 0% 1px → 100% 1px` on hover, 400ms expo ease
- **Signal dot pulse**: opacity 1 → 0.4 → 1, 2.4s ease-in-out infinite
- **Hero parallax**: `useScroll` + `useTransform` for title Y offset (0 → 80px) and opacity fade (1 → 0)
- **Section entrances**: Framer Motion `y: 20-40 → 0`, `opacity: 0 → 1`, staggered delays
- **Interactive state transitions**: 150ms max, ease-out. No bounces, no springs.
- **Hover on interactive elements**: `oklch(0 0 0 / 4%)` background, not gray variables

### Iconography

Use Lucide React. Icon sizes: 14-16px inline, 18-20px in buttons, 24px in headers. Stroke width 1.5. Never use emoji in production UI.

## Unified Header (all pages share this)

Single `Navbar` component, `fixed` position, `h-16` (64px), `z-50`. Same component on landing and app pages.

**Structure**:
```
[Signal dot + "Revela" wordmark + subtitle] .... [Nav links] .... [Language + Profile]
```

**Left group**:
- Signal dot: 6px warm amber circle (`--landing-signal`) with 4px glow ring (`oklch(0.62 0.16 45 / 12%)`)
- "Revela" in Instrument Serif, `text-3xl`, `text-landing-ink`
- "/ Cross-Registry Audit" in JetBrains Mono, 10px, uppercase, wide tracking, `text-landing-muted`

**Center nav** (gap-9):
- Links: Головна (`/`), Новий аналіз (`/upload`), Супутник (`/satellite`), Pricing (`/pricing`)
- Style: Inter 500, 14px, `landing-link-underline` animated underline
- Active: `text-landing-ink`, inactive: `text-landing-ink-soft hover:text-landing-ink`

**Right group** (gap-3):
- Language selector: Globe icon + current language code (UK/EN), dropdown with flag + language name, `oklch(0 0 0 / 4%)` hover bg
- Profile avatar: 30px circle with `--landing-signal` background, white initials, ChevronDown. Dropdown: user info, navigation shortcuts (Головна, Профіль, Налаштування), logout in danger color

**Scroll behavior**: transparent bg → `oklch(0.985 0.005 80 / 80%)` with `backdrop-blur-xl` after 12px scroll. Border transitions from transparent to `--landing-border`.

## Layout wrapper

All app pages (non-landing) wrapped in `Layout` component:
```
<div class="landing-page relative min-h-screen flex flex-col overflow-x-hidden bg-landing-paper text-landing-ink">
  <Navbar />
  <main class="flex-1 w-full pt-16">{children}</main>
  <Footer />
</div>
```

Landing page (`/`) has its own wrapper with same classes but no `pt-16` (hero goes under header).

## Page 1 - Landing / Home (/)

**Purpose**: first impression. Communicate what Revela does, build trust, drive to signup.

**Sections** (full-width, stacked):

1. **Hero** (`pt-32 md:pt-40`):
   - Top bar: mono 11px status line "Now auditing · 21,656 records · 14 communities" with pulsing signal dot
   - Main title: Inter semibold, massive (14vw mobile / 8.2rem desktop), tight tracking (-0.035em):
     Line 1: "Two registries."
     Line 2: "*One* source of truth." (One in italic, softer color)
   - Staggered entrance: each line delays 150ms
   - Parallax: title moves up 80px and fades as you scroll
   - Description: 18-20px, `text-landing-ink-soft`, max-width ~5 cols
   - Two CTA buttons: primary (filled dark "See how it works" with ↓) + secondary (outline "Explore the interface")
   - Below hero: animated registry merge scene showing data flowing between two registry cards

2. **How it works**: step-by-step process visualization with scroll-linked animation

3. **Capabilities**: feature grid showing registry audit + satellite analysis capabilities

4. **Social proof / evidence**: statistics and trust signals

5. **Interface preview**: screenshots/mockups of the dashboard

6. **CTA**: final call to action with signup prompt

7. **Footer facts**: mono uppercase grid showing Approach, Method, For, Status

## Page 2 - Upload (/upload)

Single screen, centered `max-w-960`, two file drop zones side by side (land + estate), "Запустити аналіз" button. After upload: poll task status with animated progress text.

## Page 3 - Dashboard (/tasks/:id)

**Stats row** (4 cards): records processed, owners matched, discrepancies found, estimated losses. Numbers in JetBrains Mono.

**Rule breakdown**: horizontal bar chart (Recharts), bars colored by severity.

**Discrepancies table**: TanStack Table with left filter rail (280px), severity/rule/status/search filters. Row click → Object Details.

## Page 4 - Object Details (/tasks/:id/discrepancies/:discId)

Side-by-side land vs estate records comparison. Rule explanation banner. Timeline. Notes section. Status action buttons.

## Page 5 - Satellite Analysis (/satellite)

Map-based interface using Leaflet + OpenStreetMap:
- Full-width interactive map centered on OTG territory
- Cadastral parcel polygon overlays, color-coded by detection status
- Detected structures highlighted with confidence percentage badges
- Side panel: property info (owner, tax ID, cadastral number, land purpose, area)
- Detected vs registered structures comparison
- Filter controls: confidence threshold, registration status, parcel type

## Page 6 - Pricing (/pricing)

Three-tier grid (max-w-4xl, centered):
- **Pilot** (free): 5,000 records, 1 user, registry cross-check, CSV export
- **Standard** (₴4,900/mo, featured with border-2): 50,000 records, 5 users, satellite analysis, priority support
- **Enterprise** (custom): unlimited everything, API access, on-premise option

Use landing design tokens. Cards with `rounded-2xl border border-landing-border`. Mono uppercase for tier names. Instrument Serif for prices.

## Key don'ts

- No gradients. Flat colors only.
- No decorative illustrations or generic "data" stock imagery
- No animations longer than 150ms for interactive states (hero parallax is an exception)
- No emoji in UI copy
- No rounded-full buttons except chips/badges and nav elements
- No em dashes ever. Hyphens only.
- No purple, no teal, no pastels. Stick to the tokens above.
- No rgba shadows. Use OKLCH shadows only.
- No cold grays for backgrounds. Use warm paper tones (oklch with hue 80).

## Realistic demo data (use exactly these values)

When populating the dashboard for screenshots, use these numbers from the actual Sokalsky district dataset:
- Total land records: 21,656
- Total estate records: 20,382
- Unique matched tax IDs: 10,936
- R01 cases (terminated rights, active land): 3,708
- R02 cases (agri land + commercial building): 177
- R03 cases (land without estate): 470
- R04 cases (invalid tax ID): 2,673
- Sample owner name: Грицина Іван Іванович
- Sample tax ID: 3556083731
- Sample cadastral: 4624884200:05:000:0009
- Sample address: вулиця Коваліва, будинок 45, квартира 77
- Sample location: Львівська область, Сокальський район, Острівська сільська рада
- OTG name for nav: Острівська ТГ
- Sample termination date: 07.04.2015
- Sample land registration: 18.01.2024

## Technical requirements

- React 18 + TypeScript (strict)
- Tailwind CSS with OKLCH custom properties (see color palette above)
- Framer Motion for page transitions, header animation, hero parallax
- shadcn/ui components: Button, Card, Input, Table, Checkbox, Badge, Dialog, Sheet, Tooltip, Toast
- TanStack Table for the discrepancy list
- Recharts for the rule-breakdown chart
- Leaflet + react-leaflet for satellite analysis map
- lucide-react for all icons
- i18next for internationalization (Ukrainian default, English available)
- React Router for navigation
- Instrument Serif + Inter + JetBrains Mono (via @fontsource)
- No state management library - useState and URL params are enough for MVP
- All text in Ukrainian (uk-UA), date format DD.MM.YYYY, number format with non-breaking space thousand separator

Deliver all pages with realistic data wired in, navigation working, and visual consistency across screens. Prioritize polish on Landing and Dashboard - those carry the demo.

--- PROMPT END ---

---

## Additional tips

**For v0.dev**: start with "Build the Landing page and Dashboard first" (most visual weight for hackathon demo), then ask it to add Upload, Object Details, Satellite as follow-ups.

**For Claude Artifacts**: paste the whole thing and ask "Build the complete app in one artifact" - works well if the artifact is a single-page React app with all routes.

**For Lovable / Bolt**: the prompt above is already in the right format. These tools handle project-level generation well.

**Iteration tactic**: first pass will get 70% right. Then give surgical follow-ups like "make the hero title use Inter semibold not Instrument Serif" or "add the signal dot pulse animation", rather than regenerating everything.

**Verification checklist after generation**:
- [ ] Wordmark "Revela" in Instrument Serif visible on every page
- [ ] Warm paper background (oklch hue 80), not cold gray
- [ ] Signal dot (warm amber) on logo and avatar
- [ ] Inter for UI text and hero, JetBrains Mono for labels and numbers
- [ ] Animated link underlines in header
- [ ] Language selector with globe icon
- [ ] No em dashes anywhere - only hyphens
- [ ] Demo data matches Sokalsky district numbers
- [ ] Satellite page has working Leaflet map
- [ ] OKLCH shadows, not rgba
- [ ] Backdrop blur header on scroll
