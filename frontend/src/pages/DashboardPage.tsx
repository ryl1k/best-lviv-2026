import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';

import {
  getApiErrorMessage,
  tasksApi,
  type DiscrepancyResponse,
  type SummaryResponse,
  type TaskResponse,
} from '@/api';
import { RULES } from '@/data/demo';

type SeverityFilter = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';
type ResolutionFilter = 'ALL' | 'NEW' | 'IN_REVIEW' | 'CONFIRMED' | 'DISMISSED';

const PAGE_SIZE = 50;

const RULE_NAME_BY_CODE = new Map(RULES.map((rule) => [rule.code, rule.name]));

function formatNumber(value: number | undefined): string {
  return (value ?? 0).toLocaleString('uk-UA');
}

function parseTaskState(status: string | undefined): 'pending' | 'done' | 'failed' {
  const normalized = (status ?? '').trim().toLowerCase();

  if (
    normalized.includes('fail') ||
    normalized.includes('error') ||
    normalized.includes('cancel')
  ) {
    return 'failed';
  }

  if (
    normalized.includes('done') ||
    normalized.includes('complete') ||
    normalized.includes('finish') ||
    normalized.includes('success')
  ) {
    return 'done';
  }

  return 'pending';
}

function taskStateLabel(status: string | undefined): string {
  const state = parseTaskState(status);
  if (state === 'done') return 'Завершено';
  if (state === 'failed') return 'Помилка';
  return 'В обробці';
}

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

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getMapCount(map: Record<string, number> | undefined, keys: string[]): number {
  if (!map) return 0;
  for (const key of keys) {
    if (typeof map[key] === 'number') return map[key];
  }
  return 0;
}

