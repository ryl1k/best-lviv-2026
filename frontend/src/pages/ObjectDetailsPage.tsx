import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  FileJson,
  Loader2,
} from 'lucide-react';

import { getApiErrorMessage, tasksApi, type DiscrepancyResponse } from '@/api';
import { getRuleDisplay } from '@/lib/rule-codes';

const T = {
  accent: '#0050B5',
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

function severityLabel(value: string | undefined, t: ReturnType<typeof useTranslation>['t']): string {
  const normalized = (value ?? '').toUpperCase();
  if (normalized === 'HIGH') return t('tasks.severity.high');
  if (normalized === 'MEDIUM') return t('tasks.severity.medium');
  if (normalized === 'LOW') return t('tasks.severity.low');
  return value ?? '—';
}

function statusLabel(value: string | undefined, t: ReturnType<typeof useTranslation>['t']): string {
  const normalized = (value ?? '').toUpperCase();
  if (normalized === 'NEW') return t('tasks.status.new');
  if (normalized === 'IN_REVIEW') return t('tasks.status.inReview');
  if (normalized === 'CONFIRMED') return t('tasks.status.confirmed');
  if (normalized === 'DISMISSED') return t('tasks.status.dismissed');
  return value ?? '—';
}

function prettyLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return (
    <pre
      style={{
        margin: 0,
        whiteSpace: 'pre-wrap',
        fontSize: 12,
        lineHeight: 1.6,
        color: T.textSecondary,
        background: T.surfaceMuted,
        borderRadius: 6,
        padding: 10,
        overflowX: 'auto',
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function ChipDanger({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 10,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: T.danger,
        background: 'rgba(220,38,38,0.08)',
        border: '1px solid rgba(220,38,38,0.16)',
        borderRadius: 999,
        padding: '5px 10px',
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
        fontSize: 10,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: T.info,
        background: 'rgba(2,132,199,0.08)',
        border: '1px solid rgba(2,132,199,0.16)',
        borderRadius: 999,
        padding: '5px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function FieldRow({
  label,
  value,
  mono = false,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  mono?: boolean;
}) {
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
          color: T.textPrimary,
          lineHeight: 1.5,
          display: 'block',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
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

export default function ObjectDetailsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id: taskIdParam, discId: discIdParam } = useParams();
  const taskId = taskIdParam ?? '';
  const discrepancyId = Number(discIdParam);
  const isDiscIdValid = Number.isInteger(discrepancyId) && discrepancyId > 0;
  const hasValidRouteParams = Boolean(taskId) && isDiscIdValid;

  const [discrepancy, setDiscrepancy] = useState<DiscrepancyResponse | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  const loadDiscrepancy = useCallback(async () => {
    if (!taskId || !isDiscIdValid) return;

    setLoading(true);
    setError(null);

    const [discrepancyResult, explanationResult] = await Promise.allSettled([
      tasksApi.getDiscrepancy(taskId, discrepancyId),
      tasksApi.getDiscrepancyExplanation(taskId, discrepancyId),
    ]);

    if (discrepancyResult.status === 'fulfilled') {
      setDiscrepancy(discrepancyResult.value.data);
    } else {
      setDiscrepancy(null);
      setError(getApiErrorMessage(discrepancyResult.reason, { context: 'discrepancyLoad' }));
    }

    if (explanationResult.status === 'fulfilled') {
      const text = explanationResult.value.data.explanation?.trim();
      setExplanation(text && text.length > 0 ? text : null);
      setExplanationError(null);
    } else {
      setExplanation(null);
      setExplanationError(getApiErrorMessage(explanationResult.reason, { context: 'discrepancyExplanation' }));
    }

    setLoading(false);
  }, [discrepancyId, isDiscIdValid, taskId]);

  useEffect(() => {
    if (!hasValidRouteParams) return;

    const timerId = window.setTimeout(() => {
      void loadDiscrepancy();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [hasValidRouteParams, loadDiscrepancy]);

  const detailsEntries = useMemo(() => {
    const details = discrepancy?.details;
    if (!isRecord(details)) return [];
    return Object.entries(details);
  }, [discrepancy?.details]);

  if (!hasValidRouteParams) {
    return (
      <main style={{ minHeight: '100vh', background: T.bg }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ color: T.danger, fontSize: 14 }}>
            Некоректне посилання: id задачі або id кейсу відсутній.
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: T.bg }}>
        <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}.sk{background:linear-gradient(90deg,${T.border} 25%,${T.surfaceMuted} 50%,${T.border} 75%);background-size:800px 100%;animation:shimmer 1.4s infinite linear;border-radius:4px;}`}</style>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
          {/* back button placeholder */}
          <div style={{ paddingTop: 24, marginBottom: 12 }}>
            <div className="sk" style={{ width: 80, height: 22 }} />
          </div>

          {/* header */}
          <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 24, marginBottom: 28 }}>
            <div className="sk" style={{ width: 120, height: 12, marginBottom: 14 }} />
            <div className="sk" style={{ width: 260, height: 30, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div className="sk" style={{ width: 72, height: 22, borderRadius: 999 }} />
              <div className="sk" style={{ width: 72, height: 22, borderRadius: 999 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px', background: T.surface }}>
                  <div className="sk" style={{ width: 60, height: 10, marginBottom: 10 }} />
                  <div className="sk" style={{ width: '80%', height: 16 }} />
                </div>
              ))}
            </div>
          </div>

          {/* rule banner */}
          <div style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.10)', borderRadius: 12, padding: '18px 20px', marginBottom: 28 }}>
            <div className="sk" style={{ width: 100, height: 10, marginBottom: 10 }} />
            <div className="sk" style={{ width: 220, height: 18, marginBottom: 10 }} />
            <div className="sk" style={{ width: '70%', height: 14 }} />
          </div>

          {/* cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: 18, marginBottom: 28 }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}` }}>
                  <div className="sk" style={{ width: 120, height: 14 }} />
                </div>
                <div style={{ padding: '12px 20px 20px' }}>
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <div key={j} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
                      <div className="sk" style={{ width: '70%', height: 11 }} />
                      <div className="sk" style={{ width: '60%', height: 13 }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* explanation card */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 20px 22px', marginBottom: 24 }}>
            <div className="sk" style={{ width: 100, height: 10, marginBottom: 10 }} />
            <div className="sk" style={{ width: 200, height: 20, marginBottom: 16 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="sk" style={{ width: '90%', height: 14 }} />
              <div className="sk" style={{ width: '75%', height: 14 }} />
              <div className="sk" style={{ width: '55%', height: 14 }} />
            </div>
          </div>

          {/* spinner overlay hint */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 32px', color: T.textDisabled, gap: 8, alignItems: 'center', fontSize: 13 }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Завантаження…
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </main>
    );
  }

  if (error || !discrepancy) {
    return (
      <main style={{ minHeight: '100vh', background: T.bg }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px' }}>
          <button
            onClick={() => navigate(taskId ? `/tasks/${taskId}` : '/upload')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              background: 'none',
              border: 'none',
              color: T.textMuted,
              cursor: 'pointer',
              padding: '4px 6px',
              marginBottom: 16,
            }}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            {t('objectDetails.back')}
          </button>
          <div style={{ color: T.danger, fontSize: 14 }}>{error ?? 'Кейс не знайдено'}</div>
        </div>
      </main>
    );
  }

  const rule = getRuleDisplay(t, discrepancy.rule_code);

  return (
    <main style={{ minHeight: '100vh', background: T.bg }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ paddingTop: 24 }}>
          <button
            onClick={() => navigate(`/tasks/${taskId}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              fontFamily: 'inherit',
              background: 'none',
              border: 'none',
              padding: '4px 6px',
              borderRadius: 4,
              color: T.textMuted,
              cursor: 'pointer',
            }}
            aria-label={t('objectDetails.backAria')}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            {t('objectDetails.back')}
          </button>
        </div>

        <header
          style={{
            borderBottom: `1px solid ${T.border}`,
            paddingBottom: 24,
            marginBottom: 28,
            marginTop: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 860 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.textMuted, fontWeight: 600 }}>
              Discrepancy detail
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: 30, fontWeight: 600, color: T.textPrimary, lineHeight: 1.15 }}>
                  {t('objectDetails.caseTitle', { id: discrepancy.id })}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <ChipDanger>{severityLabel(discrepancy.severity, t)}</ChipDanger>
                  <ChipInfo>{statusLabel(discrepancy.resolution_status, t)}</ChipInfo>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))',
                  gap: 12,
                  minWidth: 280,
                  maxWidth: 360,
                  width: '100%',
                }}
              >
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px', background: T.surface }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.textMuted, marginBottom: 6 }}>
                    Task ID
                  </div>
                  <div style={{ fontSize: 13, color: T.textSecondary, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{taskId}</div>
                </div>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px', background: T.surface }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.textMuted, marginBottom: 6 }}>
                    Discrepancy ID
                  </div>
                  <div style={{ fontSize: 13, color: T.textSecondary, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{discrepancy.id}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px', background: T.surface }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.textMuted, marginBottom: 8 }}>
                  Owner
                </div>
                <div style={{ fontSize: 15, color: T.textPrimary, lineHeight: 1.5 }}>{discrepancy.owner_name || '—'}</div>
              </div>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px', background: T.surface }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.textMuted, marginBottom: 8 }}>
                  Tax ID
                </div>
                <div style={{ fontSize: 15, color: T.textPrimary, lineHeight: 1.5, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                  {discrepancy.tax_id || '—'}
                </div>
              </div>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px', background: T.surface }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.textMuted, marginBottom: 8 }}>
                  Rule
                </div>
                <div style={{ fontSize: 15, color: T.textPrimary, lineHeight: 1.5 }}>{rule.label}</div>
              </div>
            </div>
          </div>
        </header>

        <div
          role="note"
          aria-label={t('objectDetails.ruleBanner.aria')}
          style={{
            display: 'flex',
            gap: 14,
            background: 'linear-gradient(180deg, rgba(220,38,38,0.06) 0%, rgba(220,38,38,0.03) 100%)',
            borderRadius: 12,
            border: '1px solid rgba(220,38,38,0.12)',
            padding: '18px 20px',
            marginBottom: 28,
          }}
        >
          <AlertTriangle size={18} style={{ color: T.danger, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.danger, marginBottom: 8, fontWeight: 700 }}>
              Case summary
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.dangerDeep, marginBottom: 8, lineHeight: 1.4 }}>{rule.label}</div>
            <p style={{ margin: 0, fontSize: 14, color: T.dangerDeep, lineHeight: 1.7, maxWidth: 860 }}>
              {discrepancy.description || explanation || t('objectDetails.ruleBanner.description')}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 18,
            marginBottom: 28,
          }}
        >
          <Card>
            <CardHeader>
              <AlertCircle size={16} style={{ color: T.accent, flexShrink: 0 }} aria-hidden="true" />
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                Дані кейсу
              </h2>
            </CardHeader>
            <CardBody style={{ paddingTop: 6 }}>
              <div style={{ marginTop: 4 }}>
                <FieldRow label="Owner" value={discrepancy.owner_name || '—'} />
                <FieldRow label="Tax ID" value={discrepancy.tax_id || '—'} mono />
                <FieldRow label="Rule" value={rule.label} />
                <FieldRow label="Severity" value={severityLabel(discrepancy.severity, t)} />
                <FieldRow label="Status" value={statusLabel(discrepancy.resolution_status, t)} />
                <FieldRow label="Risk score" value={String(discrepancy.risk_score ?? 0)} mono />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <FileJson size={16} style={{ color: T.accent, flexShrink: 0 }} aria-hidden="true" />
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                Деталі з API
              </h2>
            </CardHeader>
            <CardBody style={{ paddingTop: 6 }}>
              <div style={{ marginTop: 4 }}>
                {detailsEntries.length === 0 ? (
                  <p style={{ margin: '12px 0 0', fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
                    Додаткові поля у `details` не надані бекендом.
                  </p>
                ) : (
                  detailsEntries.map(([key, value]) => (
                    <FieldRow key={key} label={prettyLabel(key)} value={renderValue(value)} mono={typeof value === 'string'} />
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <Card style={{ marginBottom: 24 }}>
          <div style={{ padding: '20px 20px 22px' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.textMuted, marginBottom: 10, fontWeight: 600 }}>
              Explanation
            </div>
            <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, color: T.textPrimary, lineHeight: 1.25 }}>
              Пояснення правила
            </h2>
            {explanation ? (
              <p style={{ margin: 0, fontSize: 14, color: T.textSecondary, lineHeight: 1.65 }}>
                {explanation}
              </p>
            ) : explanationError ? (
              <p style={{ margin: 0, fontSize: 13, color: T.warning, lineHeight: 1.6 }}>
                {explanationError}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
                AI-пояснення відсутнє для цього кейсу.
              </p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
