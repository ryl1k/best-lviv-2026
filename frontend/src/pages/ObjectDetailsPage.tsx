import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ChevronLeft,
  AlertTriangle,
  AlertCircle,
  Map,
  Building2,
  Check,
  Ban,
  Plus,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LandRecord {
  cadastralNumber: string
  purpose: string
  location: string
  areaHa: string
  normativeValue: string
  registeredAt: string
  owner: string
}

interface EstateRecord {
  objectType: string
  address: string
  areaM2: string
  registeredAt: string
  terminatedAt: string
  owner: string
  ownershipShare: string
}

interface TimelineEvent {
  date: string
  description: string
  source: 'ДРПП' | 'ДЗК'
  type: 'normal' | 'danger' | 'active'
}

interface Note {
  initials: string
  author: string
  date: string
  text: string
}

// ---------------------------------------------------------------------------
// Static data (matching the prototype exactly)
// ---------------------------------------------------------------------------

const LAND_RECORDS: LandRecord[] = [
  {
    cadastralNumber: '4624884200:05:000:0009',
    purpose: 'Для будівництва і обслуговування житлового будинку',
    location: 'вулиця Коваліва, 45',
    areaHa: '0.1200',
    normativeValue: '47 328,00 ₴',
    registeredAt: '18.01.2024',
    owner: 'Грицина Іван Іванович',
  },
  {
    cadastralNumber: '4624884200:05:000:0134',
    purpose: 'Для ведення товарного сільськогосподарського виробництва',
    location: 'вулиця Коваліва, 45',
    areaHa: '0.2500',
    normativeValue: '125 400,00 ₴',
    registeredAt: '14.02.2013',
    owner: 'Грицина Іван Іванович',
  },
]

const ESTATE_RECORD: EstateRecord = {
  objectType: 'Квартира',
  address: 'вулиця Коваліва, будинок 45, квартира 77',
  areaM2: '68.40',
  registeredAt: '14.02.2013',
  terminatedAt: '07.04.2015',
  owner: 'Грицина І. І.',
  ownershipShare: '1/1',
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    date: '14.02.2013',
    description: 'Реєстрація права на квартиру',
    source: 'ДРПП',
    type: 'normal',
  },
  {
    date: '07.04.2015',
    description: 'Припинення права на квартиру',
    source: 'ДРПП',
    type: 'danger',
  },
  {
    date: '18.01.2024',
    description: 'Реєстрація права на землю (ділянка 2)',
    source: 'ДЗК',
    type: 'active',
  },
]

const NOTES: Note[] = [
  {
    initials: 'АК',
    author: 'Анна Ковальчук',
    date: '18.04.2026, 14:45',
    text: 'Запит у ДЗК на уточнення статусу ділянки 4624884200:05:000:0009. Потрібна перевірка на місці.',
  },
  {
    initials: 'МШ',
    author: 'Михайло Шевченко',
    date: '17.04.2026, 11:12',
    text: 'Попередньо виглядає як систематична помилка - право припинено, але запис про землекористування продовжено.',
  },
]

// ---------------------------------------------------------------------------
// Tiny design tokens (inline)
// ---------------------------------------------------------------------------

const T = {
  accent: '#0050B5',
  accentHover: '#003D8A',
  accentSubtle: '#E6EEF8',
  success: '#16A34A',
  successSubtle: '#DCFCE7',
  danger: '#DC2626',
  dangerSubtle: '#FEE2E2',
  dangerDeep: '#7F1D1D',
  info: '#0284C7',
  infoSubtle: '#E0F2FE',
  warning: '#F59E0B',
  warningSubtle: '#FEF3C7',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F4F5',
  bg: '#FAFAFA',
  border: '#E4E4E7',
  borderStrong: '#D4D4D8',
  textPrimary: '#0A0A0A',
  textSecondary: '#3F3F46',
  textMuted: '#71717A',
  textDisabled: '#A1A1AA',
} as const

// ---------------------------------------------------------------------------
// Chip components
// ---------------------------------------------------------------------------

