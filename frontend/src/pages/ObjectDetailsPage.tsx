import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  FileJson,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';

import { getApiErrorMessage, tasksApi, type DiscrepancyResponse } from '@/api';

type ResolutionStatus = 'NEW' | 'IN_REVIEW' | 'CONFIRMED' | 'DISMISSED';

function severityLabel(value: string | undefined): string {
  const normalized = (value ?? '').toUpperCase();
  if (normalized === 'HIGH') return 'Висока';
  if (normalized === 'MEDIUM') return 'Середня';
  if (normalized === 'LOW') return 'Низька';
  return value ?? '—';
}

function severityTone(value: string | undefined): string {
  const normalized = (value ?? '').toUpperCase();
  if (normalized === 'HIGH') return 'text-red-700 bg-red-50 border-red-200';
  if (normalized === 'MEDIUM') return 'text-amber-700 bg-amber-50 border-amber-200';
  if (normalized === 'LOW') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  return 'text-slate-700 bg-slate-50 border-slate-200';
}

function resolutionLabel(value: string | undefined): string {
  const normalized = (value ?? '').toUpperCase();
  if (normalized === 'NEW') return 'Нова';
  if (normalized === 'IN_REVIEW') return 'В роботі';
  if (normalized === 'CONFIRMED') return 'Підтверджено';
  if (normalized === 'DISMISSED') return 'Відхилено';
  return value ?? '—';
}

