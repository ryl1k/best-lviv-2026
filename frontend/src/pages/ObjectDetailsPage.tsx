import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Check,
  ChevronLeft,
  FileJson,
  RefreshCw,
} from 'lucide-react';

import { getApiErrorMessage, tasksApi, type DiscrepancyResponse } from '@/api';
import { getRuleDisplay } from '@/lib/rule-codes';

type ResolutionStatus = 'NEW' | 'IN_REVIEW' | 'CONFIRMED' | 'DISMISSED';

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

function Actions({
  compact = false,
  currentStatus,
  statusUpdating,
  onSetStatus,
}: {
  compact?: boolean;
  currentStatus: ResolutionStatus;
  statusUpdating: ResolutionStatus | null;
  onSetStatus: (status: ResolutionStatus) => void;
}) {
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <button
        type="button"
        disabled={statusUpdating !== null || currentStatus === 'IN_REVIEW'}
        style={{
          ...btnBase,
          background: T.accent,
          color: '#fff',
          borderColor: T.accent,
          opacity: statusUpdating !== null || currentStatus === 'IN_REVIEW' ? 0.6 : 1,
          cursor: statusUpdating !== null || currentStatus === 'IN_REVIEW' ? 'not-allowed' : 'pointer',
        }}
        onClick={() => onSetStatus('IN_REVIEW')}
      >
        <RefreshCw size={compact ? 13 : 14} aria-hidden="true" />
        {t('objectDetails.actions.takeCase')}
      </button>

      <button
        type="button"
        disabled={statusUpdating !== null || currentStatus === 'CONFIRMED'}
        style={{
          ...btnBase,
          background: T.surface,
          color: T.success,
          borderColor: T.success,
          opacity: statusUpdating !== null || currentStatus === 'CONFIRMED' ? 0.6 : 1,
          cursor: statusUpdating !== null || currentStatus === 'CONFIRMED' ? 'not-allowed' : 'pointer',
        }}
        onClick={() => onSetStatus('CONFIRMED')}
      >
        <Check size={compact ? 13 : 14} aria-hidden="true" />
        {t('objectDetails.actions.confirmIssue')}
      </button>

      <button
        type="button"
        disabled={statusUpdating !== null || currentStatus === 'DISMISSED'}
        style={{
          ...btnBase,
          background: 'transparent',
          color: T.danger,
          borderColor: 'transparent',
          opacity: statusUpdating !== null || currentStatus === 'DISMISSED' ? 0.6 : 1,
          cursor: statusUpdating !== null || currentStatus === 'DISMISSED' ? 'not-allowed' : 'pointer',
        }}
        onClick={() => onSetStatus('DISMISSED')}
      >
        <Ban size={compact ? 13 : 14} aria-hidden="true" />
        {t('objectDetails.actions.reject')}
      </button>
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
  const [statusUpdating, setStatusUpdating] = useState<ResolutionStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

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

  const handleSetStatus = useCallback(async (status: ResolutionStatus) => {
    if (!taskId || !isDiscIdValid) return;

    setStatusError(null);
    setStatusUpdating(status);
    try {
      await tasksApi.updateDiscrepancyResolution(taskId, discrepancyId, status);
      await loadDiscrepancy();
    } catch (updateError) {
      setStatusError(getApiErrorMessage(updateError, { context: 'discrepancyStatusUpdate' }));
    } finally {
      setStatusUpdating(null);
    }
  }, [discrepancyId, isDiscIdValid, loadDiscrepancy, taskId]);

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
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px', color: T.textMuted, fontSize: 14 }}>
          Завантажую деталі кейсу...
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

  const currentStatus = (discrepancy.resolution_status ?? 'NEW').toUpperCase() as ResolutionStatus;
  const rule = getRuleDisplay(t, discrepancy.rule_code);

  return (
    <main style={{ minHeight: '100vh', background: T.bg, paddingBottom: 120 }}>
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
                {t('objectDetails.caseTitle', { id: discrepancy.id })}
              </h1>
              <ChipDanger>{severityLabel(discrepancy.severity, t)}</ChipDanger>
              <ChipInfo>{statusLabel(discrepancy.resolution_status, t)}</ChipInfo>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: T.textMuted, lineHeight: 1.55, maxWidth: 660 }}>
              {t('objectDetails.meta.owner')}{' '}
              <strong style={{ color: T.textSecondary, fontWeight: 600 }}>{discrepancy.owner_name || '—'}</strong>
              {' · '}
              {t('objectDetails.meta.taxId')}{' '}
              <strong style={{ color: T.textSecondary, fontWeight: 600 }}>{discrepancy.tax_id || '—'}</strong>
              {' · '}
              {rule.label}
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <Actions
              currentStatus={currentStatus}
              statusUpdating={statusUpdating}
              onSetStatus={(status) => void handleSetStatus(status)}
            />
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
            <div style={{ fontSize: 14, fontWeight: 600, color: T.dangerDeep, marginBottom: 6 }}>{rule.label}</div>
            <p style={{ margin: 0, fontSize: 13, color: T.dangerDeep, lineHeight: 1.55 }}>
              {discrepancy.description || explanation || t('objectDetails.ruleBanner.description')}
            </p>
          </div>
        </div>

        {statusError ? (
          <div style={{ marginBottom: 24, color: T.danger, fontSize: 13 }}>
            {statusError}
          </div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Card>
            <CardHeader>
              <AlertCircle size={16} style={{ color: T.accent, flexShrink: 0 }} aria-hidden="true" />
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                Дані кейсу
              </h2>
            </CardHeader>
            <CardBody>
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
            <CardBody>
              <div style={{ marginTop: 4 }}>
                {detailsEntries.length === 0 ? (
                  <p style={{ margin: '12px 0 0', fontSize: 13, color: T.textMuted }}>
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
          <div style={{ padding: 20 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
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
          Task ID: {taskId} · Discrepancy ID: {discrepancy.id}
        </p>
        <Actions
          compact
          currentStatus={currentStatus}
          statusUpdating={statusUpdating}
          onSetStatus={(status) => void handleSetStatus(status)}
        />
      </footer>
    </main>
  );
}
