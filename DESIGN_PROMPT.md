# Design Prompt - Revela Frontend Mockups

> Single prompt for generating the complete Revela frontend. Feed this to v0.dev, Lovable, Bolt, Claude Artifacts, or any React+Tailwind+shadcn generator. It produces three fully designed pages in a consistent "Nordic GovTech" visual language.

---

## How to use this prompt

Copy everything between the `--- PROMPT START ---` and `--- PROMPT END ---` markers into your tool of choice. For best results with v0.dev, submit it as a single message - do not split.

If the tool hits length limits, generate in this order: (1) shared design tokens + layout shell, (2) Upload page, (3) Dashboard, (4) Object Details. Paste the design tokens section at the top of each follow-up.

---

--- PROMPT START ---

# Build: Revela - a GovTech SaaS frontend for Ukrainian municipalities

I need you to design and build a complete React + TypeScript + Tailwind + shadcn/ui frontend for a product called **Revela**. Revela is a GovTech SaaS that compares two Ukrainian state registries (Land Registry and Real Estate Registry) and reveals discrepancies that cost municipalities tax revenue. The user is a civil servant in a Ukrainian ОТГ (united territorial community) land management department.

The product must look like a serious analytical tool - Linear / Vercel / Stripe dashboard tier - not a government portal from 2010. Every screen must communicate trust, precision, and calm authority. All UI copy is in Ukrainian. Use hyphens, never em dashes.

## Visual language - Nordic GovTech with Ukrainian navy accent

This is non-negotiable. Match it exactly.

### Color tokens (use these Tailwind CSS variables)

```css
:root {
  --background: #FAFAFA;
  --surface: #FFFFFF;
  --surface-muted: #F4F4F5;
  --border: #E4E4E7;
  --border-strong: #D4D4D8;
  
  --text-primary: #0A0A0A;
  --text-secondary: #3F3F46;
  --text-muted: #71717A;
  --text-disabled: #A1A1AA;
  
  --accent: #0050B5;           /* Ukrainian navy - primary CTA, links, focus rings */
  --accent-hover: #003D8A;
  --accent-subtle: #E6EEF8;    /* accent backgrounds, selected states */
  
  --success: #16A34A;
  --success-subtle: #DCFCE7;
  --warning: #F59E0B;
  --warning-subtle: #FEF3C7;
  --danger: #DC2626;
  --danger-subtle: #FEE2E2;
  --info: #0284C7;
  --info-subtle: #E0F2FE;
}
```

### Typography

- **UI font**: Inter (weights 400, 500, 600, 700)
- **Monospace**: JetBrains Mono (for tax IDs, cadastral numbers, dates in tables, code)
- **Sizes**:
  - Display: 32-40px / 700 weight / tight tracking (-0.02em)
  - H1: 24px / 600 / -0.01em
  - H2: 18px / 600
  - Body: 14px / 400 / 1.5 line-height
  - Small/caption: 12px / 500 / uppercase for labels and chips

### Spacing and geometry

- Base unit: 4px (Tailwind default). Use spacing-scale strictly (p-2, p-3, p-4, p-6, p-8).
- Border radius: 6px for buttons/inputs, 8px for cards, 4px for chips, 12px for large panels
- Borders: 1px solid, always `--border`. No hairline shadows instead of borders.
- Shadows: minimal. Use `shadow-sm` for cards on hover only. No glows, no colored shadows.

### Interactive states

- Focus: 2px ring with `--accent` color, 2px offset, always visible on keyboard
- Hover on buttons: darken by 10% (use `--accent-hover`)
- Hover on rows: `--surface-muted` background, no transform, no shadow
- Transitions: 150ms ease-out maximum. No bounces, no springs.
- Disabled: opacity 0.5, cursor not-allowed

### Iconography

Use Lucide React. Icon sizes: 16px inline, 20px in buttons, 24px in headers. Stroke width 1.5. Never use emoji in production UI except for severity dots (🟢🟡🔴) which are acceptable.

## Layout shell (all pages share this)

Top navigation bar, 56px tall, sticky, `--surface` background with 1px bottom border:

- Left: wordmark "**Revela**" in Inter 600, 18px, `--text-primary`. Next to it, a 1px vertical divider and text "Аудит активів громади" in 13px `--text-muted`.
- Center: breadcrumbs showing current task context (e.g. "Завдання #a4f2 / Розбіжності")
- Right: OTG selector chip ("Острівська ТГ" with ChevronDown icon), notification bell, user avatar with initials on a `--accent-subtle` background

