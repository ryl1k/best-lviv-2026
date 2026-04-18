import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Info,
  Search,
  Upload,
} from 'lucide-react'

import { RULES, STATS, formatNumber, type ResolutionStatus, type Severity } from '@/data/demo'

interface GeneratedRow {
  id: number
  severity: Severity
  ownerName: string
  taxId: string
  ruleCode: string
  ruleName: string
  description: string
  status: ResolutionStatus
}

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const FIRST_NAMES = [
  'Іван', 'Петро', 'Микола', 'Сергій', 'Андрій', 'Василь', 'Олег', 'Ярослав',
  'Оксана', 'Марія', 'Наталія', 'Тетяна', 'Ольга', 'Людмила', 'Ірина', 'Галина',
]
const LAST_NAMES = [
  'Грицина', 'Ковальчук', 'Бондаренко', 'Мельник', 'Шевченко', 'Лисенко',
  'Олійник', 'Ткачук', 'Савченко', 'Павленко', 'Іваненко', 'Коваленко',
  'Бойко', 'Гриценко', 'Руденко', 'Кравченко', 'Мороз', 'Клименко',
]
const PATRONYMICS = [
  'Іванович', 'Петрович', 'Миколайович', 'Васильович', 'Олегович', 'Андрійович',
  'Іванівна', 'Петрівна', 'Василівна', 'Олегівна', 'Андріївна', 'Миколаївна',
]

const RULE_DESCRIPTIONS: Record<string, string[]> = {
  R01: [
    'Право припинено {date}, але активний землекористувач на {n} ділянках',
    'Право власності припинено {date}, ділянка {n} активна у ДЗК',
    'Реєстраційний запис ДРПП закрито {date}, залишається {n} активних ділянок у ДЗК',
  ],
  R02: [
    'Земля 01.01 (с/г), але зареєстровано нежитлову будівлю',
    'Земля 01.03 (фермерське), але зареєстровано торговельну будівлю',
    'Цільове призначення 02.01, але фактичне використання не відповідає',
  ],
  R03: [
    'Є {n} земельних ділянок, але жодного запису в реєстрі нерухомості',
    'Земельна ділянка без пов’язаної нерухомості у ДРПП',
    '{n} ділянок не мають відповідних об’єктів нерухомості',
  ],
  R04: [
    'Податковий номер {n} цифр замість 10',
    'Невалідний ІПН: контрольна цифра не збігається',
    'Податковий номер відсутній у записі нерухомості',
  ],
  R05: [
    'Виявлено дублікат запису з кадастровим номером {cn}',
    'Дублювання запису: {n} однакових кадастрових номерів',
  ],
  R06: [
    'В ДЗК "{short}", в ДРПП повне ім’я з розбіжністю транслітерації',
    'Різночитання ПІБ між реєстрами: можлива латинська літера',
    'Ім’я у двох реєстрах відрізняється на {n} символи',
  ],
  R07: [
    'Відсутня адреса у записі нерухомості',
    'Неповний запис: відсутні координати ділянки',
    'Запис нерухомості без площі об’єкта',
  ],
}

const STATUSES: ResolutionStatus[] = ['NEW', 'NEW', 'NEW', 'IN_REVIEW', 'CONFIRMED', 'DISMISSED']