function ChipDanger({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: '0.02em',
        color: T.danger,
        background: T.dangerSubtle,
        border: `1px solid rgba(220,38,38,0.25)`,
        borderRadius: 4,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function ChipInfo({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: '0.02em',
        color: T.info,
        background: T.infoSubtle,
        border: `1px solid rgba(2,132,199,0.25)`,
        borderRadius: 4,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function ChipDangerMono({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        letterSpacing: '0.04em',
        color: T.dangerDeep,
        background: 'rgba(220,38,38,0.15)',
        borderRadius: 4,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function ChipSource({ source }: { source: 'ДРПП' | 'ДЗК' }) {
  const isDrpp = source === 'ДРПП'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        color: isDrpp ? T.info : T.accent,
        background: isDrpp ? T.infoSubtle : T.accentSubtle,
        borderRadius: 3,
        padding: '1px 5px',
        whiteSpace: 'nowrap',
        textTransform: 'uppercase',
      }}
    >
      {source}
    </span>
  )
}

function ChipConflict() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.03em',
        color: T.warning,
        background: '#FEF3C7',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 3,
        padding: '1px 5px',
        whiteSpace: 'nowrap',
      }}
    >
      Різниця
    </span>
  )
}

// ---------------------------------------------------------------------------
// Conflict dot (yellow, with tooltip)
// ---------------------------------------------------------------------------

function ConflictDot() {
  return (
    <span
      title="Різниця між реєстрами"
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: T.warning,
        border: '1px solid rgba(245,158,11,0.4)',
        cursor: 'help',
        flexShrink: 0,
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Field row (grid layout: 160px label | 1fr value)
// ---------------------------------------------------------------------------

interface FieldRowProps {
  label: React.ReactNode
  value: React.ReactNode
  mono?: boolean
  highlight?: boolean
  conflictChip?: boolean
}

function FieldRow({ label, value, mono = false, highlight = false, conflictChip = false }: FieldRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        columnGap: 12,
        alignItems: 'start',
        padding: '9px 0',
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: T.textMuted,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          paddingTop: 1,
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>

      {/* Value */}
      <span
        style={{
          fontSize: 13,
          fontFamily: mono
            ? "'JetBrains Mono', ui-monospace, monospace"
            : 'inherit',
          fontWeight: mono ? 500 : 400,
          color: highlight ? T.danger : T.textPrimary,
          background: highlight ? T.dangerSubtle : 'transparent',
          borderRadius: highlight ? 4 : 0,
          padding: highlight ? '2px 6px' : 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          flexWrap: 'wrap',
          lineHeight: 1.45,
        }}
      >
        {highlight && (
          <AlertCircle
            size={13}
            style={{ color: T.danger, flexShrink: 0 }}
            aria-hidden="true"
          />
        )}
        {value}
        {conflictChip && <ChipConflict />}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card shell
// ---------------------------------------------------------------------------

interface CardProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '14px 20px',
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      {children}
    </div>
  )
}

function CardBody({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ padding: '0 20px 20px', ...style }}>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Actions component (reused in header + sticky footer)
// ---------------------------------------------------------------------------

interface ActionsProps {
  compact?: boolean
}

function Actions({ compact = false }: ActionsProps) {
  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    fontFamily: 'inherit',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 120ms, border-color 120ms, color 120ms',
    outline: 'none',
    border: '1px solid transparent',
    whiteSpace: 'nowrap',
    fontSize: compact ? 12 : 13,
    padding: compact ? '5px 10px' : '7px 14px',
    lineHeight: 1.4,
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* В роботу — primary */}
      <button
        style={{
          ...btnBase,
          background: T.accent,
          color: '#fff',
          borderColor: T.accent,
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background = T.accentHover
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = T.accentHover
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background = T.accent
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = T.accent
        }}
        aria-label="Взяти кейс в роботу"
      >
        В роботу
      </button>

      {/* Підтвердити проблему — success-outline */}
      <button
        style={{
          ...btnBase,
          background: T.surface,
          color: T.success,
          borderColor: T.success,
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background = T.successSubtle
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background = T.surface
        }}
        aria-label="Підтвердити проблему"
      >
        <Check size={compact ? 13 : 14} aria-hidden="true" />
        Підтвердити проблему
      </button>

      {/* Відхилити — danger-ghost */}
      <button
        style={{
          ...btnBase,
          background: 'transparent',
          color: T.danger,
          borderColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background = T.dangerSubtle
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        }}
        aria-label="Відхилити кейс"
      >
        <Ban size={compact ? 13 : 14} aria-hidden="true" />
        Відхилити
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// IPN with copy tooltip
// ---------------------------------------------------------------------------

function IpnWithTooltip({ ipn }: { ipn: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    void navigator.clipboard.writeText(ipn).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleCopy}
        title={copied ? 'Скопійовано!' : 'Натисніть щоб скопіювати'}
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontWeight: 500,
          fontSize: 'inherit',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: T.textSecondary,
          textDecoration: 'underline dotted',
          textUnderlineOffset: 2,
          outline: 'none',
        }}
      >
        {ipn}
      </button>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Land registry card