function RuleLabel({ code }: { code: string }) {
  const label = RULE_NAME_BY_CODE.get(code);
  if (!label) return <span className="font-mono">{code}</span>;

  return (
    <span className="inline-flex flex-col">
      <span className="font-mono text-[11px] text-[var(--accent)]">{code}</span>
      <span className="text-xs text-landing-ink-soft">{label}</span>
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  note?: string;
}

function MetricCard({ label, value, note }: MetricCardProps) {
  return (
    <div className="border border-landing-border bg-landing-paper p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">{label}</p>
      <p className="mt-2 font-mono text-3xl text-landing-ink">{value}</p>
      {note ? <p className="mt-2 text-sm text-landing-ink-soft">{note}</p> : null}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { id: taskIdParam } = useParams();
  const taskId = taskIdParam ?? '';

  const [task, setTask] = useState<TaskResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [rows, setRows] = useState<DiscrepancyResponse[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [resolutionFilter, setResolutionFilter] = useState<ResolutionFilter>('ALL');
  const [ruleFilter, setRuleFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [taskLoading, setTaskLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const loadTask = useCallback(
    async (withSpinner: boolean) => {
      if (!taskId) return;
      if (withSpinner) setTaskLoading(true);

      try {
        const response = await tasksApi.getTask(taskId);
        setTask(response.data);
        setTaskError(null);
      } catch (error) {
        setTaskError(getApiErrorMessage(error, 'Не вдалося отримати статус завдання.'));
      } finally {
        if (withSpinner) setTaskLoading(false);
      }
    },
    [taskId],
  );

  const loadSummary = useCallback(async () => {
    if (!taskId) return;
    setSummaryLoading(true);

    try {
      const response = await tasksApi.getSummary(taskId);
      setSummary(response.data);
      setSummaryError(null);
    } catch (error) {
      setSummaryError(getApiErrorMessage(error, 'Підсумок аналізу поки недоступний.'));
    } finally {
      setSummaryLoading(false);
    }
  }, [taskId]);

  const loadResults = useCallback(async () => {
    if (!taskId) return;
    setRowsLoading(true);

    try {
      const response = await tasksApi.getResults(taskId, {
        page,
        page_size: PAGE_SIZE,
        severity: severityFilter === 'ALL' ? undefined : severityFilter,
        resolution_status: resolutionFilter === 'ALL' ? undefined : resolutionFilter,
        rule_code: ruleFilter === 'ALL' ? undefined : ruleFilter,
        search: search.trim() || undefined,
      });

      setRows(response.data.items ?? []);
      setTotal(response.data.total ?? 0);
      setPageSize(response.data.page_size || PAGE_SIZE);
      setRowsError(null);
    } catch (error) {
      setRows([]);
      setTotal(0);
      if (parseTaskState(task?.status) === 'pending') {
        setRowsError(null);
      } else {
        setRowsError(getApiErrorMessage(error, 'Не вдалося завантажити список кейсів.'));
      }
    } finally {
      setRowsLoading(false);
    }
  }, [task?.status, taskId, page, resolutionFilter, ruleFilter, search, severityFilter]);

  useEffect(() => {
    if (!taskId) return;
    void loadTask(true);
    void loadSummary();
  }, [loadSummary, loadTask, taskId]);

  const taskState = useMemo(() => parseTaskState(task?.status), [task?.status]);

  useEffect(() => {
    if (!taskId || taskState !== 'pending') return;

    const intervalId = setInterval(() => {
      void loadTask(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [loadTask, taskId, taskState]);

  useEffect(() => {
    if (!taskId) return;
    void loadResults();
  }, [loadResults, taskId]);

  const ruleOptions = useMemo(() => {
    const codesFromSummary = Object.keys(summary?.by_rule ?? {});
    const allCodes = [...new Set([...codesFromSummary, ...RULES.map((rule) => rule.code)])];
    return allCodes.sort((a, b) => a.localeCompare(b));
  }, [summary?.by_rule]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);

  const totalLand = task?.stats?.total_land ?? 0;
  const totalEstate = task?.stats?.total_estate ?? 0;
  const totalProcessed = totalLand + totalEstate;
  const totalDiscrepancies = summary?.total_count ?? task?.stats?.discrepancies_count ?? 0;

  const highCount = getMapCount(summary?.by_severity, ['HIGH', 'high']);
  const mediumCount = getMapCount(summary?.by_severity, ['MEDIUM', 'medium']);
  const lowCount = getMapCount(summary?.by_severity, ['LOW', 'low']);

  const sortedRuleBreakdown = useMemo(
    () => Object.entries(summary?.by_rule ?? {}).sort((a, b) => b[1] - a[1]),
    [summary?.by_rule],
  );

  const handleExport = useCallback(async () => {
    if (!taskId) return;

    setIsExporting(true);
    try {
      const { blob, filename } = await tasksApi.exportTaskCsv(taskId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setRowsError(getApiErrorMessage(error, 'Не вдалося експортувати CSV.'));
    } finally {
      setIsExporting(false);
    }
  }, [taskId]);

  const handleFilterChange = useCallback(() => {
    setPage(1);
  }, []);

  if (!taskId) {
    return (
      <main className="mx-auto max-w-[900px] px-6 py-10 md:px-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          Некоректне посилання: id завдання відсутній.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 md:py-10">
      <div className="space-y-6">
        <section className="border border-landing-border bg-landing-paper p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                Analysis session #{taskId}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-landing-ink md:text-4xl">
                Аналіз розбіжностей
              </h1>
              <p className="mt-2 text-sm text-landing-ink-soft">
                Статус: <span className="font-medium text-landing-ink">{taskStateLabel(task?.status)}</span>
                {' · '}
                Створено: {formatDate(task?.created_at)}
                {' · '}
                Завершено: {formatDate(task?.completed_at)}
              </p>
              {task?.error_message ? (
                <p className="mt-2 text-sm text-red-700">Помилка бекенду: {task.error_message}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-full border border-landing-border-strong px-4 py-2 text-sm text-landing-ink transition-colors hover:bg-landing-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Експорт CSV
              </button>

              <button
                type="button"
                onClick={() => navigate('/upload')}
                className="inline-flex items-center gap-2 rounded-full border border-landing-ink bg-landing-ink px-4 py-2 text-sm text-landing-paper transition-colors hover:bg-landing-ink-soft"
              >
                <Upload size={14} />
                Новий аналіз
              </button>
            </div>
          </div>

          {taskLoading && (
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-landing-ink-soft">
              <Loader2 size={14} className="animate-spin" />
              Оновлюю статус задачі...
            </div>
          )}

          {taskError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {taskError}
            </div>
          )}

          {taskState === 'pending' && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              <Loader2 size={14} className="mt-0.5 animate-spin" />
              Аналіз ще виконується. Дані оновлюються автоматично кожні 5 секунд.
            </div>
          )}

          {taskState === 'failed' && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle size={14} className="mt-0.5" />
              Завдання завершилось з помилкою. Перевірте вхідні дані та запустіть аналіз повторно.
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Оброблено"
            value={formatNumber(totalProcessed)}
            note={`${formatNumber(totalLand)} землі · ${formatNumber(totalEstate)} нерухомості`}
          />
          <MetricCard label="Зіставлено" value={formatNumber(task?.stats?.matched)} note="Власники з валідними зв'язками" />
          <MetricCard label="Розбіжностей" value={formatNumber(totalDiscrepancies)} note="Усього у вибраному завданні" />
          <MetricCard label="HIGH" value={formatNumber(highCount)} note="Високий пріоритет" />
          <MetricCard label="MEDIUM / LOW" value={`${formatNumber(mediumCount)} / ${formatNumber(lowCount)}`} note="Середній / низький" />
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-4 border border-landing-border bg-landing-paper p-4 xl:sticky xl:top-24">
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
                Пошук
              </label>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-landing-muted" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    handleFilterChange();
                  }}
                  placeholder="ІПН, ПІБ, опис"
                  className="w-full rounded-lg border border-landing-border bg-white py-2.5 pl-9 pr-3 text-sm text-landing-ink outline-none transition-colors placeholder:text-landing-muted focus:border-landing-ink"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
                Критичність
              </label>
              <select
                value={severityFilter}
                onChange={(event) => {
                  setSeverityFilter(event.target.value as SeverityFilter);
                  handleFilterChange();
                }}
                className="w-full rounded-lg border border-landing-border bg-white px-3 py-2.5 text-sm text-landing-ink outline-none focus:border-landing-ink"
              >
                <option value="ALL">Всі</option>
                <option value="HIGH">Висока</option>
                <option value="MEDIUM">Середня</option>
                <option value="LOW">Низька</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
                Статус
              </label>
              <select
                value={resolutionFilter}
                onChange={(event) => {
                  setResolutionFilter(event.target.value as ResolutionFilter);
                  handleFilterChange();
                }}
                className="w-full rounded-lg border border-landing-border bg-white px-3 py-2.5 text-sm text-landing-ink outline-none focus:border-landing-ink"
              >
                <option value="ALL">Всі</option>
                <option value="NEW">Нові</option>
                <option value="IN_REVIEW">В роботі</option>
                <option value="CONFIRMED">Підтверджені</option>
                <option value="DISMISSED">Відхилені</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
                Код правила
              </label>
              <select
                value={ruleFilter}
                onChange={(event) => {
                  setRuleFilter(event.target.value);
                  handleFilterChange();
                }}
                className="w-full rounded-lg border border-landing-border bg-white px-3 py-2.5 text-sm text-landing-ink outline-none focus:border-landing-ink"
              >
                <option value="ALL">Всі</option>
                {ruleOptions.map((ruleCode) => (
                  <option key={ruleCode} value={ruleCode}>
                    {ruleCode}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                void loadTask(true);
                void loadSummary();
                void loadResults();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-landing-border-strong px-3 py-2.5 text-sm text-landing-ink transition-colors hover:bg-landing-surface"
            >
              <RefreshCw size={14} />
              Оновити дані
            </button>

            {summaryLoading ? (
              <p className="text-xs text-landing-muted">Оновлюю підсумок...</p>
            ) : null}
            {summaryError ? (
              <p className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-700">{summaryError}</p>
            ) : null}

            {sortedRuleBreakdown.length > 0 && (
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
                  Rule Breakdown
                </p>
                <div className="space-y-1.5">
                  {sortedRuleBreakdown.slice(0, 8).map(([code, count]) => (
                    <div key={code} className="flex items-center justify-between text-xs text-landing-ink-soft">
                      <span className="font-mono">{code}</span>
                      <span>{formatNumber(count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <section className="overflow-hidden border border-landing-border bg-landing-paper">
            <div className="border-b border-landing-border px-5 py-4 md:px-6">
              <h2 className="text-xl font-semibold tracking-tight text-landing-ink">Робоча черга кейсів</h2>
              <p className="mt-1 text-sm text-landing-ink-soft">
                Показано {formatNumber(pageStart)}-{formatNumber(pageEnd)} з {formatNumber(total)}
              </p>
            </div>

            {rowsLoading ? (
              <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-landing-ink-soft">
                <Loader2 size={16} className="animate-spin" />
                Завантажую кейси...
              </div>
            ) : rowsError ? (
              <div className="px-6 py-8 text-sm text-red-700">{rowsError}</div>
            ) : rows.length === 0 ? (
              <div className="px-6 py-10 text-sm text-landing-ink-soft">Кейсів за цими фільтрами не знайдено.</div>
            ) : (
              <>
                <div className="hidden border-b border-landing-border bg-landing-surface px-6 py-3 text-[10px] uppercase tracking-[0.16em] text-landing-muted lg:grid lg:grid-cols-[90px_130px_minmax(160px,1fr)_130px_220px_minmax(240px,1.3fr)_140px_90px]">
                  <span>ID</span>
                  <span>Критичність</span>
                  <span>Власник</span>
                  <span>ІПН</span>
                  <span>Правило</span>
                  <span>Опис</span>
                  <span>Статус</span>
                  <span>Score</span>
                </div>

                <div className="divide-y divide-landing-border">
                  {rows.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => navigate(`/tasks/${taskId}/discrepancies/${row.id}`)}
                      className="w-full text-left transition-colors hover:bg-landing-surface"
                    >
                      <div className="grid gap-3 px-5 py-4 lg:grid-cols-[90px_130px_minmax(160px,1fr)_130px_220px_minmax(240px,1.3fr)_140px_90px] lg:items-start lg:px-6">
                        <div className="font-mono text-xs text-landing-ink">#{row.id}</div>
                        <div>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${severityTone(row.severity)}`}>
                            {severityLabel(row.severity)}
                          </span>
                        </div>
                        <div className="text-sm text-landing-ink">{row.owner_name || '—'}</div>
                        <div className="font-mono text-xs text-landing-ink-soft">{row.tax_id || '—'}</div>
                        <div>
                          <RuleLabel code={row.rule_code} />
                        </div>
                        <div className="text-sm leading-6 text-landing-ink-soft">{row.description || '—'}</div>
                        <div>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${resolutionTone(row.resolution_status)}`}>
                            {resolutionLabel(row.resolution_status)}
                          </span>
                        </div>
                        <div className="font-mono text-sm text-landing-ink">{row.risk_score ?? 0}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-landing-border px-5 py-3 md:px-6">
              <p className="text-sm text-landing-ink-soft">
                Сторінка {page} з {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-landing-border bg-landing-paper text-landing-ink transition-colors hover:bg-landing-surface disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Попередня сторінка"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-landing-border bg-landing-paper text-landing-ink transition-colors hover:bg-landing-surface disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Наступна сторінка"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </section>
        </section>

        {taskState === 'done' && !rowsLoading && !rowsError && rows.length > 0 && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 size={14} />
            Дані аналізу синхронізовані з бекендом.
          </div>
        )}
      </div>
    </main>
  );
}
