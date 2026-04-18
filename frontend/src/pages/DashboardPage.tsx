import { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import {
  Upload,
  Download,
  TrendingUp,
  Info,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { Severity, ResolutionStatus } from '@/data/demo'
import { RULES, formatNumber } from '@/data/demo'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Seeded random data generation (seed 42, 50 rows)
// ---------------------------------------------------------------------------

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
    'Земельна ділянка без пов\u2019язаної нерухомості у ДРПП',
    '{n} ділянок не мають відповідних об\u2019єктів нерухомості',
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
    'В ДЗК "{short}", в ДРПП повне ім\u2019я з розбіжністю транслітерації',
    'Різночитання ПІБ між реєстрами: можлива латинська літера',
    'Ім\u2019я у двох реєстрах відрізняється на {n} символи',
  ],
  R07: [
    'Відсутня адреса у записі нерухомості',
    'Неповний запис: відсутні координати ділянки',
    'Запис нерухомості без площі об\u2019єкта',
  ],
}

const STATUSES: ResolutionStatus[] = ['NEW', 'NEW', 'NEW', 'IN_REVIEW', 'CONFIRMED', 'DISMISSED']

function generateRows(): GeneratedRow[] {
  const rand = seededRand(42)
  const rows: GeneratedRow[] = []

  // Showcase row pinned at index 0
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
  const totalWeight = ruleWeights.reduce((s, r) => s + r.weight, 0)

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

    const descTemplates = RULE_DESCRIPTIONS[selectedRule.code]
    let desc = descTemplates[Math.floor(rand() * descTemplates.length)]
    const year = 2012 + Math.floor(rand() * 10)
    const month = String(1 + Math.floor(rand() * 12)).padStart(2, '0')
    const day = String(1 + Math.floor(rand() * 28)).padStart(2, '0')
    desc = desc
      .replace('{date}', `${day}.${month}.${year}`)
      .replace('{n}', String(1 + Math.floor(rand() * 4)))
      .replace('{cn}', `4624884200:0${Math.floor(rand() * 9)}:000:${String(Math.floor(rand() * 9000) + 1000).padStart(4, '0')}`)
      .replace('{short}', `${lastName} ${firstName[0]}.${patronymic[0]}.`)

    const ruleObj = RULES.find((ru) => ru.code === selectedRule.code)!
    const status = STATUSES[Math.floor(rand() * STATUSES.length)]

    rows.push({
      id: 1848 + i,
      severity: selectedRule.severity,
      ownerName,
      taxId,
      ruleCode: selectedRule.code,
      ruleName: ruleObj.name,
      description: desc,
      status,
    })
  }

  return rows
}

const GENERATED_ROWS = generateRows()

// ---------------------------------------------------------------------------
// Constants / data
// ---------------------------------------------------------------------------

const TOTAL_CASES = 4_027
const PAGE_SIZE = 50
// Total pages: Math.ceil(TOTAL_CASES / PAGE_SIZE) = 81

const RULE_BREAKDOWN = [...RULES].sort((a, b) => b.count - a.count)
const MAX_RULE_COUNT = RULE_BREAKDOWN[0].count

const SEV_FILTERS: { key: Severity; label: string; color: string; count: number }[] = [
  { key: 'HIGH', label: 'Висока', color: 'var(--danger)', count: 3708 + 177 },
  { key: 'MEDIUM', label: 'Середня', color: 'var(--warning)', count: 470 + 1 + 16 },
  { key: 'LOW', label: 'Низька', color: '#86EFAC', count: 2673 + 44 },
]

// ---------------------------------------------------------------------------
// Small chip helpers
// ---------------------------------------------------------------------------

function SevChip({ severity }: { severity: Severity }) {
  const map: Record<Severity, { bg: string; text: string; dot: string; label: string }> = {
    HIGH: { bg: 'var(--danger-subtle)', text: 'var(--danger)', dot: 'var(--danger)', label: 'Висока' },
    MEDIUM: { bg: 'var(--warning-subtle)', text: 'var(--warning)', dot: 'var(--warning)', label: 'Середня' },
    LOW: { bg: 'var(--success-subtle)', text: 'var(--success)', dot: '#86EFAC', label: 'Низька' },
  }
  const s = map[severity]
  return (
    <span
      style={{ background: s.bg, color: s.text }}
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
    >
      <span
        style={{ background: s.dot }}
        className="inline-block size-1.5 rounded-full shrink-0"
      />
      {s.label}
    </span>
  )
}