// ---------------------------------------------------------------------------

function LandRegistryCard() {
  const [activeTab, setActiveTab] = useState(0)
  const record = LAND_RECORDS[activeTab]

  return (
    <Card>
      <CardHeader>
        <Map size={16} style={{ color: T.accent, flexShrink: 0 }} aria-hidden="true" />
        <h2
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: T.textPrimary,
          }}
        >
          Земельний реєстр (ДЗК)
        </h2>
      </CardHeader>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: `1px solid ${T.border}`,
          padding: '0 20px',
        }}
      >
        {LAND_RECORDS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            style={{
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'inherit',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === idx ? `2px solid ${T.accent}` : '2px solid transparent',
              color: activeTab === idx ? T.accent : T.textMuted,
              cursor: 'pointer',
              padding: '9px 12px 8px',
              outline: 'none',
              transition: 'color 120ms, border-color 120ms',
            }}
          >
            Ділянка {idx + 1}
          </button>
        ))}
      </div>

      <CardBody>
        <div style={{ marginTop: 4 }}>
          <FieldRow
            label="Кадастровий номер"
            value={record.cadastralNumber}
            mono
          />
          <FieldRow
            label="Цільове призначення"
            value={record.purpose}
          />
          <FieldRow
            label="Місцерозташування"
            value={record.location}
          />
          <FieldRow
            label="Площа (га)"
            value={record.areaHa}
            mono
          />
          <FieldRow
            label="Нормативна оцінка"
            value={record.normativeValue}
            mono
          />
          <FieldRow
            label="Дата реєстрації"
            value={record.registeredAt}
            mono
          />
          <FieldRow
            label={
              <>
                Землекористувач
                <ConflictDot />
              </>
            }
            value={record.owner}
          />
        </div>
      </CardBody>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Estate registry card
// ---------------------------------------------------------------------------

function EstateRegistryCard() {
  const r = ESTATE_RECORD

  return (
    <Card>
      <CardHeader>
        <Building2 size={16} style={{ color: T.accent, flexShrink: 0 }} aria-hidden="true" />
        <h2
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: T.textPrimary,
          }}
        >
          Реєстр нерухомості (ДРПП)
        </h2>
      </CardHeader>

      <CardBody>
        <div style={{ marginTop: 4 }}>
          <FieldRow label="Тип об'єкта" value={r.objectType} />
          <FieldRow label="Адреса" value={r.address} />
          <FieldRow label="Площа (м²)" value={r.areaM2} mono />
          <FieldRow label="Дата реєстрації" value={r.registeredAt} mono />
          <FieldRow
            label="Дата припинення права"
            value={r.terminatedAt}
            mono
            highlight
          />
          <FieldRow
            label={
              <>
                Власник
                <ConflictDot />
              </>
            }
            value={r.owner}
            conflictChip
          />
          <FieldRow label="Частка володіння" value={r.ownershipShare} mono />
        </div>
      </CardBody>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