Main content area: max-width 1440px, centered, padding 32px horizontal / 24px vertical.

Footer: tiny, 40px tall, `--text-muted`, single line: "Revela - робить приховане видимим · v0.1.0 · Документація · Підтримка"

## Page 1 - Upload (/)

**Purpose**: user lands here, drags two Excel files, starts analysis.

**Layout**: centered single-column, max-width 960px.

**Sections top to bottom**:

1. **Hero block** (pt-16, pb-12, centered):
   - Small chip above title: "ХАКАТОН INNOVATE 2026" in 11px uppercase tracking-wide on `--accent-subtle` background
   - H1 display: "Завантажте два реєстри - ми знайдемо що не сходиться"
   - Subtitle, 16px, `--text-secondary`, max-width 640px, centered: "Revela автоматично зіставляє земельний реєстр і реєстр нерухомості, виявляє розбіжності та формує перелік об'єктів для перевірки."

2. **Two drop zones side by side** (grid grid-cols-2 gap-4):
   
   Each drop zone is a card, 280px tall, border 2px dashed `--border-strong`, radius 12px, `--surface` background. On drag-over: border becomes solid `--accent`, background becomes `--accent-subtle`. On file selected: border solid `--success`, show FileText icon, filename, size, and a small X to remove.
   
   Left zone:
   - Icon: FileSpreadsheet, 32px, `--text-muted`
   - Label: "Реєстр нерухомості" (16px, 600)
   - Caption: "ДРПП - файл з власниками будівель"
   - Format hint: ".xlsx, .xls, .csv · до 50 МБ"
   
   Right zone:
   - Icon: Map, 32px, `--text-muted`
   - Label: "Земельний реєстр" (16px, 600)
   - Caption: "ДЗК - файл з кадастровими даними"
   - Format hint: ".xlsx, .xls, .csv · до 50 МБ"

3. **Primary CTA** (below dropzones, centered):
   - Button "Запустити аналіз" - 48px tall, `--accent` background, white text, 14px 600, 6px radius, with ArrowRight icon
   - Disabled state when either file is missing, with helper text below: "Завантажте обидва файли, щоб продовжити"

4. **"How it works" strip** (mt-16): three columns, minimal icons, two lines each:
   - "1. Завантаження" / "Excel або CSV. Обидва реєстри одночасно."
   - "2. Аналіз" / "Нормалізація, зіставлення, 7 правил перевірки."
   - "3. Результат" / "Перелік розбіжностей з пріоритетами для перевірки."
   
   Style: 13px text, icons 20px `--text-muted`, numbers in JetBrains Mono `--accent`.

5. **Trust strip** (small, bottom): "Дані не покидають ваш сервер · Аудит-лог всіх операцій · Сумісно з Trembita"