function resolutionTone(value: string | undefined): string {
  const normalized = (value ?? '').toUpperCase();
  if (normalized === 'NEW') return 'text-blue-700 bg-blue-50 border-blue-200';
  if (normalized === 'IN_REVIEW') return 'text-amber-700 bg-amber-50 border-amber-200';
  if (normalized === 'CONFIRMED') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (normalized === 'DISMISSED') return 'text-zinc-700 bg-zinc-100 border-zinc-200';
  return 'text-slate-700 bg-slate-50 border-slate-200';
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

function renderPrimitive(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value || '—';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

export default function ObjectDetailsPage() {
  const navigate = useNavigate();
  const { id: taskIdParam, discId: discIdParam } = useParams();

  const taskId = taskIdParam ?? '';
  const discrepancyId = Number(discIdParam);
  const isDiscIdValid = Number.isInteger(discrepancyId) && discrepancyId > 0;

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
    setStatusError(null);

    const [discrepancyResult, explanationResult] = await Promise.allSettled([
      tasksApi.getDiscrepancy(taskId, discrepancyId),
      tasksApi.getDiscrepancyExplanation(taskId, discrepancyId),
    ]);

    if (discrepancyResult.status === 'fulfilled') {
      setDiscrepancy(discrepancyResult.value.data);
    } else {
      setError(getApiErrorMessage(discrepancyResult.reason, 'Не вдалося отримати дані кейсу.'));
      setDiscrepancy(null);
    }

    if (explanationResult.status === 'fulfilled') {
      const text = explanationResult.value.data.explanation?.trim();
      setExplanation(text && text.length > 0 ? text : null);
      setExplanationError(null);
    } else {
      setExplanation(null);
      setExplanationError(getApiErrorMessage(explanationResult.reason, 'AI-пояснення тимчасово недоступне.'));
    }

    setLoading(false);
  }, [discrepancyId, isDiscIdValid, taskId]);

  useEffect(() => {
    if (!taskId || !isDiscIdValid) {
      setLoading(false);
      setError('Некоректне посилання: id задачі або id кейсу відсутній.');
      return;
    }

    void loadDiscrepancy();
  }, [isDiscIdValid, loadDiscrepancy, taskId]);

  const detailsEntries = useMemo(() => {
    const details = discrepancy?.details;
    if (!isRecord(details)) return [];
    return Object.entries(details);
  }, [discrepancy?.details]);

  const handleSetStatus = useCallback(
    async (status: ResolutionStatus) => {
      if (!taskId || !isDiscIdValid) return;

      setStatusError(null);
      setStatusUpdating(status);
      try {
        await tasksApi.updateDiscrepancyResolution(taskId, discrepancyId, status);
        await loadDiscrepancy();
      } catch (updateError) {
        setStatusError(getApiErrorMessage(updateError, 'Не вдалося оновити статус кейсу.'));
      } finally {
        setStatusUpdating(null);
      }
    },
    [discrepancyId, isDiscIdValid, loadDiscrepancy, taskId],
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-[1100px] px-6 py-10 md:px-10">
        <div className="flex items-center gap-2 rounded-xl border border-landing-border bg-landing-paper px-4 py-4 text-sm text-landing-ink-soft">
          <Loader2 size={16} className="animate-spin" />
          Завантажую деталі кейсу...
        </div>
      </main>
    );
  }

  if (error || !discrepancy) {
    return (
      <main className="mx-auto max-w-[1100px] px-6 py-10 md:px-10">
        <button
          type="button"
          onClick={() => navigate(taskId ? `/tasks/${taskId}` : '/upload')}
          className="mb-4 inline-flex items-center gap-1 text-sm text-landing-ink-soft transition-colors hover:text-landing-ink"
        >
          <ArrowLeft size={14} /> Назад
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? 'Кейс не знайдено'}
        </div>
      </main>
    );
  }

  const currentStatus = (discrepancy.resolution_status ?? 'NEW').toUpperCase() as ResolutionStatus;

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-8 md:px-10">
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate(`/tasks/${taskId}`)}
          className="inline-flex items-center gap-1 text-sm text-landing-ink-soft transition-colors hover:text-landing-ink"
        >
          <ArrowLeft size={14} /> Назад до списку
        </button>

        <section className="border border-landing-border bg-landing-paper p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">Case #{discrepancy.id}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-landing-ink md:text-4xl">Деталі кейсу</h1>
              <p className="mt-2 text-sm text-landing-ink-soft">
                Власник: <span className="font-medium text-landing-ink">{discrepancy.owner_name || '—'}</span>
                {' · '}
                ІПН: <span className="font-mono">{discrepancy.tax_id || '—'}</span>
                {' · '}
                Rule: <span className="font-mono">{discrepancy.rule_code || '—'}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${severityTone(discrepancy.severity)}`}>
                {severityLabel(discrepancy.severity)} критичність
              </span>
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${resolutionTone(discrepancy.resolution_status)}`}>
                {resolutionLabel(discrepancy.resolution_status)}
              </span>
              <span className="inline-flex rounded-full border border-landing-border px-2.5 py-1 font-mono text-xs text-landing-ink">
                Risk {discrepancy.risk_score ?? 0}
              </span>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-landing-border bg-landing-surface p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">Опис кейсу</p>
            <p className="mt-2 text-sm leading-6 text-landing-ink">{discrepancy.description || 'Опис відсутній.'}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={statusUpdating !== null || currentStatus === 'IN_REVIEW'}
              onClick={() => void handleSetStatus('IN_REVIEW')}
              className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {statusUpdating === 'IN_REVIEW' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              В роботу
            </button>
            <button
              type="button"
              disabled={statusUpdating !== null || currentStatus === 'CONFIRMED'}
              onClick={() => void handleSetStatus('CONFIRMED')}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {statusUpdating === 'CONFIRMED' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Підтвердити
            </button>
            <button
              type="button"
              disabled={statusUpdating !== null || currentStatus === 'DISMISSED'}
              onClick={() => void handleSetStatus('DISMISSED')}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {statusUpdating === 'DISMISSED' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
              Відхилити
            </button>
            <button
              type="button"
              disabled={statusUpdating !== null || currentStatus === 'NEW'}
              onClick={() => void handleSetStatus('NEW')}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {statusUpdating === 'NEW' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Повернути в NEW
            </button>
          </div>

          {statusError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{statusError}</div>
          ) : null}
        </section>

        <section className="rounded-xl border border-landing-border bg-landing-paper p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-[var(--danger)]" />
            <h2 className="text-lg font-semibold text-landing-ink">Пояснення правила</h2>
          </div>

          {explanation ? (
            <p className="text-sm leading-7 text-landing-ink">{explanation}</p>
          ) : explanationError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{explanationError}</div>
          ) : (
            <p className="text-sm text-landing-ink-soft">AI-пояснення відсутнє для цього кейсу.</p>
          )}
        </section>

        <section className="rounded-xl border border-landing-border bg-landing-paper p-5">
          <div className="mb-3 flex items-center gap-2">
            <FileJson size={16} className="text-landing-muted" />
            <h2 className="text-lg font-semibold text-landing-ink">Деталі з API (`details`)</h2>
          </div>

          {detailsEntries.length === 0 ? (
            <p className="text-sm text-landing-ink-soft">Додаткові поля у `details` не надані бекендом.</p>
          ) : (
            <div className="space-y-3">
              {detailsEntries.map(([key, value]) => (
                <div key={key} className="rounded-lg border border-landing-border p-3">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">{prettyLabel(key)}</p>
                  {isRecord(value) || Array.isArray(value) ? (
                    <pre className="overflow-auto rounded-md bg-landing-surface p-3 text-xs leading-6 text-landing-ink-soft">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-landing-ink">{renderPrimitive(value)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="rounded-xl border border-landing-border bg-landing-paper p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">Технічні ідентифікатори</p>
          <p className="mt-2 text-sm text-landing-ink-soft">
            Task ID: <span className="font-mono text-landing-ink">{discrepancy.task_id || taskId}</span>
            {' · '}
            Discrepancy ID: <span className="font-mono text-landing-ink">{discrepancy.id}</span>
          </p>
        </div>

        {explanationError && !explanation && (
          <div className="inline-flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <AlertCircle size={14} className="mt-0.5" />
            Список даних кейсу доступний повністю, але сервіс AI-пояснення повернув помилку.
          </div>
        )}
      </div>
    </main>
  );
}
