import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Building2,
  Check,
  ChevronLeft,
  Map,
  Plus,
} from 'lucide-react';

interface LandRecord {
  cadastralNumber: string;
  purpose: string;
  location: string;
  areaHa: string;
  normativeValue: string;
  registeredAt: string;
  owner: string;
}

interface EstateRecord {
  objectType: string;
  address: string;
  areaM2: string;
  registeredAt: string;
  terminatedAt: string;
  owner: string;
  ownershipShare: string;
}

interface TimelineEvent {
  date: string;
  description: string;
  source: 'drpp' | 'dzk';
  type: 'normal' | 'danger' | 'active';
}

interface Note {
  initials: string;
  author: string;
  date: string;
  text: string;
}

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
  surface: '#FFFFFF',
  surfaceMuted: '#F4F4F5',
  bg: '#FAFAFA',
  border: '#E4E4E7',
  borderStrong: '#D4D4D8',
  textPrimary: '#0A0A0A',
  textSecondary: '#3F3F46',
  textMuted: '#71717A',
  textDisabled: '#A1A1AA',
} as const;

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
        border: '1px solid rgba(220,38,38,0.25)',
        borderRadius: 4,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
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
        border: '1px solid rgba(2,132,199,0.25)',
        borderRadius: 4,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
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
  );
}

function ChipSource({ source }: { source: 'drpp' | 'dzk' }) {
  const { t } = useTranslation();
  const isDrpp = source === 'drpp';

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
      {isDrpp ? t('objectDetails.sources.drpp') : t('objectDetails.sources.dzk')}
    </span>
  );
}

function ChipConflict() {
  const { t } = useTranslation();

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
      {t('objectDetails.conflict')}
    </span>
  );
}

function ConflictDot() {
  const { t } = useTranslation();

  return (
    <span
      title={t('objectDetails.conflictTooltip')}
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
  );
}

interface FieldRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
  conflictChip?: boolean;
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

      <span
        style={{
          fontSize: 13,
          fontFamily: mono ? "'JetBrains Mono', ui-monospace, monospace" : 'inherit',
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
        {highlight ? <AlertCircle size={13} style={{ color: T.danger, flexShrink: 0 }} aria-hidden="true" /> : null}
        {value}
        {conflictChip ? <ChipConflict /> : null}
      </span>
    </div>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
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
  );
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
  );
}

function CardBody({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ padding: '0 20px 20px', ...style }}>
      {children}
    </div>
  );
}

function Actions({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
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
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        style={{
          ...btnBase,
          background: T.accent,
          color: '#fff',
          borderColor: T.accent,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = T.accentHover;
          e.currentTarget.style.borderColor = T.accentHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = T.accent;
          e.currentTarget.style.borderColor = T.accent;
        }}
        aria-label={t('objectDetails.actions.takeCaseAria')}
      >
        {t('objectDetails.actions.takeCase')}
      </button>

      <button
        style={{
          ...btnBase,
          background: T.surface,
          color: T.success,
          borderColor: T.success,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = T.successSubtle;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = T.surface;
        }}
        aria-label={t('objectDetails.actions.confirmIssueAria')}
      >
        <Check size={compact ? 13 : 14} aria-hidden="true" />
        {t('objectDetails.actions.confirmIssue')}
      </button>

      <button
        style={{
          ...btnBase,
          background: 'transparent',
          color: T.danger,
          borderColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = T.dangerSubtle;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
        aria-label={t('objectDetails.actions.rejectCaseAria')}
      >
        <Ban size={compact ? 13 : 14} aria-hidden="true" />
        {t('objectDetails.actions.reject')}
      </button>
    </div>
  );
}

function IpnWithTooltip({ ipn }: { ipn: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(ipn).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleCopy}
        title={copied ? t('objectDetails.ipn.copied') : t('objectDetails.ipn.copy')}
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
  );
}

function LandRegistryCard({ records }: { records: LandRecord[] }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const record = records[activeTab];

  return (
    <Card>
      <CardHeader>
        <Map size={16} style={{ color: T.accent, flexShrink: 0 }} aria-hidden="true" />
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
          {t('objectDetails.cards.landRegistry')}
        </h2>
      </CardHeader>

      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: `1px solid ${T.border}`,
          padding: '0 20px',
        }}
      >
        {records.map((_, idx) => (
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
            {t('objectDetails.cards.parcelTab', { index: idx + 1 })}
          </button>
        ))}
      </div>

      <CardBody>
        <div style={{ marginTop: 4 }}>
          <FieldRow label={t('objectDetails.fields.cadastralNumber')} value={record.cadastralNumber} mono />
          <FieldRow label={t('objectDetails.fields.purpose')} value={record.purpose} />
          <FieldRow label={t('objectDetails.fields.location')} value={record.location} />
          <FieldRow label={t('objectDetails.fields.areaHa')} value={record.areaHa} mono />
          <FieldRow label={t('objectDetails.fields.normativeValue')} value={record.normativeValue} mono />
          <FieldRow label={t('objectDetails.fields.registrationDate')} value={record.registeredAt} mono />
          <FieldRow
            label={(
              <>
                {t('objectDetails.fields.landUser')}
                <ConflictDot />
              </>
            )}
            value={record.owner}
          />
        </div>
      </CardBody>
    </Card>
  );
}

