import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useNavigate, useParams } from 'react-router';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Info,
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
import {
  RULES,
  formatNumber,
  type ResolutionStatus,
  type Severity,
} from '@/data/demo';

interface DashboardRow {
  id: number;
  severity: Severity;
  ownerName: string;
  taxId: string;
  ruleCode: string;
  ruleName: string;
  description: string;
  status: ResolutionStatus;
}

type StatusFilter = 'ALL' | 'NEW' | 'IN_REVIEW' | 'CONFIRMED' | 'DISMISSED';

interface FilterState {
  severities: Set<Severity>;
  rules: Set<string>;
  statusFilter: StatusFilter;
  search: string;
}

interface FilterRailProps {
  filters: FilterState;
  activeFilterCount: number;
  severityCounts: Record<Severity, number>;
  ruleOptions: Array<{ code: string; count: number }>;
  onToggleSev: (severity: Severity) => void;
  onToggleRule: (code: string) => void;
  onStatus: (status: StatusFilter) => void;
  onSearch: (value: string) => void;
  onReset: () => void;
}

interface TableProps {
  rows: DashboardRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  taskId: string;
  rowsLoading: boolean;
  rowsError: string | null;
  isExporting: boolean;
  onPageChange: (page: number) => void;
  onExport: () => void;
}

interface SummaryMetricsProps {
  processed: number;
  totalLand: number;
  totalEstate: number;
  matched: number;
  discrepancies: number;
  high: number;
  medium: number;
  low: number;
  summaryError: string | null;
}

const PAGE_SIZE = 50;
const FETCH_PAGE_SIZE = 500;
const DESKTOP_TABLE_GRID = '112px minmax(220px,1.15fr) minmax(220px,0.95fr) minmax(320px,1.45fr) 120px';

const SEVERITY_TONES: Record<Severity, { dot: string; text: string; bar: string }> = {
  HIGH: {
    dot: 'oklch(0.58 0.10 26)',
    text: 'oklch(0.34 0.03 26)',
    bar: 'oklch(0.70 0.05 26)',
  },
  MEDIUM: {
    dot: 'oklch(0.66 0.08 78)',
    text: 'oklch(0.38 0.025 78)',
    bar: 'oklch(0.76 0.04 78)',
  },
  LOW: {
    dot: 'oklch(0.60 0.07 155)',
    text: 'oklch(0.34 0.02 155)',
    bar: 'oklch(0.74 0.035 155)',
  },
};

const STATUS_TONES: Record<ResolutionStatus, { dot: string; text: string }> = {
  NEW: { dot: 'oklch(0.56 0.07 240)', text: 'oklch(0.30 0.02 240)' },
  IN_REVIEW: { dot: 'oklch(0.66 0.08 78)', text: 'oklch(0.38 0.025 78)' },
  CONFIRMED: { dot: 'oklch(0.58 0.10 26)', text: 'oklch(0.34 0.03 26)' },
  DISMISSED: { dot: 'oklch(0.62 0.01 250)', text: 'oklch(0.40 0.01 250)' },
};

function getLocale(language: string) {
  return language === 'en' ? 'en-US' : 'uk-UA';
}

function getRuleName(t: TFunction, code: string) {
  return t(`tasks.rules.${code}.name`);
}

function getSeverityLabel(t: TFunction, severity: Severity) {
  if (severity === 'HIGH') return t('tasks.severity.high');
  if (severity === 'MEDIUM') return t('tasks.severity.medium');
  return t('tasks.severity.low');
}

function getStatusLabel(t: TFunction, status: ResolutionStatus) {
  if (status === 'NEW') return t('tasks.status.new');
  if (status === 'IN_REVIEW') return t('tasks.status.inReview');
  if (status === 'CONFIRMED') return t('tasks.status.confirmed');
  return t('tasks.status.dismissed');
}