function TimelineSection() {
  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ padding: 20 }}>
        <h2
          style={{
            margin: '0 0 20px',
            fontSize: 14,
            fontWeight: 600,
            color: T.textPrimary,
          }}
        >
          Хронологія по власнику
        </h2>

        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label="Хронологія подій">
          {TIMELINE_EVENTS.map((ev, idx) => {
            const isLast = idx === TIMELINE_EVENTS.length - 1

            let dotBg: string = T.textDisabled
            let dotBoxShadow = 'none'
            let dotAnimation = 'none'

            if (ev.type === 'danger') dotBg = T.danger
            if (ev.type === 'active') {
              dotBg = T.accent
              dotBoxShadow = '0 0 0 4px rgba(0,80,181,0.15)'
              dotAnimation = 'revela-pulse 2s ease-in-out infinite'
            }

            return (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  gap: 16,
                  position: 'relative',
                }}
              >
                {/* Connector line */}
                {!isLast && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 5,
                      top: 16,
                      bottom: 0,
                      width: 1,
                      background: T.border,
                    }}
                  />
                )}

                {/* Dot */}
                <div style={{ paddingTop: 4, flexShrink: 0, position: 'relative', zIndex: 1 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'block',
                      width: 11,
                      height: 11,
                      borderRadius: '50%',
                      background: dotBg,
                      border: `2px solid ${T.surface}`,
                      boxShadow: dotBoxShadow,
                      animation: dotAnimation,
                    }}
                  />
                </div>

                {/* Content */}
                <div style={{ paddingBottom: isLast ? 0 : 20, flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: 13,
                        fontWeight: 500,
                        color: ev.type === 'danger' ? T.danger : T.textSecondary,
                      }}
                    >
                      {ev.date}
                    </span>
                    <ChipSource source={ev.source} />
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: T.textSecondary,
                      lineHeight: 1.45,
                    }}
                  >
                    {ev.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Notes section
// ---------------------------------------------------------------------------

function NotesSection() {
  const [noteText, setNoteText] = useState('')

  return (
    <Card>
      <div style={{ padding: 20 }}>
        <h2
          style={{
            margin: '0 0 16px',
            fontSize: 14,
            fontWeight: 600,
            color: T.textPrimary,
          }}
        >
          Нотатки посадовця
        </h2>

        {/* Textarea */}
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Опишіть результати перевірки..."
          style={{
            width: '100%',
            minHeight: 90,
            resize: 'vertical',
            borderRadius: 6,
            border: `1px solid ${T.border}`,
            background: T.surface,
            padding: 12,
            fontSize: 13,
            fontFamily: 'inherit',
            color: T.textPrimary,
            outline: 'none',
            boxSizing: 'border-box',
            lineHeight: 1.5,
            transition: 'border-color 120ms, box-shadow 120ms',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = T.accent
            e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,80,181,0.12)`
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = T.border
            e.currentTarget.style.boxShadow = 'none'
          }}
          aria-label="Нотатки посадовця"
        />

        {/* Add button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            disabled={noteText.trim().length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'inherit',
              background: T.surfaceMuted,
              color: noteText.trim().length === 0 ? T.textDisabled : T.textSecondary,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: '6px 12px',
              cursor: noteText.trim().length === 0 ? 'not-allowed' : 'pointer',
              outline: 'none',
              transition: 'background 120ms',
            }}
          >
            <Plus size={14} aria-hidden="true" />
            Додати нотатку
          </button>
        </div>

        {/* History label */}
        <div style={{ marginTop: 20, marginBottom: 12 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: T.textMuted,
            }}
          >
            ІСТОРІЯ · {NOTES.length} ЗАПИСИ
          </span>
        </div>

        {/* Notes list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {NOTES.map((note, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: T.accentSubtle,
                  color: T.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                  userSelect: 'none',
                }}
                aria-hidden="true"
              >
                {note.initials}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
                    {note.author}
                  </span>
                  <span style={{ fontSize: 12, color: T.textMuted }}>
                    {note.date}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: T.textSecondary,
                    lineHeight: 1.55,
                  }}
                >
                  {note.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ObjectDetailsPage() {
  const navigate = useNavigate()

  return (
    <>
      {/* Pulse animation keyframes injected once */}
      <style>{`
        @keyframes revela-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(0,80,181,0.15); }
          50%       { box-shadow: 0 0 0 8px rgba(0,80,181,0.05); }
        }
      `}</style>

      {/* ------------------------------------------------------------------ */}
      {/* Main scrollable content                                             */}
      {/* ------------------------------------------------------------------ */}
      <main
        style={{
          minHeight: '100vh',
          background: T.bg,
          paddingBottom: 120,
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            padding: '0 24px',
          }}
        >

          {/* -------------------------------------------------------------- */}
          {/* Back button                                                      */}
          {/* -------------------------------------------------------------- */}
          <div style={{ paddingTop: 24 }}>
            <button
              onClick={() => navigate('/tasks/a4f2')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
                fontWeight: 400,
                fontFamily: 'inherit',
                background: 'none',
                border: 'none',
                padding: '4px 6px',
                borderRadius: 4,
                color: T.textMuted,
                cursor: 'pointer',
                outline: 'none',
                transition: 'color 120ms, background 120ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = T.accent
                e.currentTarget.style.background = T.accentSubtle
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = T.textMuted
                e.currentTarget.style.background = 'none'
              }}
              aria-label="Назад до списку"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Назад до списку
            </button>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Header: title row + actions                                      */}
          {/* -------------------------------------------------------------- */}
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: `1px solid ${T.border}`,
              paddingBottom: 20,
              marginBottom: 24,
              marginTop: 12,
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            {/* Left side */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 600,
                    color: T.textPrimary,
                    lineHeight: 1.25,
                  }}
                >
                  Кейс #1847
                </h1>
                {/* Severity dot */}
                <span
                  aria-label="Висока критичність"
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: T.danger,
                    border: '1px solid rgba(0,0,0,0.1)',
                    flexShrink: 0,
                  }}
                />
                <ChipDanger>Висока критичність</ChipDanger>
                <ChipInfo>Нова</ChipInfo>
              </div>

              {/* Sub-info */}
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: T.textMuted,
                  lineHeight: 1.55,
                  maxWidth: 660,
                }}
              >
                Власник:{' '}
                <strong style={{ color: T.textSecondary, fontWeight: 600 }}>
                  Грицина Іван Іванович
                </strong>
                {' · '}
                ІПН:{' '}
                <IpnWithTooltip ipn="3556083731" />
                {' · '}
                2 ділянки, 1 будівля
                {' · '}
                Львівська область, Сокальський район, Острівська сільська рада
              </p>
            </div>

            {/* Right side: actions */}
            <div style={{ flexShrink: 0 }}>
              <Actions />
            </div>
          </header>

          {/* -------------------------------------------------------------- */}
          {/* Rule explanation banner                                          */}
          {/* -------------------------------------------------------------- */}
          <div
            role="note"
            aria-label="Пояснення правила"
            style={{
              display: 'flex',
              gap: 12,
              background: T.dangerSubtle,
              borderLeft: `3px solid ${T.danger}`,
              borderRadius: 8,
              border: `1px solid rgba(220,38,38,0.2)`,
              borderLeftWidth: 3,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <AlertTriangle
              size={20}
              style={{ color: T.danger, flexShrink: 0, marginTop: 2 }}
              aria-hidden="true"
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <ChipDangerMono>R01</ChipDangerMono>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: T.dangerDeep,
                  }}
                >
                  Припинене право власності на нерухомість, але активний землекористувач
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: T.dangerDeep,
                  lineHeight: 1.55,
                }}
              >
                За ДРПП право власності на квартиру припинено 07.04.2015. За ДЗК особа досі числиться
                землекористувачем двох ділянок, найпізніший запис — 18.01.2024. Вірогідність
                систематичної помилки або податкового розриву — висока.
              </p>
            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Side-by-side registry cards                                      */}
          {/* -------------------------------------------------------------- */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <LandRegistryCard />
            <EstateRegistryCard />
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Timeline                                                         */}
          {/* -------------------------------------------------------------- */}
          <TimelineSection />

          {/* -------------------------------------------------------------- */}
          {/* Notes                                                            */}
          {/* -------------------------------------------------------------- */}
          <NotesSection />

        </div>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Sticky footer                                                        */}
      {/* ------------------------------------------------------------------ */}
      <footer
        aria-label="Панель дій"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: T.surface,
          borderTop: `1px solid ${T.border}`,
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: T.textMuted,
            whiteSpace: 'nowrap',
          }}
        >
          Кейс створено 18.04.2026 о 14:32 · Оновлено 5 хв тому
        </p>
        <Actions compact />
      </footer>
    </>
  )
}