function generateRows(): GeneratedRow[] {
  const rand = seededRand(42)
  const rows: GeneratedRow[] = []

  rows.push({
    id: 1847,
    severity: 'HIGH',
    ownerName: 'Грицина Іван Іванович',
    taxId: '3556083731',
    ruleCode: 'R01',
    ruleName: 'Припинене право, активний землекористувач',
    description: 'Право припинено 07.04.2015, але активний землекористувач на 2 ділянках',
    status: 'NEW',
  })

  const ruleWeights = [
    { code: 'R01', weight: 3708, severity: 'HIGH' as Severity },
    { code: 'R02', weight: 177, severity: 'HIGH' as Severity },
    { code: 'R03', weight: 470, severity: 'MEDIUM' as Severity },
    { code: 'R04', weight: 2673, severity: 'LOW' as Severity },
    { code: 'R05', weight: 1, severity: 'MEDIUM' as Severity },
    { code: 'R06', weight: 16, severity: 'MEDIUM' as Severity },
    { code: 'R07', weight: 44, severity: 'LOW' as Severity },
  ]
  const totalWeight = ruleWeights.reduce((sum, rule) => sum + rule.weight, 0)

  for (let i = 1; i < 50; i++) {
    const r = rand()
    let acc = 0
    let selectedRule = ruleWeights[0]

    for (const rule of ruleWeights) {
      acc += rule.weight / totalWeight
      if (r <= acc) {
        selectedRule = rule
        break
      }
    }

    const firstName = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]
    const lastName = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]
    const patronymic = PATRONYMICS[Math.floor(rand() * PATRONYMICS.length)]
    const ownerName = `${lastName} ${firstName} ${patronymic}`
    const taxIdRaw = Math.floor(rand() * 9_000_000_000 + 1_000_000_000)
    const taxId = selectedRule.code === 'R04' && rand() < 0.3 ? '' : String(taxIdRaw)

    let description = RULE_DESCRIPTIONS[selectedRule.code][Math.floor(rand() * RULE_DESCRIPTIONS[selectedRule.code].length)]
    const year = 2012 + Math.floor(rand() * 10)
    const month = String(1 + Math.floor(rand() * 12)).padStart(2, '0')
    const day = String(1 + Math.floor(rand() * 28)).padStart(2, '0')

    description = description
      .replace('{date}', `${day}.${month}.${year}`)
      .replace('{n}', String(1 + Math.floor(rand() * 4)))
      .replace(
        '{cn}',
        `4624884200:0${Math.floor(rand() * 9)}:000:${String(Math.floor(rand() * 9000) + 1000).padStart(4, '0')}`,
      )
      .replace('{short}', `${lastName} ${firstName[0]}.${patronymic[0]}.`)

    const ruleObj = RULES.find((rule) => rule.code === selectedRule.code)!

    rows.push({
      id: 1848 + i,
      severity: selectedRule.severity,
      ownerName,
      taxId,
      ruleCode: selectedRule.code,
      ruleName: ruleObj.name,
      description,
      status: STATUSES[Math.floor(rand() * STATUSES.length)],
    })
  }

  return rows
}

const GENERATED_ROWS = generateRows()
const TOTAL_CASES = 4_027
const PAGE_SIZE = 50
const TASK_ID = 'A4F2'
const TASK_FILES = ['ДРПП_ostriv.xlsx', 'ДЗК_ostriv.xlsx'] as const
const RULE_BREAKDOWN = [...RULES].sort((a, b) => b.count - a.count)
const MAX_RULE_COUNT = RULE_BREAKDOWN[0].count
const DESKTOP_TABLE_GRID = '112px minmax(220px,1.15fr) minmax(220px,0.95fr) minmax(320px,1.45fr) 120px'
const SEVERITY_TONES: Record<Severity, { label: string; dot: string; text: string; bar: string }> = {
  HIGH: {
    label: 'Висока',
    dot: 'oklch(0.58 0.10 26)',
    text: 'oklch(0.34 0.03 26)',
    bar: 'oklch(0.70 0.05 26)',
  },
  MEDIUM: {
    label: 'Середня',
    dot: 'oklch(0.66 0.08 78)',
    text: 'oklch(0.38 0.025 78)',
    bar: 'oklch(0.76 0.04 78)',
  },
  LOW: {
    label: 'Низька',
    dot: 'oklch(0.60 0.07 155)',
    text: 'oklch(0.34 0.02 155)',
    bar: 'oklch(0.74 0.035 155)',
  },
}
const STATUS_TONES: Record<ResolutionStatus, { label: string; dot: string; text: string }> = {
  NEW: { label: 'Нова', dot: 'oklch(0.56 0.07 240)', text: 'oklch(0.30 0.02 240)' },
  IN_REVIEW: { label: 'В роботі', dot: 'oklch(0.66 0.08 78)', text: 'oklch(0.38 0.025 78)' },
  CONFIRMED: { label: 'Підтверджено', dot: 'oklch(0.58 0.10 26)', text: 'oklch(0.34 0.03 26)' },
  DISMISSED: { label: 'Відхилено', dot: 'oklch(0.62 0.01 250)', text: 'oklch(0.40 0.01 250)' },
}