function mapSeverity(value: string | undefined): Severity {
  const normalized = (value ?? '').toUpperCase();
  if (normalized === 'HIGH') return 'HIGH';
  if (normalized === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

function mapStatus(value: string | undefined): ResolutionStatus {
  const normalized = (value ?? '').toUpperCase();
  if (normalized === 'IN_REVIEW') return 'IN_REVIEW';
  if (normalized === 'CONFIRMED') return 'CONFIRMED';
  if (normalized === 'DISMISSED') return 'DISMISSED';
  return 'NEW';
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

function formatDateTime(value: string | undefined, locale: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function countFromMap(
  map: Record<string, number> | undefined,
  keys: string[],
  fallbackRows: DashboardRow[],
  severity: Severity,
): number {
  if (map) {
    for (const key of keys) {
      if (typeof map[key] === 'number') return map[key];
    }
  }

  return fallbackRows.filter((row) => row.severity === severity).length;
}

async function fetchAllResults(taskId: string): Promise<DiscrepancyResponse[]> {
  const items: DiscrepancyResponse[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (items.length < total) {
    const response = await tasksApi.getResults(taskId, {
      page,
      page_size: FETCH_PAGE_SIZE,
    });
    const batch = response.data.items ?? [];
    total = response.data.total ?? batch.length;
    items.push(...batch);

    if (batch.length === 0 || batch.length < FETCH_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return items;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
      {children}
    </p>
  );
}

function QuietButton({
  children,
  onClick,
  disabled = false,
  strong = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  strong?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        strong
          ? 'border-landing-ink bg-landing-ink text-landing-paper hover:bg-landing-ink-soft'
          : 'border-landing-border-strong bg-transparent text-landing-ink hover:bg-landing-surface'
      }`}
    >
      {children}
    </button>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-landing-muted transition-colors hover:text-landing-ink"
        aria-label={t('tasks.summary.losses.tooltipAria')}
      >
        <Info size={13} />
      </button>
      {show ? (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-landing-border bg-landing-paper px-3 py-2 text-xs leading-relaxed text-landing-ink-soft shadow-sm">
          {text}
        </span>
      ) : null}
    </span>
  );
}

function SeverityChip({ severity }: { severity: Severity }) {
  const { t } = useTranslation();
  const tone = SEVERITY_TONES[severity];

  return (
    <span className="inline-flex h-6 items-center gap-2 whitespace-nowrap px-0 font-mono text-[10px] font-medium uppercase tracking-[0.14em] leading-none">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: tone.dot }}
        aria-hidden="true"
      />
      <span style={{ color: tone.text }}>{getSeverityLabel(t, severity)}</span>
    </span>
  );
}

function StatusChip({ status }: { status: ResolutionStatus }) {
  const { t } = useTranslation();
  const tone = STATUS_TONES[status];

  return (
    <span className="inline-flex h-6 items-center gap-2 whitespace-nowrap px-0 font-mono text-[10px] font-medium uppercase tracking-[0.14em] leading-none">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: tone.dot }}
        aria-hidden="true"
      />
      <span style={{ color: tone.text }}>{getStatusLabel(t, status)}</span>
    </span>
  );
}

function ReportMeta({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="border-b border-landing-border pb-4 last:border-b-0 last:pb-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
        {label}
      </dt>
      <dd className="mt-2 text-sm leading-relaxed text-landing-ink">{value}</dd>
    </div>
  );
}

function TaskHeader({
  taskId,
  task,
  taskState,
  taskLoading,
  taskError,
  isExporting,
  onExport,
  onRefresh,
  onNewAnalysis,
}: {
  taskId: string;
  task: TaskResponse | null;
  taskState: 'pending' | 'done' | 'failed';
  taskLoading: boolean;
  taskError: string | null;
  isExporting: boolean;
  onExport: () => void;
  onRefresh: () => void;
  onNewAnalysis: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage ?? 'uk');
  const files = [t('tasks.files.land'), t('tasks.files.estate')];

  return (
    <section className="overflow-hidden border border-landing-border bg-landing-paper">
      <div className="grid gap-px bg-landing-border xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="bg-landing-paper p-6 md:p-8">
          <SectionLabel>{t('tasks.header.sessionLabel', { id: taskId })}</SectionLabel>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-landing-ink md:text-4xl">
            {t('tasks.header.title')}
          </h1>
          <p className="mt-2 text-base text-landing-ink-soft">
            {t('tasks.header.subtitle')}
          </p>

          <dl className="mt-8 grid gap-5 sm:grid-cols-2">
            <ReportMeta
              label={t('tasks.header.completed')}
              value={formatDateTime(task?.completed_at, locale)}
            />
            <ReportMeta
              label={t('tasks.header.session')}
              value={(
                <div className="space-y-1">
                  <div>{taskId}</div>
                  <div className="text-landing-ink-soft">
                    {taskState === 'done' ? 'Завершено' : taskState === 'failed' ? 'Помилка' : 'В обробці'}
                  </div>
                </div>
              )}
            />
            <ReportMeta
              label={t('tasks.header.inputFiles')}
              value={(
                <div className="space-y-1">
                  {files.map((file) => (
                    <div key={file} className="font-mono text-[12px] text-landing-ink-soft">
                      {file}
                    </div>
                  ))}
                </div>
              )}
            />
            <ReportMeta
              label={t('tasks.header.reviewFocus')}
              value={formatDateTime(task?.created_at, locale)}
            />
          </dl>

          {taskLoading && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-landing-border bg-landing-surface px-3 py-1.5 text-sm text-landing-ink-soft">
              <Loader2 size={14} className="animate-spin" />
              Оновлюю статус аналізу
            </div>
          )}

          {taskError && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {taskError}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between gap-6 bg-landing-surface p-6 md:p-8">
          <div>
            <SectionLabel>{t('tasks.actions.sectionLabel')}</SectionLabel>
            <div className="mt-5 flex flex-col gap-2.5">
              <QuietButton strong onClick={onExport} disabled={isExporting}>
                {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                {t('tasks.actions.downloadReport')}
              </QuietButton>
              <QuietButton onClick={onNewAnalysis}>
                <Upload size={15} />
                {t('tasks.actions.newAnalysis')}
              </QuietButton>
              <QuietButton onClick={onRefresh}>
                <RefreshCw size={15} />
                Оновити дані
              </QuietButton>
            </div>
          </div>

          <div className="border-t border-landing-border pt-5">
            <SectionLabel>{t('tasks.overview.label')}</SectionLabel>
            <p className="mt-3 text-sm leading-relaxed text-landing-ink-soft">
              {task?.error_message
                ? `Помилка бекенду: ${task.error_message}`
                : taskState === 'pending'
                  ? 'Аналіз ще виконується. Дані оновлюються автоматично.'
                  : t('tasks.overview.description')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryMetrics({
  processed,
  totalLand,
  totalEstate,
  matched,
  discrepancies,
  high,
  medium,
  low,
  summaryError,
}: SummaryMetricsProps) {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage ?? 'uk');

  const metrics = [
    {
      label: t('tasks.summary.processed.label'),
      value: formatNumber(processed, locale),
      note: t('tasks.summary.processed.note', {
        land: formatNumber(totalLand, locale),
        estate: formatNumber(totalEstate, locale),
      }),
    },
    {
      label: t('tasks.summary.matched.label'),
      value: formatNumber(matched, locale),
      note: t('tasks.summary.matched.note'),
    },
    {
      label: t('tasks.summary.discrepancies.label'),
      value: formatNumber(discrepancies, locale),
      note: t('tasks.summary.discrepancies.note', {
        count: formatNumber(high, locale),
      }),
      accent: true,
    },
    {
      label: t('tasks.summary.losses.label'),
      value: `${formatNumber(medium, locale)} / ${formatNumber(low, locale)}`,
      note: 'MEDIUM / LOW',
      extra: <InfoTooltip text={summaryError ?? 'Підсумок побудовано на даних поточного завдання.'} />,
    },
  ];

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
  );
}

function RuleBreakdown({
  rules,
}: {
  rules: Array<{ code: string; name: string; count: number; severity: Severity }>;
}) {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage ?? 'uk');
  const maxRuleCount = rules[0]?.count ?? 1;

  return (
    <section className="overflow-hidden border border-landing-border bg-landing-paper">
      <div className="border-b border-landing-border px-6 py-5 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel>{t('tasks.breakdown.label')}</SectionLabel>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-landing-ink">
              {t('tasks.breakdown.title')}
            </h2>
          </div>
          <p className="text-sm text-landing-ink-soft">{t('tasks.breakdown.sortHint')}</p>
        </div>
      </div>

      <div className="divide-y divide-landing-border">
        {rules.map((rule) => {
          const width = (rule.count / maxRuleCount) * 100;

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
                      backgroundColor: SEVERITY_TONES[rule.severity].bar,
                    }}
                  />
                </div>
              </div>
              <div className="font-mono text-sm tabular-nums text-landing-ink md:text-right">
                {formatNumber(rule.count, locale)}
              </div>
              <div className="md:flex md:justify-end">
                <SeverityChip severity={rule.severity} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FilterSection({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-b border-landing-border px-4 py-4.5 last:border-b-0 ${className}`}>
      <div className="flex items-center justify-between">
        <SectionLabel>{title}</SectionLabel>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FilterOption({
  active,
  onClick,
  marker,
  label,
  suffix,
}: {
  active: boolean;
  onClick: () => void;
  marker?: ReactNode;
  label: ReactNode;
  suffix?: ReactNode;
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
  );
}

function FilterRail({
  filters,
  activeFilterCount,
  severityCounts,
  ruleOptions,
  onToggleSev,
  onToggleRule,
  onStatus,
  onSearch,
  onReset,
}: FilterRailProps) {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage ?? 'uk');
  const severityFilters = [
    { key: 'HIGH' as const, label: t('tasks.severity.high'), count: severityCounts.HIGH },
    { key: 'MEDIUM' as const, label: t('tasks.severity.medium'), count: severityCounts.MEDIUM },
    { key: 'LOW' as const, label: t('tasks.severity.low'), count: severityCounts.LOW },
  ];
  const statusOptions = [
    { value: 'ALL' as const, label: t('tasks.filters.statusAll') },
    { value: 'NEW' as const, label: t('tasks.status.new') },
    { value: 'IN_REVIEW' as const, label: t('tasks.status.inReview') },
    { value: 'CONFIRMED' as const, label: t('tasks.status.confirmed') },
    { value: 'DISMISSED' as const, label: t('tasks.status.dismissed') },
  ];

  return (
    <aside className="w-full xl:sticky xl:top-24 xl:w-[240px] xl:self-start" aria-label={t('tasks.filters.panelAria')}>
      <div className="overflow-hidden border border-landing-border bg-landing-paper">
        <div className="flex items-center justify-between border-b border-landing-border px-4 py-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-landing-muted" />
            <span className="text-sm font-medium text-landing-ink">{t('tasks.filters.title')}</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
            {activeFilterCount === 0 ? t('tasks.filters.baseView') : t('tasks.filters.activeCount', { count: activeFilterCount })}
          </span>
        </div>

        <div className="md:grid md:grid-cols-2 xl:block">
          <FilterSection title={t('tasks.filters.severity')}>
            <div className="space-y-1">
              {severityFilters.map((item) => (
                <FilterOption
                  key={item.key}
                  active={filters.severities.has(item.key)}
                  onClick={() => onToggleSev(item.key)}
                  marker={(
                    <span
                      className="block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: SEVERITY_TONES[item.key].dot }}
                    />
                  )}
                  label={item.label}
                  suffix={formatNumber(item.count, locale)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title={t('tasks.filters.status')}>
            <div className="space-y-1">
              {statusOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  active={filters.statusFilter === option.value}
                  onClick={() => onStatus(option.value)}
                  label={option.label}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title={t('tasks.filters.ruleType')} className="md:col-span-2 xl:col-span-1">
            <div className="space-y-0.5">
              {ruleOptions.map((rule) => (
                <FilterOption
                  key={rule.code}
                  active={filters.rules.has(rule.code)}
                  onClick={() => onToggleRule(rule.code)}
                  label={(
                    <span className="flex min-w-0 items-start gap-2.5">
                      <span className="pt-0.5 font-mono text-[11px] text-[var(--accent)]">{rule.code}</span>
                      <span className="min-w-0 text-sm leading-5 text-landing-ink">{getRuleName(t, rule.code)}</span>
                    </span>
                  )}
                  suffix={formatNumber(rule.count, locale)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title={t('tasks.filters.search')} className="md:col-span-2 xl:col-span-1">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-landing-muted" />
              <input
                type="search"
                placeholder={t('tasks.filters.searchPlaceholder')}
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
              {t('tasks.filters.reset')}
            </button>
          </FilterSection>
        </div>
      </div>
    </aside>
  );
}

function DiscrepanciesTable({
  rows,
  totalCount,
  page,
  pageSize,
  taskId,
  rowsLoading,
  rowsError,
  isExporting,
  onPageChange,
  onExport,
}: TableProps) {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage ?? 'uk');
  const navigate = useNavigate();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  const pageButtons = useMemo<(number | '...')[]>(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    return [1, 2, 3, '...', totalPages];
  }, [totalPages]);

  const handleRow = useCallback(
    (id: number) => navigate(`/tasks/${taskId}/discrepancies/${id}`),
    [navigate, taskId],
  );

  const handleRowKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, id: number) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleRow(id);
      }
    },
    [handleRow],
  );

  return (
    <section className="min-w-0 flex-1 overflow-hidden border border-landing-border bg-landing-paper">
      <div className="border-b border-landing-border px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <SectionLabel>{t('tasks.table.label')}</SectionLabel>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-landing-ink">
              {t('tasks.table.title')}
            </h2>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-landing-ink-soft">
              <span>
                {t('tasks.table.found', { count: formatNumber(totalCount, locale) })}
              </span>
              <span>{t('tasks.table.sort')}</span>
              <span>
                {t('tasks.table.showingRange', {
                  start: formatNumber(start, locale),
                  end: formatNumber(end, locale),
                })}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <QuietButton onClick={onExport} disabled={isExporting}>
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {t('tasks.actions.exportCsv')}
            </QuietButton>
          </div>
        </div>
      </div>

      {rowsLoading ? (
        <div className="flex items-center gap-2 px-6 py-8 text-sm text-landing-ink-soft">
          <Loader2 size={14} className="animate-spin" />
          Завантажую кейси
        </div>
      ) : rowsError ? (
        <div className="px-6 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {rowsError}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="px-6 py-8 text-sm text-landing-ink-soft">
          Немає кейсів для поточного набору фільтрів.
        </div>
      ) : (
        <>
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
                  {[
                    t('tasks.table.headers.case'),
                    t('tasks.table.headers.owner'),
                    t('tasks.table.headers.rule'),
                    t('tasks.table.headers.description'),
                    t('tasks.table.headers.status'),
                  ].map((label) => (
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
        </>
      )}

      <div className="flex flex-col gap-3 border-t border-landing-border px-5 py-4 text-sm text-landing-ink-soft md:flex-row md:items-center md:justify-between md:px-6">
        <p>
          {t('tasks.table.paginationSummary', {
            start: formatNumber(start, locale),
            end: formatNumber(end, locale),
            total: formatNumber(totalCount, locale),
          })}
        </p>
        <nav className="flex items-center gap-1" aria-label={t('tasks.table.pagination')}>
          <button
            type="button"
            disabled={page === 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-landing-border bg-landing-paper text-landing-ink-soft transition-colors hover:bg-landing-surface disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t('tasks.table.prevPage')}
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
            aria-label={t('tasks.table.nextPage')}
          >
            <ChevronRight size={14} />
          </button>
        </nav>
      </div>
    </section>
  );
}

function TabletCaseRow({
  row,
  onOpen,
}: {
  row: DashboardRow;
  onOpen: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
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
              {row.taxId || t('tasks.generated.noTaxId')}
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
            {t('tasks.table.caseDescription')}
          </div>
          <div className="mt-2 text-sm leading-6 text-landing-ink-soft">{row.description}</div>
        </div>
      </div>
    </div>
  );
}

function DesktopCaseRow({
  row,
  onOpen,
  onKeyDown,
}: {
  row: DashboardRow;
  onOpen: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}) {
  const { t } = useTranslation();

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
          {row.taxId || t('tasks.generated.noTaxId')}
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
  );
}

function MobileCaseCard({
  row,
  onOpen,
}: {
  row: DashboardRow;
  onOpen: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
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
      <div className="mt-1.5 font-mono text-[11px] text-landing-muted">{row.taxId || t('tasks.generated.noTaxId')}</div>

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
  );
}

function PageButton({
  num,
  active,
  onClick,
}: {
  num: number;
  active: boolean;
  onClick: () => void;
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
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { id: taskIdParam } = useParams();
  const { t } = useTranslation();
  const taskId = taskIdParam ?? '';

  const [task, setTask] = useState<TaskResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [allRows, setAllRows] = useState<DashboardRow[]>([]);
  const [filters, setFilters] = useState<FilterState>(() => ({
    severities: new Set<Severity>(['HIGH', 'MEDIUM', 'LOW']),
    rules: new Set(RULES.map((rule) => rule.code)),
    statusFilter: 'ALL',
    search: '',
  }));
  const [page, setPage] = useState(1);
  const [taskLoading, setTaskLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const loadTask = useCallback(async (withSpinner: boolean) => {
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
  }, [taskId]);

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

  const loadRows = useCallback(async () => {
    if (!taskId) return;
    setRowsLoading(true);

    try {
      const response = await fetchAllResults(taskId);
      setAllRows(
        response.map((row) => ({
          id: row.id,
          severity: mapSeverity(row.severity),
          ownerName: row.owner_name || '—',
          taxId: row.tax_id || '',
          ruleCode: row.rule_code || '—',
          ruleName: row.rule_code ? getRuleName(t, row.rule_code) : '—',
          description: row.description || '—',
          status: mapStatus(row.resolution_status),
        })),
      );
      setRowsError(null);
    } catch (error) {
      setAllRows([]);
      setRowsError(getApiErrorMessage(error, 'Не вдалося завантажити список кейсів.'));
    } finally {
      setRowsLoading(false);
    }
  }, [t, taskId]);

  useEffect(() => {
    if (!taskId) return;

    const timerId = window.setTimeout(() => {
      void loadTask(true);
      void loadSummary();
      void loadRows();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadRows, loadSummary, loadTask, taskId]);

  const taskState = useMemo(() => parseTaskState(task?.status), [task?.status]);

  useEffect(() => {
    if (!taskId || taskState !== 'pending') return;

    const intervalId = setInterval(() => {
      void loadTask(false);
      void loadSummary();
      void loadRows();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [loadRows, loadSummary, loadTask, taskId, taskState]);

  const handleToggleSev = useCallback((severity: Severity) => {
    setFilters((prev) => {
      const next = new Set(prev.severities);
      if (next.has(severity)) next.delete(severity);
      else next.add(severity);
      return { ...prev, severities: next };
    });
    setPage(1);
  }, []);

  const handleToggleRule = useCallback((code: string) => {
    setFilters((prev) => {
      const next = new Set(prev.rules);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return { ...prev, rules: next };
    });
    setPage(1);
  }, []);

  const handleStatus = useCallback((statusFilter: StatusFilter) => {
    setFilters((prev) => ({ ...prev, statusFilter }));
    setPage(1);
  }, []);

  const handleSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setFilters({
      severities: new Set<Severity>(['HIGH', 'MEDIUM', 'LOW']),
      rules: new Set(RULES.map((rule) => rule.code)),
      statusFilter: 'ALL',
      search: '',
    });
    setPage(1);
  }, []);

  const filteredRows = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return allRows.filter((row) => {
      if (!filters.severities.has(row.severity)) return false;
      if (!filters.rules.has(row.ruleCode)) return false;
      if (filters.statusFilter !== 'ALL' && row.status !== filters.statusFilter) return false;

      if (query) {
        const haystack = `${row.ownerName} ${row.taxId} ${row.description}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [allRows, filters]);

  const pagedRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page],
  );

  const activeFilterCount = [
    filters.severities.size !== 3,
    filters.rules.size !== RULES.length,
    filters.statusFilter !== 'ALL',
    filters.search.trim() !== '',
  ].filter(Boolean).length;

  const severityCounts = useMemo<Record<Severity, number>>(() => ({
    HIGH: allRows.filter((row) => row.severity === 'HIGH').length,
    MEDIUM: allRows.filter((row) => row.severity === 'MEDIUM').length,
    LOW: allRows.filter((row) => row.severity === 'LOW').length,
  }), [allRows]);

  const ruleOptions = useMemo(
    () => RULES.map((rule) => ({
      code: rule.code,
      count: summary?.by_rule?.[rule.code] ?? allRows.filter((row) => row.ruleCode === rule.code).length,
    })),
    [allRows, summary?.by_rule],
  );

  const ruleBreakdown = useMemo(
    () =>
      RULES.map((rule) => ({
        code: rule.code,
        name: getRuleName(t, rule.code),
        count: summary?.by_rule?.[rule.code] ?? allRows.filter((row) => row.ruleCode === rule.code).length,
        severity: rule.severity,
      })).sort((a, b) => b.count - a.count),
    [allRows, summary?.by_rule, t],
  );

  const totalLand = task?.stats?.total_land ?? 0;
  const totalEstate = task?.stats?.total_estate ?? 0;
  const processed = totalLand + totalEstate;
  const matched = task?.stats?.matched ?? 0;
  const totalDiscrepancies = summary?.total_count ?? allRows.length;

  const highCount = countFromMap(summary?.by_severity, ['HIGH', 'high'], allRows, 'HIGH');
  const mediumCount = countFromMap(summary?.by_severity, ['MEDIUM', 'medium'], allRows, 'MEDIUM');
  const lowCount = countFromMap(summary?.by_severity, ['LOW', 'low'], allRows, 'LOW');

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

  if (!taskId) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-[900px] px-6 py-10 md:px-10 md:py-12">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Некоректне посилання: id завдання відсутній.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10 md:py-12">
        <div className="space-y-8">
          <TaskHeader
            taskId={taskId}
            task={task}
            taskState={taskState}
            taskLoading={taskLoading}
            taskError={taskError}
            isExporting={isExporting}
            onExport={() => void handleExport()}
            onRefresh={() => {
              void loadTask(true);
              void loadSummary();
              void loadRows();
            }}
            onNewAnalysis={() => navigate('/upload')}
          />

          <SummaryMetrics
            processed={processed}
            totalLand={totalLand}
            totalEstate={totalEstate}
            matched={matched}
            discrepancies={totalDiscrepancies}
            high={highCount}
            medium={mediumCount}
            low={lowCount}
            summaryError={summaryLoading ? 'Оновлюю підсумок.' : summaryError}
          />

          <RuleBreakdown rules={ruleBreakdown} />

          {taskState === 'failed' && (
            <div className="inline-flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle size={14} className="mt-0.5" />
              Завдання завершилось з помилкою. Перевірте вхідні дані та запустіть аналіз повторно.
            </div>
          )}

          <section className="grid items-start gap-5 xl:grid-cols-[240px_minmax(0,1fr)]" aria-label={t('tasks.workspaceAria')}>
            <FilterRail
              filters={filters}
              activeFilterCount={activeFilterCount}
              severityCounts={severityCounts}
              ruleOptions={ruleOptions}
              onToggleSev={handleToggleSev}
              onToggleRule={handleToggleRule}
              onStatus={handleStatus}
              onSearch={handleSearch}
              onReset={handleReset}
            />
            <DiscrepanciesTable
              rows={pagedRows}
              totalCount={filteredRows.length}
              page={page}
              pageSize={PAGE_SIZE}
              taskId={taskId}
              rowsLoading={rowsLoading}
              rowsError={rowsError}
              isExporting={isExporting}
              onPageChange={setPage}
              onExport={() => void handleExport()}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