function EstateRegistryCard({ record }: { record: EstateRecord }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <Building2 size={16} style={{ color: T.accent, flexShrink: 0 }} aria-hidden="true" />
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
          {t('objectDetails.cards.estateRegistry')}
        </h2>
      </CardHeader>

      <CardBody>
        <div style={{ marginTop: 4 }}>
          <FieldRow label={t('objectDetails.fields.objectType')} value={record.objectType} />
          <FieldRow label={t('objectDetails.fields.address')} value={record.address} />
          <FieldRow label={t('objectDetails.fields.areaM2')} value={record.areaM2} mono />
          <FieldRow label={t('objectDetails.fields.registrationDate')} value={record.registeredAt} mono />
          <FieldRow label={t('objectDetails.fields.terminationDate')} value={record.terminatedAt} mono highlight />
          <FieldRow
            label={(
              <>
                {t('objectDetails.fields.owner')}
                <ConflictDot />
              </>
            )}
            value={record.owner}
            conflictChip
          />
          <FieldRow label={t('objectDetails.fields.ownershipShare')} value={record.ownershipShare} mono />
        </div>
      </CardBody>
    </Card>
  );
}

function TimelineSection({ events }: { events: TimelineEvent[] }) {
  const { t } = useTranslation();

  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ padding: 20 }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
          {t('objectDetails.timeline.title')}
        </h2>

        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label={t('objectDetails.timeline.aria')}>
          {events.map((event, idx) => {
            const isLast = idx === events.length - 1;

            let dotBg: string = T.textDisabled;
            let dotBoxShadow = 'none';
            let dotAnimation = 'none';

            if (event.type === 'danger') dotBg = T.danger;
            if (event.type === 'active') {
              dotBg = T.accent;
              dotBoxShadow = '0 0 0 4px rgba(0,80,181,0.15)';
              dotAnimation = 'revela-pulse 2s ease-in-out infinite';
            }

            return (
              <li key={`${event.date}-${idx}`} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                {!isLast ? (
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
                ) : null}

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

                <div style={{ paddingBottom: isLast ? 0 : 20, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: 13,
                        fontWeight: 500,
                        color: event.type === 'danger' ? T.danger : T.textSecondary,
                      }}
                    >
                      {event.date}
                    </span>
                    <ChipSource source={event.source} />
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: T.textSecondary, lineHeight: 1.45 }}>
                    {event.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}

function NotesSection({ notes }: { notes: Note[] }) {
  const { t } = useTranslation();
  const [noteText, setNoteText] = useState('');

  return (
    <Card>
      <div style={{ padding: 20 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
          {t('objectDetails.notes.title')}
        </h2>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={t('objectDetails.notes.placeholder')}
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
            e.currentTarget.style.borderColor = T.accent;
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,80,181,0.12)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.boxShadow = 'none';
          }}
          aria-label={t('objectDetails.notes.aria')}
        />

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
            {t('objectDetails.notes.add')}
          </button>
        </div>

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
            {t('objectDetails.notes.history', { count: notes.length })}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {notes.map((note, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
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

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
                    {note.author}
                  </span>
                  <span style={{ fontSize: 12, color: T.textMuted }}>
                    {note.date}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: T.textSecondary, lineHeight: 1.55 }}>
                  {note.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function ObjectDetailsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const landRecords = useMemo<LandRecord[]>(() => ([
    {
      cadastralNumber: '4624884200:05:000:0009',
      purpose: t('objectDetails.land.records.0.purpose'),
      location: t('objectDetails.land.records.0.location'),
      areaHa: '0.1200',
      normativeValue: '47 328,00 ₴',
      registeredAt: '18.01.2024',
      owner: 'Грицина Іван Іванович',
    },
    {
      cadastralNumber: '4624884200:05:000:0134',
      purpose: t('objectDetails.land.records.1.purpose'),
      location: t('objectDetails.land.records.1.location'),
      areaHa: '0.2500',
      normativeValue: '125 400,00 ₴',
      registeredAt: '14.02.2013',
      owner: 'Грицина Іван Іванович',
    },
  ]), [t]);

  const estateRecord = useMemo<EstateRecord>(() => ({
    objectType: t('objectDetails.estate.objectType'),
    address: t('objectDetails.estate.address'),
    areaM2: '68.40',
    registeredAt: '14.02.2013',
    terminatedAt: '07.04.2015',
    owner: 'Грицина І. І.',
    ownershipShare: '1/1',
  }), [t]);

  const timelineEvents = useMemo<TimelineEvent[]>(() => ([
    {
      date: '14.02.2013',
      description: t('objectDetails.timeline.events.0'),
      source: 'drpp',
      type: 'normal',
    },
    {
      date: '07.04.2015',
      description: t('objectDetails.timeline.events.1'),
      source: 'drpp',
      type: 'danger',
    },
    {
      date: '18.01.2024',
      description: t('objectDetails.timeline.events.2'),
      source: 'dzk',
      type: 'active',
    },
  ]), [t]);

  const notes = useMemo<Note[]>(() => ([
    {
      initials: 'АК',
      author: 'Анна Ковальчук',
      date: '18.04.2026, 14:45',
      text: t('objectDetails.notes.items.0'),
    },
    {
      initials: 'МШ',
      author: 'Михайло Шевченко',
      date: '17.04.2026, 11:12',
      text: t('objectDetails.notes.items.1'),
    },
  ]), [t]);

  return (
    <>
      <style>{`
        @keyframes revela-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(0,80,181,0.15); }
          50% { box-shadow: 0 0 0 8px rgba(0,80,181,0.05); }
        }
      `}</style>

      <main style={{ minHeight: '100vh', background: T.bg, paddingBottom: 120 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
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
                e.currentTarget.style.color = T.accent;
                e.currentTarget.style.background = T.accentSubtle;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = T.textMuted;
                e.currentTarget.style.background = 'none';
              }}
              aria-label={t('objectDetails.backAria')}
            >
              <ChevronLeft size={16} aria-hidden="true" />
              {t('objectDetails.back')}
            </button>
          </div>

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: T.textPrimary, lineHeight: 1.25 }}>
                  {t('objectDetails.caseTitle', { id: 1847 })}
                </h1>
                <span
                  aria-label={t('tasks.severity.high')}
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
                <ChipDanger>{t('tasks.severity.high')}</ChipDanger>
                <ChipInfo>{t('tasks.status.new')}</ChipInfo>
              </div>

              <p style={{ margin: 0, fontSize: 13, color: T.textMuted, lineHeight: 1.55, maxWidth: 660 }}>
                {t('objectDetails.meta.owner')}{' '}
                <strong style={{ color: T.textSecondary, fontWeight: 600 }}>Грицина Іван Іванович</strong>
                {' · '}
                {t('objectDetails.meta.taxId')}{' '}
                <IpnWithTooltip ipn="3556083731" />
                {' · '}
                {t('objectDetails.meta.assets')}
                {' · '}
                {t('objectDetails.meta.location')}
              </p>
            </div>

            <div style={{ flexShrink: 0 }}>
              <Actions />
            </div>
          </header>

          <div
            role="note"
            aria-label={t('objectDetails.ruleBanner.aria')}
            style={{
              display: 'flex',
              gap: 12,
              background: T.dangerSubtle,
              borderLeft: `3px solid ${T.danger}`,
              borderRadius: 8,
              border: '1px solid rgba(220,38,38,0.2)',
              borderLeftWidth: 3,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <AlertTriangle size={20} style={{ color: T.danger, flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <ChipDangerMono>R01</ChipDangerMono>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.dangerDeep }}>
                  {t('objectDetails.ruleBanner.title')}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: T.dangerDeep, lineHeight: 1.55 }}>
                {t('objectDetails.ruleBanner.description')}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <LandRegistryCard records={landRecords} />
            <EstateRegistryCard record={estateRecord} />
          </div>

          <TimelineSection events={timelineEvents} />
          <NotesSection notes={notes} />
        </div>
      </main>

      <footer
        aria-label={t('objectDetails.footer.aria')}
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
        <p style={{ margin: 0, fontSize: 13, color: T.textMuted, whiteSpace: 'nowrap' }}>
          {t('objectDetails.footer.meta')}
        </p>
        <Actions compact />
      </footer>
    </>
  );
}