const SEV_FILTERS: { key: Severity; label: string; count: number }[] = [
  { key: 'HIGH', label: 'Висока', count: STATS.highSeverity },
  { key: 'MEDIUM', label: 'Середня', count: STATS.mediumSeverity },
  { key: 'LOW', label: 'Низька', count: STATS.lowSeverity },
]

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Всі' },
  { value: 'NEW', label: 'Нові' },
  { value: 'IN_REVIEW', label: 'В роботі' },
  { value: 'CONFIRMED', label: 'Підтверджені' },
  { value: 'DISMISSED', label: 'Відхилені' },
] as const

type StatusFilter = 'ALL' | 'NEW' | 'IN_REVIEW' | 'CONFIRMED' | 'DISMISSED'

interface FilterState {
  severities: Set<Severity>
  rules: Set<string>
  statusFilter: StatusFilter
  search: string
}

interface FilterRailProps {
  filters: FilterState
  activeFilterCount: number
  onToggleSev: (s: Severity) => void
  onToggleRule: (code: string) => void
  onStatus: (s: StatusFilter) => void
  onSearch: (v: string) => void
  onReset: () => void
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
      {children}
    </p>
  )
}

function QuietButton({
  children,
  strong = false,
}: {
  children: ReactNode
  strong?: boolean
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        strong
          ? 'border-landing-ink bg-landing-ink text-landing-paper hover:bg-landing-ink-soft'
          : 'border-landing-border-strong bg-transparent text-landing-ink hover:bg-landing-surface'
      }`}
    >
      {children}
    </button>
  )
}

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-landing-muted transition-colors hover:text-landing-ink"
        aria-label="Пояснення показника"
      >
        <Info size={13} />
      </button>
      {show ? (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-landing-border bg-landing-paper px-3 py-2 text-xs leading-relaxed text-landing-ink-soft shadow-sm">
          {text}
        </span>
      ) : null}
    </span>
  )
}

function SeverityChip({ severity }: { severity: Severity }) {
  const tone = SEVERITY_TONES[severity]

  return (
    <span className="inline-flex h-6 items-center gap-2 whitespace-nowrap px-0 font-mono text-[10px] font-medium uppercase tracking-[0.14em] leading-none">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: tone.dot }}
        aria-hidden="true"
      />
      <span style={{ color: tone.text }}>{tone.label}</span>
    </span>
  )
}

function StatusChip({ status }: { status: ResolutionStatus }) {
  const tone = STATUS_TONES[status]

  return (
    <span className="inline-flex h-6 items-center gap-2 whitespace-nowrap px-0 font-mono text-[10px] font-medium uppercase tracking-[0.14em] leading-none">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: tone.dot }}
        aria-hidden="true"
      />
      <span style={{ color: tone.text }}>{tone.label}</span>
    </span>
  )
}

function ReportMeta({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="border-b border-landing-border pb-4 last:border-b-0 last:pb-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
        {label}
      </dt>
      <dd className="mt-2 text-sm leading-relaxed text-landing-ink">{value}</dd>
    </div>
  )
}

function TaskHeader() {
  return (
    <section className="overflow-hidden border border-landing-border bg-landing-paper">
      <div className="grid gap-px bg-landing-border xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="bg-landing-paper p-6 md:p-8">
          <SectionLabel>Analysis session #{TASK_ID}</SectionLabel>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-landing-ink md:text-4xl">
            Аналіз розбіжностей
          </h1>
          <p className="mt-2 text-base text-landing-ink-soft">
            Острівська територіальна громада · результати звірки земельного та майнового реєстрів.
          </p>

          <dl className="mt-8 grid gap-5 sm:grid-cols-2">
            <ReportMeta label="Завершено" value="18.04.2026 о 14:32" />
            <ReportMeta label="Сесія" value={`Завдання #${TASK_ID} · 42 038 записів у звірці`} />
            <ReportMeta
              label="Вхідні файли"
              value={
                <div className="space-y-1">
                  {TASK_FILES.map((file) => (
                    <div key={file} className="font-mono text-[12px] text-landing-ink-soft">
                      {file}
                    </div>
                  ))}
                </div>
              }
            />
            <ReportMeta label="Фокус перевірки" value="Невідповідності права, ІПН, призначення та повноти записів" />
          </dl>
        </div>

        <div className="flex flex-col justify-between gap-6 bg-landing-surface p-6 md:p-8">
          <div>
            <SectionLabel>Report actions</SectionLabel>
            <div className="mt-5 flex flex-col gap-2.5">
              <QuietButton strong>
                <Download size={15} />
                Завантажити звіт
              </QuietButton>
              <QuietButton>
                <Upload size={15} />
                Новий аналіз
              </QuietButton>
            </div>
          </div>

          <div className="border-t border-landing-border pt-5">
            <SectionLabel>Result overview</SectionLabel>
            <p className="mt-3 text-sm leading-relaxed text-landing-ink-soft">
              Основний ризик сконцентрований у правилах R01 та R04. Робоча зона нижче призначена для фільтрації та по-кейсного опрацювання.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function SummaryMetrics() {
  const metrics = [
    {
      label: 'Оброблено',
      value: formatNumber(STATS.totalRecords),
      note: `${formatNumber(STATS.totalLand)} землі · ${formatNumber(STATS.totalEstate)} нерухомості`,
    },
    {
      label: 'Зіставлено власників',
      value: formatNumber(STATS.matchedOwners),
      note: '100% покриття по ЄДРПОУ',
    },
    {
      label: 'Усього розбіжностей',
      value: formatNumber(STATS.totalDiscrepancies),
      note: `${formatNumber(STATS.highSeverity)} високої критичності`,
      accent: true,
    },
    {
      label: 'Потенційні втрати',
      value: STATS.estimatedLoss,
      note: 'Орієнтовні річні податкові надходження',
      extra: <InfoTooltip text="Оцінка: медіана податку × кількість кейсів R01." />,
    },
  ]

  return (
    <section className="overflow-hidden border border-landing-border bg-landing-paper">
      <div className="grid gap-px bg-landing-border sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-landing-paper p-6">
            <SectionLabel>{metric.label}</SectionLabel>
            <div className={`mt-3 font-mono text-3xl leading-none ${metric.accent ? 'text-[var(--danger)]' : 'text-landing-ink'}`}>
              {metric.value}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm leading-relaxed text-landing-ink-soft">
              <span>{metric.note}</span>
              {metric.extra}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function RuleBreakdown() {
  return (
    <section className="overflow-hidden border border-landing-border bg-landing-paper">
      <div className="border-b border-landing-border px-6 py-5 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel>Discrepancy breakdown</SectionLabel>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-landing-ink">
              Розбіжності за типами
            </h2>
          </div>
          <p className="text-sm text-landing-ink-soft">Сортування за кількістю кейсів у звіті</p>
        </div>
      </div>

      <div className="divide-y divide-landing-border">
        {RULE_BREAKDOWN.map((rule) => {
          const width = (rule.count / MAX_RULE_COUNT) * 100

          return (
            <div
              key={rule.code}
              className="grid gap-x-4 gap-y-2.5 px-6 py-4 md:grid-cols-[64px_minmax(240px,1.15fr)_minmax(190px,0.85fr)_84px_96px] md:items-center md:px-8"
            >
              <div className="pt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-landing-ink">
                {rule.code}
              </div>
              <div className="min-w-0">
                <div className="text-sm leading-5 text-landing-ink">
                  {rule.name}
                </div>
              </div>
              <div className="min-w-0">
                <div className="h-1.5 rounded-full bg-landing-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${width}%`,
                      backgroundColor:
                        SEVERITY_TONES[rule.severity].bar,
                    }}
                  />
                </div>
              </div>
              <div className="font-mono text-sm tabular-nums text-landing-ink md:text-right">
                {formatNumber(rule.count)}
              </div>
              <div className="md:flex md:justify-end">
                <SeverityChip severity={rule.severity} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function FilterSection({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`border-b border-landing-border px-4 py-4.5 last:border-b-0 ${className}`}>
      <div className="flex items-center justify-between">
        <SectionLabel>{title}</SectionLabel>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function FilterOption({
  active,
  onClick,
  marker,
  label,
  suffix,
}: {
  active: boolean
  onClick: () => void
  marker?: ReactNode
  label: ReactNode
  suffix?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[16px_12px_minmax(0,1fr)_48px] items-start gap-x-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-landing-surface"
    >
      <span
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border"
        style={{
          borderColor: active ? 'var(--accent)' : 'var(--landing-border-strong)',
          backgroundColor: active ? 'var(--accent)' : 'transparent',
        }}
      >
        {active ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
      </span>
      <span className="mt-1 flex h-3 w-3 shrink-0 items-center justify-center">
        {marker}
      </span>
      <span className="min-w-0 text-sm leading-5 text-landing-ink">{label}</span>
      {suffix ? (
        <span className="mt-0.5 w-12 shrink-0 text-right font-mono text-xs tabular-nums text-landing-muted">
          {suffix}
        </span>
      ) : null}
    </button>
  )
}

function FilterRail({
  filters,
  activeFilterCount,
  onToggleSev,
  onToggleRule,
  onStatus,
  onSearch,
  onReset,
}: FilterRailProps) {
  return (
    <aside className="w-full xl:sticky xl:top-24 xl:w-[240px] xl:self-start" aria-label="Фільтри">
      <div className="overflow-hidden border border-landing-border bg-landing-paper">
        <div className="flex items-center justify-between border-b border-landing-border px-4 py-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-landing-muted" />
            <span className="text-sm font-medium text-landing-ink">Фільтри</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
            {activeFilterCount === 0 ? 'base view' : `${activeFilterCount} active`}
          </span>
        </div>

        <div className="md:grid md:grid-cols-2 xl:block">
          <FilterSection title="Критичність">
            <div className="space-y-1">
              {SEV_FILTERS.map((item) => (
                <FilterOption
                  key={item.key}
                  active={filters.severities.has(item.key)}
                  onClick={() => onToggleSev(item.key)}
                  marker={
                    <span
                      className="block h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: SEVERITY_TONES[item.key].dot,
                      }}
                    />
                  }
                  label={item.label}
                  suffix={formatNumber(item.count)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Статус">
            <div className="space-y-1">
              {STATUS_OPTIONS.map((option) => (
                <FilterOption
                  key={option.value}
                  active={filters.statusFilter === option.value}
                  onClick={() => onStatus(option.value)}
                  label={option.label}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Тип розбіжності" className="md:col-span-2 xl:col-span-1">
            <div className="space-y-0.5">
              {RULES.map((rule) => (
                <FilterOption
                  key={rule.code}
                  active={filters.rules.has(rule.code)}
                  onClick={() => onToggleRule(rule.code)}
                  label={
                    <span className="flex min-w-0 items-start gap-2.5">
                      <span className="pt-0.5 font-mono text-[11px] text-[var(--accent)]">{rule.code}</span>
                      <span className="min-w-0 text-sm leading-5 text-landing-ink">{rule.name}</span>
                    </span>
                  }
                  suffix={formatNumber(rule.count)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Пошук" className="md:col-span-2 xl:col-span-1">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-landing-muted" />
              <input
                type="search"
                placeholder="ІПН, ім’я, опис кейсу..."
                value={filters.search}
                onChange={(event) => onSearch(event.target.value)}
                className="w-full rounded-lg border border-landing-border bg-white py-2.5 pl-9 pr-3 text-sm text-landing-ink outline-none transition-colors placeholder:text-landing-muted focus:border-landing-ink"
              />
            </div>

            <button
              type="button"
              onClick={onReset}
              className="mt-4 text-sm text-landing-ink-soft transition-colors hover:text-landing-ink"
            >
              Скинути фільтри
            </button>
          </FilterSection>
        </div>
      </div>
    </aside>
  )
}

interface TableProps {
  rows: GeneratedRow[]
  totalCount: number
  page: number
  onPageChange: (page: number) => void
}

function DiscrepanciesTable({ rows, totalCount, page, onPageChange }: TableProps) {
  const navigate = useNavigate()
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, totalCount)

  const pageButtons = useMemo<(number | '...')[]>(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    return [1, 2, 3, '...', totalPages]
  }, [totalPages])

  const handleRow = useCallback(
    (id: number) => navigate(`/tasks/a4f2/discrepancies/${id}`),
    [navigate],
  )

  const handleRowKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, id: number) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleRow(id)
      }
    },
    [handleRow],
  )

  return (
    <section className="min-w-0 flex-1 overflow-hidden border border-landing-border bg-landing-paper">
      <div className="border-b border-landing-border px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <SectionLabel>Cases for review</SectionLabel>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-landing-ink">
              Робоча черга кейсів
            </h2>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-landing-ink-soft">
              <span>
                Знайдено <strong className="font-semibold text-landing-ink">{formatNumber(totalCount)}</strong> кейсів
              </span>
              <span>Сортування: за критичністю</span>
              <span>
                Показано {formatNumber(start)}-{formatNumber(end)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <QuietButton>
              <Download size={14} />
              Експорт CSV
            </QuietButton>
            <QuietButton>
              <Download size={14} />
              Експорт PDF
            </QuietButton>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        {rows.map((row) => (
          <MobileCaseCard key={row.id} row={row} onOpen={() => handleRow(row.id)} />
        ))}
      </div>

      <div className="hidden md:block xl:hidden">
        {rows.map((row) => (
          <TabletCaseRow key={row.id} row={row} onOpen={() => handleRow(row.id)} />
        ))}
      </div>

      <div className="hidden xl:block">
        <div className="overflow-x-auto">
          <div className="min-w-[920px]">
            <div
              className="grid border-b border-landing-border bg-landing-surface px-6 py-3.5"
              style={{ gridTemplateColumns: DESKTOP_TABLE_GRID }}
            >
              {['Кейс', 'Власник', 'Правило', 'Опис', 'Статус'].map((label) => (
                <div key={label} className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                  {label}
                </div>
              ))}
            </div>

            {rows.map((row) => (
              <DesktopCaseRow
                key={row.id}
                row={row}
                onOpen={() => handleRow(row.id)}
                onKeyDown={(event) => handleRowKeyDown(event, row.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-landing-border px-5 py-4 text-sm text-landing-ink-soft md:flex-row md:items-center md:justify-between md:px-6">
        <p>
          Показано {formatNumber(start)}-{formatNumber(end)} з {formatNumber(totalCount)}
        </p>
        <nav className="flex items-center gap-1" aria-label="Пагінація">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-landing-border bg-landing-paper text-landing-ink-soft transition-colors hover:bg-landing-surface disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Попередня сторінка"
          >
            <ChevronLeft size={14} />
          </button>

          {pageButtons.map((item, index) =>
            item === '...' ? (
              <span key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-xs text-landing-muted">
                ...
              </span>
            ) : (
              <PageButton key={item} num={item} active={item === page} onClick={() => onPageChange(item)} />
            ),
          )}

          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-landing-border bg-landing-paper text-landing-ink-soft transition-colors hover:bg-landing-surface disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Наступна сторінка"
          >
            <ChevronRight size={14} />
          </button>
        </nav>
      </div>
    </section>
  )
}

function TabletCaseRow({
  row,
  onOpen,
}: {
  row: GeneratedRow
  onOpen: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      className="cursor-pointer border-b border-landing-border px-6 py-4 transition-colors hover:bg-landing-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-inset last:border-b-0"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="pt-0.5">
            <div className="font-mono text-xs text-landing-ink">#{row.id}</div>
            <div className="mt-2.5">
              <SeverityChip severity={row.severity} />
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-sm font-medium text-landing-ink">{row.ownerName}</div>
            <div className="mt-1.5 font-mono text-[11px] text-landing-muted">
              {row.taxId || 'ІПН відсутній'}
            </div>
          </div>
        </div>

        <div className="shrink-0 pt-0.5">
          <StatusChip status={row.status} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)]">
        <div className="min-w-0">
          <div className="inline-flex rounded-md border border-[var(--accent-subtle)] bg-landing-surface px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
            {row.ruleCode}
          </div>
          <div className="mt-2 text-sm leading-5 text-landing-ink-soft">{row.ruleName}</div>
        </div>

        <div className="min-w-0 border-t border-landing-border pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
            Опис кейсу
          </div>
          <div className="mt-2 text-sm leading-6 text-landing-ink-soft">{row.description}</div>
        </div>
      </div>
    </div>
  )
}

function DesktopCaseRow({
  row,
  onOpen,
  onKeyDown,
}: {
  row: GeneratedRow
  onOpen: () => void
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      className="grid cursor-pointer items-stretch border-b border-landing-border px-6 py-4 transition-colors hover:bg-landing-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-inset last:border-b-0"
      style={{ gridTemplateColumns: DESKTOP_TABLE_GRID }}
    >
      <div className="flex min-h-[56px] flex-col justify-center">
        <div className="font-mono text-xs text-landing-ink">#{row.id}</div>
        <div className="mt-2.5">
          <SeverityChip severity={row.severity} />
        </div>
      </div>

      <div className="flex min-h-[56px] min-w-0 flex-col justify-center pr-5">
        <div className="text-sm font-medium text-landing-ink">{row.ownerName}</div>
        <div className="mt-1.5 font-mono text-[11px] text-landing-muted">
          {row.taxId || 'ІПН відсутній'}
        </div>
      </div>

      <div className="flex min-h-[56px] min-w-0 flex-col justify-center pr-5">
        <div className="inline-flex rounded-md border border-[var(--accent-subtle)] bg-landing-surface px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
          {row.ruleCode}
        </div>
        <div className="mt-2 text-sm leading-5 text-landing-ink-soft">{row.ruleName}</div>
      </div>

      <div className="flex min-h-[56px] min-w-0 flex-col justify-center pr-5">
        <div className="break-words text-sm leading-5 text-landing-ink-soft">
          {row.description}
        </div>
      </div>

      <div className="flex min-h-[56px] items-center">
        <StatusChip status={row.status} />
      </div>
    </div>
  )
}

function MobileCaseCard({
  row,
  onOpen,
}: {
  row: GeneratedRow
  onOpen: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      className="cursor-pointer border-b border-landing-border px-5 py-4 transition-colors hover:bg-landing-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-inset last:border-b-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-landing-ink">#{row.id}</div>
          <div className="mt-2.5">
            <SeverityChip severity={row.severity} />
          </div>
        </div>
        <StatusChip status={row.status} />
      </div>

      <div className="mt-4 text-sm font-medium leading-6 text-landing-ink">{row.ownerName}</div>
      <div className="mt-1.5 font-mono text-[11px] text-landing-muted">{row.taxId || 'ІПН відсутній'}</div>

      <div className="mt-4 flex items-start gap-3">
        <div className="inline-flex rounded-md border border-[var(--accent-subtle)] bg-landing-surface px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
          {row.ruleCode}
        </div>
        <div className="min-w-0">
          <div className="text-sm leading-6 text-landing-ink">{row.ruleName}</div>
          <div className="mt-2 text-sm leading-6 text-landing-ink-soft">{row.description}</div>
        </div>
      </div>
    </div>
  )
}

function PageButton({
  num,
  active,
  onClick,
}: {
  num: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
        active
          ? 'border-landing-ink bg-landing-ink text-landing-paper'
          : 'border-landing-border bg-landing-paper text-landing-ink hover:bg-landing-surface'
      }`}
    >
      {num}
    </button>
  )
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterState>(() => ({
    severities: new Set<Severity>(['HIGH', 'MEDIUM', 'LOW']),
    rules: new Set(RULES.map((rule) => rule.code)),
    statusFilter: 'ALL',
    search: '',
  }))
  const [page, setPage] = useState(1)

  const handleToggleSev = useCallback((severity: Severity) => {
    setFilters((prev) => {
      const next = new Set(prev.severities)
      if (next.has(severity)) next.delete(severity)
      else next.add(severity)
      return { ...prev, severities: next }
    })
    setPage(1)
  }, [])

  const handleToggleRule = useCallback((code: string) => {
    setFilters((prev) => {
      const next = new Set(prev.rules)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return { ...prev, rules: next }
    })
    setPage(1)
  }, [])

  const handleStatus = useCallback((statusFilter: StatusFilter) => {
    setFilters((prev) => ({ ...prev, statusFilter }))
    setPage(1)
  }, [])

  const handleSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }))
    setPage(1)
  }, [])

  const handleReset = useCallback(() => {
    setFilters({
      severities: new Set<Severity>(['HIGH', 'MEDIUM', 'LOW']),
      rules: new Set(RULES.map((rule) => rule.code)),
      statusFilter: 'ALL',
      search: '',
    })
    setPage(1)
  }, [])

  const filtered = useMemo<GeneratedRow[]>(() => {
    const query = filters.search.trim().toLowerCase()

    return GENERATED_ROWS.filter((row) => {
      if (!filters.severities.has(row.severity)) return false
      if (!filters.rules.has(row.ruleCode)) return false
      if (filters.statusFilter !== 'ALL' && row.status !== filters.statusFilter) return false

      if (query) {
        const haystack = `${row.ownerName} ${row.taxId} ${row.description}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }

      return true
    })
  }, [filters])

  const isDefault =
    filters.severities.size === 3 &&
    filters.rules.size === RULES.length &&
    filters.statusFilter === 'ALL' &&
    filters.search.trim() === ''

  const totalCount = isDefault ? TOTAL_CASES : filtered.length
  const pagedRows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  )

  const activeFilterCount = [
    filters.severities.size !== 3,
    filters.rules.size !== RULES.length,
    filters.statusFilter !== 'ALL',
    filters.search.trim() !== '',
  ].filter(Boolean).length

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10 md:py-12">
        <div className="space-y-8">
          <TaskHeader />
          <SummaryMetrics />
          <RuleBreakdown />

          <section className="grid items-start gap-5 xl:grid-cols-[240px_minmax(0,1fr)]" aria-label="Аналітична робоча зона">
            <FilterRail
              filters={filters}
              activeFilterCount={activeFilterCount}
              onToggleSev={handleToggleSev}
              onToggleRule={handleToggleRule}
              onStatus={handleStatus}
              onSearch={handleSearch}
              onReset={handleReset}
            />
            <DiscrepanciesTable
              rows={pagedRows}
              totalCount={totalCount}
              page={page}
              onPageChange={setPage}
            />
          </section>
        </div>
      </div>
    </main>
  )
}