**When upload starts**: transition to a full-screen overlay with a centered card showing:
- Spinning indicator (not a progress bar - we don't know progress yet)
- Text: "Обробляємо 21,656 записів землі та 20,382 об'єкти нерухомості..."
- Sub-text changes every 3s: "Нормалізація даних..." → "Зіставлення за податковими номерами..." → "Виявлення розбіжностей..." → "Формування звіту..."
- Cancel link at bottom

## Page 2 - Dashboard (/tasks/:id)

**Purpose**: show analysis results. This is where the judge spends most time during demo.

**Layout**: two-column with fixed left rail filters (280px) and scrollable main area.

**Top section - Stats row** (4 cards, grid-cols-4 gap-4):

Each card: `--surface` background, 1px border, 8px radius, p-5.

Card 1 - "Оброблено записів":
- Tiny label (11px uppercase `--text-muted`): "ОБРОБЛЕНО"
- Big number (28px 700 monospace): "42,038"
- Sub-text (12px `--text-muted`): "21,656 землі · 20,382 нерухомості"

Card 2 - "Зіставлено власників":
- Label: "ЗІСТАВЛЕНО ВЛАСНИКІВ"
- Number: "10,936" (monospace)
- Sub-text: "зі 100% покриттям по ЄДРПОУ"
- Tiny success chip: "✓ Високе покриття"

Card 3 - "Знайдено розбіжностей":
- Label: "РОЗБІЖНОСТЕЙ"
- Number: "4,027" (monospace, use `--danger` color for impact)
- Sub-text: "3,708 високої критичності"
- TrendUp icon next to sub-text

Card 4 - "Потенційні втрати":
- Label: "ПОТЕНЦІЙНІ ВТРАТИ"
- Number: "~2.4 млн ₴" (monospace, bold, use `--accent` for gravity)
- Sub-text: "річні податкові надходження"
- Small InfoIcon with tooltip explaining calculation

**Second section - Rule breakdown** (horizontal bar chart, full width, card):

Card title: "Розбіжності за типами"
Chart: horizontal bars using Recharts. Each bar:
- Rule code chip on the left (R01, R02... in monospace `--accent-subtle` background)
- Rule name as bar label
- Bar color reflects severity (red for HIGH, amber for MEDIUM, green-muted for LOW)
- Count on the right, in monospace

Rules to show in order:
- R01 · Припинене право, активний землекористувач — 3,708 — HIGH
- R02 · Невідповідність призначення землі — 177 — HIGH
- R03 · Земля без нерухомості — 470 — MEDIUM
- R04 · Невалідний податковий номер — 2,673 — LOW
- R05 · Дублікати записів — 1 — MEDIUM
- R06 · Розбіжність імен — 16 — MEDIUM
- R07 · Неповний запис — 44 — LOW

**Third section - Discrepancies table** (main work area):

Left filter rail (280px, sticky):

- Section "Критичність": three checkboxes with severity dots (🔴 Висока 3,885 / 🟡 Середня 487 / 🟢 Низька 2,717)
- Section "Тип розбіжності": checkbox list of all 7 rules with counts
- Section "Статус": radio (Всі / Нові / В роботі / Підтверджені / Відхилені)
- Section "Пошук": input with SearchIcon, placeholder "ІПН, ім'я, адреса..."
- "Скинути фільтри" text button at bottom

Main table area:

- Toolbar above table: "Знайдено 4,027 кейсів" on left, two buttons on right: "Експорт CSV" (secondary with Download icon) and "Експорт звіту PDF" (secondary)
- Table: TanStack Table style, 1px borders, zebra-free (we use hover instead), row height 52px

Columns:
1. Checkbox (32px)
2. ID (60px, monospace 12px `--text-muted`, e.g. "#1847")
3. Критичність (100px, severity dot + label chip)
4. Власник (flex-1):
   - Line 1: owner name, 14px 500
   - Line 2: tax ID in JetBrains Mono 12px `--text-muted`, e.g. "3556083731"
5. Правило (160px): rule code chip + short name
6. Опис (flex-2): one-line description, truncated with ellipsis, e.g. "Право припинено 07.04.2015, але активний землекористувач на 2 ділянках"
7. Статус (100px): chip with status color
8. "" (40px): ChevronRight icon, whole row is clickable

Pagination below table: "Показано 1-50 з 4,027" on left, page buttons on right. Standard shadcn pagination.

**Empty/loading states**: skeleton rows with pulsing muted blocks, never spinners in the middle of tables.

## Page 3 - Object Details (/tasks/:id/discrepancies/:discId)

**Purpose**: deep dive into one case. User decides: real problem or false positive.

**Layout**: full width, back button at top.

**Sections**:

1. **Header** (py-6, border-bottom):
   - "< Назад до списку" link with ChevronLeft
   - H1: "Кейс #1847 · Висока критичність" (severity dot inline)
   - Sub-info row: "Власник: Грицина Іван Іванович · ІПН: 3556083731 · 2 ділянки, 1 будівля"
   - Actions on the right: button group "В роботу" (primary) / "Підтвердити проблему" (success outline) / "Відхилити" (ghost)

2. **Rule explanation banner** (red-subtle background, left accent border 3px `--danger`, radius 8px, p-4):
   - Icon: AlertTriangle, 20px, `--danger`
   - Bold line: "R01 · Припинене право власності на нерухомість, але активний землекористувач"
   - Explanation in 13px: "За ДРПП право власності на квартиру припинено 07.04.2015. За ДЗК особа досі числиться землекористувачем двох ділянок, найпізніший запис - 18.01.2024. Вірогідність систематичної помилки або податкового розриву - висока."

3. **Side-by-side comparison** (grid grid-cols-2 gap-4):

Left card: "Земельний реєстр (ДЗК)" header with Map icon
- List of fields, each row: label (12px uppercase `--text-muted`) + value (14px mono for numbers, 14px regular for text)
- Fields: Кадастровий номер, Цільове призначення, Місцерозташування, Площа (га), Нормативна оцінка, Дата реєстрації, Землекористувач
- If owner has multiple plots, show a sub-tabs switcher at top "Ділянка 1 · Ділянка 2"

Right card: "Реєстр нерухомості (ДРПП)" header with Building icon
- Same pattern
- Fields: Тип об'єкта, Адреса, Площа (м²), Дата реєстрації, **Дата припинення права**, Власник, Частка володіння
- The "Дата припинення права" field must be highlighted: `--danger-subtle` background, `--danger` text, AlertCircle icon next to it

When a field conflicts between cards (e.g. name spelled differently), add a yellow dot next to both and a tiny "різниця" badge.

4. **Timeline** (below cards, card, p-6):
   - Title: "Хронологія по власнику"
   - Vertical timeline with dots and connecting lines
   - Events: "14.02.2013 - реєстрація права на квартиру (ДРПП)", "07.04.2015 - припинення права на квартиру", "18.01.2024 - реєстрація права на землю (ДЗК)"
   - Last event marked with pulsing `--danger` dot

5. **Notes section** (bottom, card):
   - Title: "Нотатки посадовця"
   - Textarea, "Опишіть результати перевірки..."
   - Below: list of past notes with timestamp and user initials
   - Save button: "Додати нотатку" (secondary)

6. **Footer bar sticky at bottom of viewport** (only on this page):
   - Left: "Кейс створено 18.04.2026 о 14:32"
   - Right: button group same as header actions
   - This gives the user the status-change shortcut without scrolling back up

## Micro-interactions (all pages)

- Hover over a rule chip anywhere → tooltip with full rule description and formula
- Hover over tax ID anywhere → tooltip "Натисніть щоб скопіювати", click copies to clipboard with toast "ІПН скопійовано"
- Ctrl/Cmd + K → open command palette (шукати кейс за ІПН, власником, ID)
- Severity dots are actual colored circles with a thin `--border` outline, not emojis in production

## Responsive behavior

- Desktop (1280+): layouts as described above
- Tablet (768-1279): filter rail collapses into a Sheet component triggered by "Фільтри" button; stats row becomes 2x2
- Mobile (<768): not primary target, but must not break - stack everything, hide Timeline, keep table scrollable horizontally

## Key don'ts

- No gradients. Flat colors only.
- No decorative illustrations or generic "data" stock imagery
- No animations longer than 150ms. No entrance animations on page load.
- No emoji in UI copy except severity dots
- No rounded-full buttons, no pill-shaped anything except chips/badges
- No purple, no teal, no pastels. Stick to the tokens above.
- No em dashes ever. Hyphens only.

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
- Tailwind CSS with custom theme mapping the tokens above
- shadcn/ui components: Button, Card, Input, Table, Checkbox, Badge, Dialog, Sheet, Tooltip, Toast, Separator, ScrollArea, Tabs, Progress
- TanStack Table for the discrepancy list
- Recharts for the rule-breakdown chart
- lucide-react for all icons
- React Router for navigation (/ → /tasks/:id → /tasks/:id/discrepancies/:discId)
- No state management library - useState and URL params are enough for MVP
- All text in Ukrainian (uk-UA), date format DD.MM.YYYY, number format with non-breaking space thousand separator

Deliver all three pages with realistic data wired in, navigation working, and visual consistency across screens. Prioritize polish on Upload and Dashboard - those carry the demo.

--- PROMPT END ---

---

## Additional tips

**For v0.dev**: start with "Build the Dashboard first" (most visual weight for hackathon demo), then ask it to add Upload, then Object Details as follow-ups.

**For Claude Artifacts**: paste the whole thing and ask "Build the complete app in one artifact" - works well if the artifact is a single-page React app with all three routes.

**For Lovable / Bolt**: the prompt above is already in the right format. These tools handle project-level generation well.

**Iteration tactic**: first pass will get 70% right. Then give surgical follow-ups like "on the Dashboard, make the Stats card for 'Потенційні втрати' more prominent - bigger number, use --accent color", rather than regenerating everything.

**Verification checklist after generation**:
- [ ] Wordmark "Revela" visible on every page
- [ ] Ukrainian navy #0050B5 used consistently for CTAs and accents
- [ ] Inter for UI, JetBrains Mono for tax IDs and cadastral numbers
- [ ] Severity dots are colored circles with borders, not emoji
- [ ] No em dashes anywhere - only hyphens
- [ ] Demo data matches Sokalsky district numbers
- [ ] Table has filter rail on left, not top
- [ ] Object Details page shows termination date highlighted in red