function StatusChip({ status }: { status: ResolutionStatus }) {
  const map: Record<ResolutionStatus, { bg: string; text: string; label: string }> = {
    NEW: { bg: 'var(--info-subtle)', text: 'var(--info)', label: 'Нова' },
    IN_REVIEW: { bg: 'var(--warning-subtle)', text: 'var(--warning)', label: 'В роботі' },
    CONFIRMED: { bg: 'var(--danger-subtle)', text: 'var(--danger)', label: 'Підтверджено' },
    DISMISSED: { bg: 'var(--surface-muted)', text: 'var(--text-muted)', label: 'Відхилено' },
  }
  const s = map[status]
  return (
    <span
      style={{ background: s.bg, color: s.text }}
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
    >
      {s.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Tooltip (Info icon)
// ---------------------------------------------------------------------------

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
        className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        aria-label="Підказка"
      >
        <Info size={13} />
      </button>
      {show && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-secondary)] shadow-lg pointer-events-none"
        >
          {text}
        </span>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Section 1 - Task header
// ---------------------------------------------------------------------------

function TaskHeader() {
  return (
    <div className="mb-6 flex items-start justify-between gap-6">
      <div className="min-w-0">
        <p
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          ЗАВДАННЯ #A4F2
        </p>
        <h1
          className="mt-1 font-semibold leading-tight"
          style={{
            fontSize: 24,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
          }}
        >
          Аналіз розбіжностей - Острівська ТГ
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Завершено 18.04.2026 о 14:32 · ДРПП_ostriv.xlsx + ДЗК_ostriv.xlsx
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
        >
          <Upload size={15} aria-hidden="true" />
          Новий аналіз
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-white transition-colors"
          style={{ background: 'var(--accent)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <Download size={15} aria-hidden="true" />
          Завантажити звіт
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 2 - Stats row
// ---------------------------------------------------------------------------

function StatsRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1 */}
      <div
        className="rounded-lg border p-5"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          ОБРОБЛЕНО
        </p>
        <p
          className="mt-1.5 font-mono font-bold leading-none"
          style={{ fontSize: 28, color: 'var(--text-primary)' }}
        >
          42 038
        </p>
        <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          21 656 землі · 20 382 нерухомості
        </p>
      </div>

      {/* Card 2 */}
      <div
        className="rounded-lg border p-5"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          ЗІСТАВЛЕНО ВЛАСНИКІВ
        </p>
        <p
          className="mt-1.5 font-mono font-bold leading-none"
          style={{ fontSize: 28, color: 'var(--text-primary)' }}
        >
          {formatNumber(10_936)}
        </p>
        <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          100% покриття по ЄДРПОУ
        </p>
        <span
          className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}
        >
          ✓ Високе покриття
        </span>
      </div>

      {/* Card 3 */}
      <div
        className="rounded-lg border p-5"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          РОЗБІЖНОСТЕЙ
        </p>
        <p
          className="mt-1.5 font-mono font-bold leading-none"
          style={{ fontSize: 28, color: 'var(--danger)' }}
        >
          4 027
        </p>
        <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          <TrendingUp size={12} aria-hidden="true" />
          3 708 високої критичності
        </p>
      </div>

      {/* Card 4 */}
      <div
        className="rounded-lg border p-5"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          ПОТЕНЦІЙНІ ВТРАТИ
        </p>
        <p
          className="mt-1.5 font-mono font-bold leading-none"
          style={{ fontSize: 28, color: 'var(--accent)' }}
        >
          ~2.4 млн ₴
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          річні податкові надходження
          <InfoTooltip text="Оцінка: медіана податку × кількість R01" />
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 3 - Rule breakdown (pure CSS bars)
// ---------------------------------------------------------------------------

const SEVERITY_BAR_COLOR: Record<string, string> = {
  HIGH: 'var(--danger)',
  MEDIUM: 'var(--warning)',
  LOW: '#86EFAC',
}

const SEVERITY_CHIP: Record<string, { bg: string; text: string; label: string }> = {
  HIGH: { bg: 'var(--danger-subtle)', text: 'var(--danger)', label: 'Висока' },
  MEDIUM: { bg: 'var(--warning-subtle)', text: 'var(--warning)', label: 'Середня' },
  LOW: { bg: 'var(--success-subtle)', text: 'var(--success)', label: 'Низька' },
}

function RuleBreakdown() {
  return (
    <div
      className="mt-6 rounded-lg border p-5"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Розбіжності за типами
        </h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Сортування: за кількістю
        </p>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {RULE_BREAKDOWN.map((rule) => {
          const barPct = (rule.count / MAX_RULE_COUNT) * 100
          const chip = SEVERITY_CHIP[rule.severity]
          const barColor = SEVERITY_BAR_COLOR[rule.severity]
          return (
            <div key={rule.code} className="flex items-center gap-3">
              {/* Code chip */}
              <span
                className="shrink-0 rounded font-mono text-[11px] font-medium text-center"
                style={{
                  width: 44,
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  padding: '2px 0',
                }}
              >
                {rule.code}
              </span>

              {/* Rule name */}
              <span
                className="hidden shrink-0 truncate text-sm md:block"
                style={{ width: 280, color: 'var(--text-secondary)' }}
                title={rule.name}
              >
                {rule.name}
              </span>

              {/* Progress bar */}
              <div
                className="flex-1 rounded-full overflow-hidden"
                style={{ height: 8, background: 'var(--surface-muted)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barPct}%`, background: barColor }}
                />
              </div>

              {/* Count */}
              <span
                className="shrink-0 font-mono text-xs text-right"
                style={{ width: 70, color: 'var(--text-muted)' }}
              >
                {formatNumber(rule.count)}
              </span>

              {/* Severity chip */}
              <span
                className="shrink-0 inline-flex items-center justify-center rounded-full text-[11px] font-medium"
                style={{
                  width: 72,
                  background: chip.bg,
                  color: chip.text,
                  padding: '2px 0',
                }}
              >
                {chip.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 4 - Filter rail
// ---------------------------------------------------------------------------

type StatusFilter = 'ALL' | 'NEW' | 'IN_REVIEW' | 'CONFIRMED' | 'DISMISSED'

interface FilterState {
  severities: Set<Severity>
  rules: Set<string>
  statusFilter: StatusFilter
  search: string
}

interface FilterRailProps {
  filters: FilterState
  onToggleSev: (s: Severity) => void
  onToggleRule: (code: string) => void
  onStatus: (s: StatusFilter) => void
  onSearch: (v: string) => void
  onReset: () => void
}

function FilterRail({
  filters,
  onToggleSev,
  onToggleRule,
  onStatus,
  onSearch,
  onReset,
}: FilterRailProps) {
  return (
    <aside
      className="w-full shrink-0 rounded-lg border lg:w-[280px]"
      style={{
        position: 'sticky',
        top: 80,
        alignSelf: 'flex-start',
        borderColor: 'var(--border)',
        background: 'var(--surface)',
      }}
      aria-label="Фільтри"
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 border-b px-4 py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <Filter size={14} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Фільтри
        </span>
      </div>

      <div className="p-4 flex flex-col gap-0">
        {/* Severity */}
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Критичність
          </p>
          <div className="flex flex-col gap-1.5">
            {SEV_FILTERS.map(({ key, label, color, count }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-0.5 transition-colors"
                style={{ '--hover-bg': 'var(--surface-muted)' } as React.CSSProperties}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--surface-muted)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Custom checkbox */}
                <span
                  className="flex size-4 shrink-0 items-center justify-center rounded border transition-colors"
                  style={{
                    borderColor: filters.severities.has(key)
                      ? 'var(--accent)'
                      : 'var(--border-strong)',
                    background: filters.severities.has(key)
                      ? 'var(--accent)'
                      : 'transparent',
                  }}
                  onClick={() => onToggleSev(key)}
                >
                  {filters.severities.has(key) && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2.5 2.5L8 2.5"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                {/* Severity dot */}
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    background: color,
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                  aria-hidden="true"
                />
                <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                  {label}
                </span>
                <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatNumber(count)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="my-3 h-px" style={{ background: 'var(--border)' }} />

        {/* Rule type */}
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Тип розбіжності
          </p>
          <div className="flex flex-col gap-1.5">
            {RULES.map((rule) => (
              <label
                key={rule.code}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-0.5 transition-colors"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--surface-muted)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  className="flex size-4 shrink-0 items-center justify-center rounded border transition-colors"
                  style={{
                    borderColor: filters.rules.has(rule.code)
                      ? 'var(--accent)'
                      : 'var(--border-strong)',
                    background: filters.rules.has(rule.code)
                      ? 'var(--accent)'
                      : 'transparent',
                  }}
                  onClick={() => onToggleRule(rule.code)}
                >
                  {filters.rules.has(rule.code) && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2.5 2.5L8 2.5"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="flex-1 min-w-0 flex items-center gap-1.5 text-sm">
                  <span
                    className="shrink-0 font-mono text-[11px] font-medium"
                    style={{ color: 'var(--accent)' }}
                  >
                    {rule.code}
                  </span>
                  <span
                    className="truncate"
                    style={{ color: 'var(--text-primary)' }}
                    title={rule.name}
                  >
                    {rule.name}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatNumber(rule.count)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="my-3 h-px" style={{ background: 'var(--border)' }} />

        {/* Status */}
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Статус
          </p>
          <div className="flex flex-col gap-1.5">
            {(
              [
                { value: 'ALL', label: 'Всі' },
                { value: 'NEW', label: 'Нові' },
                { value: 'IN_REVIEW', label: 'В роботі' },
                { value: 'CONFIRMED', label: 'Підтверджені' },
                { value: 'DISMISSED', label: 'Відхилені' },
              ] as { value: StatusFilter; label: string }[]
            ).map(({ value, label }) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-0.5 transition-colors"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--surface-muted)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  className="flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors"
                  style={{
                    borderColor:
                      filters.statusFilter === value
                        ? 'var(--accent)'
                        : 'var(--border-strong)',
                  }}
                  onClick={() => onStatus(value)}
                >
                  {filters.statusFilter === value && (
                    <span
                      className="size-2 rounded-full"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="my-3 h-px" style={{ background: 'var(--border)' }} />

        {/* Search */}
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Пошук
          </p>
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="ІПН, ім'я, адреса..."
              value={filters.search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full rounded-lg border pl-8 pr-3 py-1.5 text-sm outline-none transition-colors"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
              }}
              aria-label="Пошук по ІПН, імені або адресі"
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = 'var(--accent)')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = 'var(--border)')
              }
            />
          </div>
        </div>

        {/* Reset */}
        <button
          type="button"
          onClick={onReset}
          className="mt-4 text-xs font-medium transition-colors text-left"
          style={{ color: 'var(--accent)' }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = 'var(--accent-hover)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = 'var(--accent)')
          }
        >
          Скинути фільтри
        </button>
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Section 5 - Discrepancies table
// ---------------------------------------------------------------------------

interface TableProps {
  rows: GeneratedRow[]
  totalCount: number
  page: number
  onPageChange: (p: number) => void
}

function DiscrepanciesTable({ rows, totalCount, page, onPageChange }: TableProps) {
  const navigate = useNavigate()
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, totalCount)

  // Pagination buttons: [<] [1] [2] [3] [...] [81] [>]
  const pageButtons = useMemo<(number | '...')[]>(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    return [1, 2, 3, '...', totalPages]
  }, [totalPages])

  const handleRow = useCallback(
    (id: number) => navigate(`/tasks/a4f2/discrepancies/${id}`),
    [navigate],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, id: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleRow(id)
      }
    },
    [handleRow],
  )

  const gridCols = '32px 60px 140px 2fr 180px 3fr 110px 40px'

  return (
    <div className="flex flex-1 flex-col min-w-0">
      {/* Toolbar */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Знайдено{' '}
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {formatNumber(totalCount)}
            </span>{' '}
            кейсів
          </p>
          <span
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Сортування: за критичністю
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
          >
            <Download size={12} aria-hidden="true" />
            Експорт CSV
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
          >
            <Download size={12} aria-hidden="true" />
            Експорт PDF
          </button>
        </div>
      </div>

      {/* Table container */}
      <div
        className="overflow-hidden rounded-lg border"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        {/* Header */}
        <div
          className="grid items-center border-b px-3 py-2.5"
          style={{
            gridTemplateColumns: gridCols,
            borderColor: 'var(--border)',
            background: 'var(--surface-muted)',
          }}
        >
          <div />
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            #ID
          </span>
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Критичність
          </span>
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Власник
          </span>
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Правило
          </span>
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Опис
          </span>
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Статус
          </span>
          <div />
        </div>

        {/* Rows */}
        {rows.map((row) => (
          <RowItem
            key={row.id}
            row={row}
            gridCols={gridCols}
            onClick={() => handleRow(row.id)}
            onKeyDown={(e) => handleKeyDown(e, row.id)}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Показано {formatNumber(start)}-{formatNumber(end)} з {formatNumber(totalCount)}
        </p>

        <nav className="flex items-center gap-1" aria-label="Пагінація">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            aria-label="Попередня сторінка"
            className="flex items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              width: 32,
              height: 32,
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-muted)',
            }}
          >
            <ChevronLeft size={13} aria-hidden="true" />
          </button>

          {pageButtons.map((btn, idx) =>
            btn === '...' ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex items-center justify-center text-xs"
                style={{ width: 32, height: 32, color: 'var(--text-muted)' }}
              >
                ...
              </span>
            ) : (
              <PageButton
                key={btn}
                num={btn}
                active={btn === page}
                onClick={() => onPageChange(btn)}
              />
            ),
          )}

          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            aria-label="Наступна сторінка"
            className="flex items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              width: 32,
              height: 32,
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-muted)',
            }}
          >
            <ChevronRight size={13} aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Row item (extracted to avoid re-render issues)
// ---------------------------------------------------------------------------

interface RowItemProps {
  row: GeneratedRow
  gridCols: string
  onClick: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
}

function RowItem({ row, gridCols, onClick, onKeyDown }: RowItemProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Відкрити кейс ${row.id}: ${row.ownerName}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="grid items-center border-b px-3 py-2.5 cursor-pointer transition-colors last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
      style={{
        gridTemplateColumns: gridCols,
        borderColor: 'var(--border)',
        background: hovered ? 'var(--surface-muted)' : 'transparent',
        '--tw-ring-color': 'var(--accent)',
      } as React.CSSProperties}
    >
      {/* Checkbox placeholder */}
      <div className="flex items-center justify-center">
        <span
          className="size-3.5 rounded border"
          style={{ borderColor: 'var(--border-strong)' }}
        />
      </div>

      {/* ID */}
      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        #{row.id}
      </span>

      {/* Severity */}
      <div>
        <SevChip severity={row.severity} />
      </div>

      {/* Owner */}
      <div className="min-w-0 pr-2">
        <p
          className="truncate text-sm font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {row.ownerName}
        </p>
        {row.taxId && (
          <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            {row.taxId}
          </p>
        )}
      </div>

      {/* Rule */}
      <div className="min-w-0 pr-2">
        <span
          className="inline-block rounded font-mono text-[11px] font-medium px-1.5 py-0.5"
          style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
        >
          {row.ruleCode}
        </span>
        <p
          className="mt-0.5 truncate text-xs"
          style={{ color: 'var(--text-muted)' }}
          title={row.ruleName}
        >
          {row.ruleName}
        </p>
      </div>

      {/* Description */}
      <div className="min-w-0 pr-2">
        <p
          className="truncate text-sm"
          style={{ color: 'var(--text-secondary)' }}
          title={row.description}
        >
          {row.description}
        </p>
      </div>

      {/* Status */}
      <div>
        <StatusChip status={row.status} />
      </div>

      {/* Chevron */}
      <div className="flex items-center justify-center" aria-hidden="true">
        <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page button
// ---------------------------------------------------------------------------

function PageButton({
  num,
  active,
  onClick,
}: {
  num: number
  active: boolean
  onClick: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={`Сторінка ${num}`}
      aria-current={active ? 'page' : undefined}
      className="flex items-center justify-center rounded-md border text-xs font-medium transition-colors"
      style={{
        width: 32,
        height: 32,
        borderColor: active ? 'var(--accent)' : 'var(--border)',
        background: active ? 'var(--accent)' : 'var(--surface)',
        color: active ? '#fff' : 'var(--text-secondary)',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'var(--surface-muted)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'var(--surface)'
      }}
    >
      {num}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterState>(() => ({
    severities: new Set<Severity>(['HIGH', 'MEDIUM', 'LOW']),
    rules: new Set(RULES.map((r) => r.code)),
    statusFilter: 'ALL' as StatusFilter,
    search: '',
  }))
  const [page, setPage] = useState(1)

  const handleToggleSev = useCallback((s: Severity) => {
    setFilters((prev) => {
      const next = new Set(prev.severities)
      if (next.has(s)) next.delete(s)
      else next.add(s)
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
      rules: new Set(RULES.map((r) => r.code)),
      statusFilter: 'ALL',
      search: '',
    })
    setPage(1)
  }, [])

  // Client-side filtering of the 50 generated rows
  const filtered = useMemo<GeneratedRow[]>(() => {
    const q = filters.search.trim().toLowerCase()
    return GENERATED_ROWS.filter((row) => {
      if (!filters.severities.has(row.severity)) return false
      if (!filters.rules.has(row.ruleCode)) return false
      if (filters.statusFilter !== 'ALL' && row.status !== filters.statusFilter) return false
      if (q) {
        const hay = `${row.ownerName} ${row.taxId} ${row.description}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [filters])

  // Show full 4027 count when no filters applied; otherwise show filtered count
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

  return (
    <main
      className="min-h-screen px-6 py-8"
      style={{ background: 'var(--background)' }}
    >
      <div className="mx-auto w-full max-w-[1440px]">
        {/* Task header */}
        <TaskHeader />

        {/* Stats */}
        <StatsRow />

        {/* Rule breakdown */}
        <RuleBreakdown />

        {/* Filter + Table */}
        <section className="mt-6" aria-label="Таблиця розбіжностей">
          <div className="flex flex-col items-start gap-5 lg:flex-row">
            <FilterRail
              filters={filters}
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
          </div>
        </section>
      </div>
    </main>
  )
}
