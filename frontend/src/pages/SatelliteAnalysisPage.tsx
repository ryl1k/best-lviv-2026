import { useCallback, useEffect, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  ChevronUp,
  FileText,
  Loader2,
  MapPin,
  Maximize2,
  PencilLine,
  Satellite,
  Search,
  ShieldAlert,
  User,
} from 'lucide-react';
import { MapContainer, Polygon, Popup, Rectangle, TileLayer, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyInfo {
  owner: string;
  taxId: string;
  landPurpose: string;
  areaHa: string;
  registeredAt: string;
  cadastralNumber: string;
  address: string;
  registeredStructures: string[];
}

interface DetectedStructure {
  id: number;
  type: string;
  estimatedAreaM2: number;
  registeredInRegistry: boolean;
  confidence: number;
  bounds: LatLngBoundsExpression;
}

interface AnalysisResult {
  status: 'unauthorized_found' | 'compliant';
  overallConfidence: number;
  detectedStructures: DetectedStructure[];
  analysisDate: string;
  satelliteImageDate: string;
  registeredStructuresCount: number;
  detectedStructuresCount: number;
  unauthorizedCount: number;
  estimatedTaxImpact: string;
}

interface TimelineEntry {
  date: string;
  event: string;
  type: 'normal' | 'warning' | 'danger';
}

const PARCEL_CENTER: LatLngTuple = [50.4956, 24.2783];

const PARCEL_BOUNDARY: LatLngTuple[] = [
  [50.4959, 24.2780],
  [50.49587, 24.2784],
  [50.49536, 24.27827],
  [50.4954, 24.2779],
];

const MOCK_PROPERTY: PropertyInfo = {
  owner: 'Грицина Іван Іванович',
  taxId: '3556083731',
  landPurpose: 'Для будівництва і обслуговування житлового будинку',
  areaHa: '0.1200',
  registeredAt: '18.01.2024',
  cadastralNumber: '4624884200:05:000:0009',
  address: 'вул. Коваліва, 45, с. Острів, Львівська обл.',
  registeredStructures: ['Житловий будинок (95.4 м²)', 'Господарська будівля (48.2 м²)'],
};

const MOCK_ANALYSIS: AnalysisResult = {
  status: 'unauthorized_found',
  overallConfidence: 91,
  detectedStructures: [
    { id: 1, type: 'Житловий будинок', estimatedAreaM2: 95.4, registeredInRegistry: true, confidence: 98, bounds: [[50.49570, 24.27809], [50.49565, 24.27817]] },
    { id: 2, type: 'Господарська будівля', estimatedAreaM2: 48.2, registeredInRegistry: true, confidence: 90, bounds: [[50.49571, 24.27802], [50.49566, 24.27810]] },
    { id: 3, type: 'Господарська будівля', estimatedAreaM2: 32.6, registeredInRegistry: false, confidence: 85, bounds: [[50.49566, 24.2780], [50.49560, 24.27807]] },
  ],
  analysisDate: '18.04.2026',
  satelliteImageDate: '12.03.2026',
  registeredStructuresCount: 2,
  detectedStructuresCount: 3,
  unauthorizedCount: 1,
  estimatedTaxImpact: '~14 800 ₴/рік',
};

const MOCK_TIMELINE: TimelineEntry[] = [
  { date: '18.01.2024', event: 'Реєстрація земельної ділянки', type: 'normal' },
  { date: '~жовтень 2024', event: 'Супутниковий знімок: поява будівлі на ділянці', type: 'warning' },
  { date: '18.04.2026', event: 'AI-аналіз: виявлено 1 незареєстровану структуру', type: 'danger' },
];

const SIGNAL_COLOR = 'oklch(0.62 0.16 45)';
const MAP_TONES = {
  parcel: SIGNAL_COLOR,
  registeredStroke: 'oklch(0.57 0.08 155)',
  registeredFill: 'oklch(0.72 0.04 155 / 0.18)',
  unregisteredStroke: 'oklch(0.56 0.07 28)',
  unregisteredFill: 'oklch(0.72 0.03 28 / 0.22)',
};

function FitBounds({ bounds }: { bounds: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (bounds.length > 0) {
      map.fitBounds(bounds as LatLngBoundsExpression, { padding: [40, 40], maxZoom: 20 });
    }
  }, [bounds, map]);

  return null;
}

function SectionLabel({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
      {children ?? t('satellite.sectionLabel')}
    </p>
  );
}

function WorkspaceCard({
  title,
  icon: Icon,
  meta,
  children,
}: {
  title: string;
  icon: ComponentType<{ size?: number; className?: string; style?: CSSProperties }>;
  meta?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <section className="overflow-hidden rounded-[24px] border border-landing-border bg-landing-paper">
      <div className="flex flex-col gap-3 border-b border-landing-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-landing-border bg-landing-surface text-landing-ink-soft"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)' }}
          >
            <Icon size={16} style={{ color: SIGNAL_COLOR }} />
          </span>
          <div>
            <SectionLabel>{t('satellite.workspaceSection')}</SectionLabel>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-landing-ink">{title}</h2>
          </div>
        </div>
        {meta ? (
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-landing-muted">
            {meta}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function DataField({
  label,
  value,
  icon: Icon,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  icon: ComponentType<{ size?: number; className?: string; style?: CSSProperties }>;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-landing-border bg-landing-surface px-4 py-3.5">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
        <Icon size={11} />
        <span>{label}</span>
      </div>
      <div className={`mt-2 text-sm leading-6 text-landing-ink ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  note: string;
  tone: 'default' | 'registered' | 'unregistered' | 'impact';
}) {
  const toneStyles = {
    default: {
      marker: 'bg-landing-ink',
      value: 'text-landing-ink',
    },
    registered: {
      marker: 'bg-[var(--success)]',
      value: 'text-landing-ink',
    },
    unregistered: {
      marker: 'bg-[var(--danger)]',
      value: 'text-landing-ink',
    },
    impact: {
      marker: '',
      value: 'text-landing-ink',
    },
  } as const;

  return (
    <div className="rounded-2xl border border-landing-border bg-landing-surface px-4 py-4">
      <div className="flex items-center gap-2">
        {tone === 'impact' ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">₴</span>
        ) : (
          <span className={`h-2 w-2 rounded-full ${toneStyles[tone].marker}`} aria-hidden="true" />
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">{label}</span>
      </div>
      <div className={`mt-4 font-mono text-2xl font-semibold tracking-tight ${toneStyles[tone].value}`}>{value}</div>
      <p className="mt-2 text-sm leading-relaxed text-landing-ink-soft">{note}</p>
    </div>
  );
}

function StatusBadge({
  registeredInRegistry,
  children,
}: {
  registeredInRegistry: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium"
      style={{
        borderColor: registeredInRegistry ? 'color-mix(in oklch, var(--success) 22%, var(--landing-border))' : 'color-mix(in oklch, var(--danger) 22%, var(--landing-border))',
        background: registeredInRegistry ? 'color-mix(in oklch, var(--success) 7%, white)' : 'color-mix(in oklch, var(--danger) 7%, white)',
        color: registeredInRegistry ? 'var(--text-secondary)' : 'var(--text-primary)',
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: registeredInRegistry ? 'var(--success)' : 'var(--danger)' }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

function LegendItem({
  label,
  borderColor,
  fill,
  dashed = false,
}: {
  label: string;
  borderColor: string;
  fill: string;
  dashed?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-landing-border bg-landing-surface px-3 py-1.5">
      <span
        className="inline-block h-3 w-3 rounded-[4px] border"
        style={{
          borderColor,
          background: fill,
          borderStyle: dashed ? 'dashed' : 'solid',
          borderWidth: 1.5,
        }}
      />
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-landing-muted">{label}</span>
    </div>
  );
}

function TimelineTone({
  type,
}: {
  type: TimelineEntry['type'];
}) {
  const { t } = useTranslation();
  const tones = {
    normal: {
      dot: 'var(--success)',
      bg: 'color-mix(in oklch, var(--success) 6%, white)',
      text: 'var(--text-secondary)',
    },
    warning: {
      dot: 'var(--warning)',
      bg: 'color-mix(in oklch, var(--warning) 7%, white)',
      text: 'var(--text-secondary)',
    },
    danger: {
      dot: 'var(--danger)',
      bg: 'color-mix(in oklch, var(--danger) 7%, white)',
      text: 'var(--text-primary)',
    },
  } as const;

  return (
    <span
      className="inline-flex h-7 items-center rounded-full border px-3 font-mono text-[10px] uppercase tracking-[0.14em]"
      style={{
        borderColor: 'color-mix(in oklch, var(--landing-border) 82%, transparent)',
        background: tones[type].bg,
        color: tones[type].text,
      }}
    >
      <span
        className="mr-2 h-1.5 w-1.5 rounded-full"
        style={{ background: tones[type].dot }}
        aria-hidden="true"
      />
      {type === 'danger' ? t('satellite.timelineType.detection') : type === 'warning' ? t('satellite.timelineType.observed') : t('satellite.timelineType.registry')}
    </span>
  );
}

export default function SatelliteAnalysisPage() {
  const { t } = useTranslation();
  const [cadastralNumber, setCadastralNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phase, setPhase] = useState<'idle' | 'loading' | 'results'>('idle');
  const [loadingStep, setLoadingStep] = useState(0);
  const [queryExpanded, setQueryExpanded] = useState(true);

  const loadingMessages = [
    t('satellite.loading1'),
    t('satellite.loading2'),
    t('satellite.loading3'),
    t('satellite.loading4'),
    t('satellite.loading5'),
  ];

  const ALLOWED_CADASTRAL = '4624884200:05:000:0009';
  const canAnalyze = cadastralNumber.trim().length > 0;
  const isAllowed = cadastralNumber.trim() === ALLOWED_CADASTRAL;

  const handleAnalyze = useCallback(() => {
    if (!canAnalyze) return;
    if (!isAllowed) {
      setCadastralNumber('');
      return;
    }
    setPhase('loading');
    setLoadingStep(0);
  }, [canAnalyze, isAllowed]);

  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = setTimeout(() => {
      setLoadingStep((step) => {
        if (step >= loadingMessages.length - 1) {
          setPhase('results');
          setQueryExpanded(false);
          return step;
        }
        return step + 1;
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [loadingMessages.length, loadingStep, phase]);

  const property = {
    ...MOCK_PROPERTY,
    address: t('satellite.mock.address'),
    landPurpose: t('satellite.mock.landPurpose'),
    registeredStructures: [t('satellite.mock.registeredStructure'), t('satellite.mock.registeredStructure2')],
  };
  const analysis = {
    ...MOCK_ANALYSIS,
    estimatedTaxImpact: t('satellite.mock.estimatedTaxImpact'),
    detectedStructures: MOCK_ANALYSIS.detectedStructures.map((structure) => ({
      ...structure,
      type: t(`satellite.mock.structures.${structure.id}`),
    })),
  };
  const timeline = MOCK_TIMELINE.map((entry, index) => ({
    ...entry,
    event: t(`satellite.mock.timeline.${index}`),
  }));
  const showQuerySection = phase === 'idle' || (phase === 'results' && queryExpanded);

  return (
    <div className="satellite-workspace mx-auto max-w-[1400px] px-6 pb-16 pt-8 md:px-10 md:pb-20">
      <div className="space-y-6 md:space-y-8">
        {phase === 'results' && !queryExpanded ? (
          <section className="rounded-[22px] border border-landing-border bg-landing-paper px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <SectionLabel>{t('satellite.currentQuery')}</SectionLabel>
                <p className="mt-2 text-sm leading-relaxed text-landing-ink-soft">
                  {cadastralNumber || property.cadastralNumber}
                  {address.trim() ? ` · ${address.trim()}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQueryExpanded(true)}
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-landing-border bg-landing-surface px-4 py-2 text-sm font-medium text-landing-ink transition-colors hover:bg-white"
              >
                <PencilLine size={14} />
                {t('satellite.editParameters')}
              </button>
            </div>
          </section>
        ) : null}

        {showQuerySection ? (
          <section className="overflow-hidden rounded-[28px] border border-landing-border bg-landing-paper transition-opacity duration-200">
            <div className="grid gap-px bg-landing-border xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
              <div className="bg-landing-paper p-6 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <SectionLabel>{t('satellite.workspaceEyebrow')}</SectionLabel>
                    <h1 className="mt-3 max-w-[760px] text-3xl font-semibold leading-tight tracking-tight text-landing-ink md:text-4xl">
                      {t('satellite.title')}
                    </h1>
                    <p className="mt-3 max-w-[720px] text-base leading-relaxed text-landing-ink-soft">
                      {t('satellite.subtitle')}
                    </p>
                  </div>

                  {phase === 'results' ? (
                    <button
                      type="button"
                      onClick={() => setQueryExpanded(false)}
                      className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-landing-border bg-landing-surface px-4 py-2 text-sm font-medium text-landing-ink transition-colors hover:bg-white"
                    >
                      <ChevronUp size={14} />
                      {t('satellite.hideQuery')}
                    </button>
                  ) : null}
                </div>

                <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-landing-border bg-landing-surface px-4 py-4">
                    <SectionLabel>{t('satellite.analysisDate')}</SectionLabel>
                    <dd className="mt-2 font-mono text-sm text-landing-ink">18.04.2026</dd>
                  </div>
                  <div className="rounded-2xl border border-landing-border bg-landing-surface px-4 py-4">
                    <SectionLabel>{t('satellite.imageDate')}</SectionLabel>
                    <dd className="mt-2 font-mono text-sm text-landing-ink">{analysis.satelliteImageDate}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-landing-surface p-6 md:p-8">
                <div className="space-y-5">
                  <div>
                    <SectionLabel>{t('satellite.auditQuery')}</SectionLabel>
                    <p className="mt-3 text-sm leading-relaxed text-landing-ink-soft">
                      {t('satellite.auditQueryDescription')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
                        {t('satellite.cadastralNumber')}
                      </label>
                      <div className="rounded-2xl border border-landing-border bg-white px-4 py-3 transition-colors focus-within:border-landing-border-strong">
                        <input
                          type="text"
                          value={cadastralNumber}
                          onChange={(event) => setCadastralNumber(event.target.value)}
                          placeholder={t('satellite.cadastralPlaceholder')}
                          className="w-full border-0 bg-transparent p-0 font-mono text-sm text-landing-ink outline-none placeholder:text-landing-muted"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
                        {t('satellite.address')}
                      </label>
                      <div className="rounded-2xl border border-landing-border bg-white px-4 py-3 transition-colors focus-within:border-landing-border-strong">
                        <input
                          type="text"
                          value={address}
                          onChange={(event) => setAddress(event.target.value)}
                          placeholder={t('satellite.addressPlaceholder')}
                          className="w-full border-0 bg-transparent p-0 text-sm text-landing-ink outline-none placeholder:text-landing-muted"
                        />
                      </div>
                    </div>
                  </div>

                  {canAnalyze && !isAllowed && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      Земельну ділянку не знайдено в базі даних.
                    </p>
                  )}

                  <div className="flex flex-col gap-3 border-t border-landing-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm leading-relaxed text-landing-ink-soft">
                      {t('satellite.queryFooter')}
                    </p>
                    <button
                      onClick={handleAnalyze}
                      disabled={!canAnalyze}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-landing-ink px-5 py-3 text-sm font-medium text-landing-paper transition-colors hover:bg-landing-ink-soft disabled:cursor-not-allowed disabled:bg-[var(--text-disabled)]"
                    >
                      <Search size={16} />
                      {t('satellite.analyze')}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {phase === 'loading' ? (
          <section className="overflow-hidden rounded-[28px] border border-landing-border bg-landing-paper">
            <div className="grid gap-px bg-landing-border lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)]">
              <div className="bg-landing-paper px-6 py-8 md:px-8 md:py-10">
                <SectionLabel>{t('satellite.inProgress')}</SectionLabel>
                <div className="mt-6 flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-landing-border bg-landing-surface">
                    <Loader2 size={20} className="animate-spin" style={{ color: SIGNAL_COLOR }} />
                  </span>
                  <div>
                    <div className="text-lg font-semibold tracking-tight text-landing-ink">
                      {loadingMessages[loadingStep] ?? loadingMessages[loadingMessages.length - 1]}
                    </div>
                    <div className="mt-1 text-sm text-landing-ink-soft">
                      {t('satellite.step')} {Math.min(loadingStep + 1, loadingMessages.length)} {t('satellite.of')} {loadingMessages.length}
                    </div>
                  </div>
                </div>

                <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-landing-secondary">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((loadingStep + 1) / loadingMessages.length) * 100}%`,
                      background: `linear-gradient(90deg, ${SIGNAL_COLOR} 0%, color-mix(in oklch, ${SIGNAL_COLOR} 70%, white) 100%)`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-landing-surface px-6 py-8 md:px-8 md:py-10">
                <SectionLabel>{t('satellite.pipeline')}</SectionLabel>
                <div className="mt-5 space-y-3">
                  {loadingMessages.map((message, index) => {
                    const isComplete = index < loadingStep;
                    const isActive = index === loadingStep;

                    return (
                      <div
                        key={message}
                        className="flex items-center gap-3 rounded-2xl border border-landing-border bg-white px-4 py-3"
                        style={{
                          borderColor: isActive ? 'var(--landing-border-strong)' : undefined,
                          background: isActive ? 'color-mix(in oklch, var(--landing-surface) 58%, white)' : undefined,
                        }}
                      >
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[11px]"
                          style={{
                            borderColor: isComplete || isActive ? SIGNAL_COLOR : 'var(--landing-border)',
                            color: isComplete || isActive ? 'var(--landing-ink)' : 'var(--landing-muted)',
                            background: isComplete ? `color-mix(in oklch, ${SIGNAL_COLOR} 12%, white)` : 'transparent',
                          }}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm text-landing-ink-soft">{message}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {phase === 'results' ? (
          <div className="space-y-6">
            {analysis.status === 'unauthorized_found' ? (
              <section className="overflow-hidden rounded-[24px] border border-landing-border bg-landing-paper">
                <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-3">
                    <span
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-landing-border"
                      style={{ background: 'color-mix(in oklch, var(--danger) 8%, white)' }}
                    >
                      <ShieldAlert size={17} style={{ color: 'var(--danger)' }} />
                    </span>
                    <div>
                      <SectionLabel>{t('satellite.findings')}</SectionLabel>
                      <h2 className="mt-2 text-lg font-semibold tracking-tight text-landing-ink">
                        {t('satellite.alertTitle', { count: analysis.unauthorizedCount })}
                      </h2>
                      <p className="mt-2 max-w-[760px] text-sm leading-relaxed text-landing-ink-soft">
                        {t('satellite.alertDesc', { cadastral: property.cadastralNumber })}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-landing-border bg-landing-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
                      {t('satellite.unregisteredCount')}: {analysis.unauthorizedCount}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-landing-border bg-landing-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-landing-ink">
                      {t('satellite.taxImpact')}: {analysis.estimatedTaxImpact}
                    </span>
                  </div>
                </div>
              </section>
            ) : null}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(360px,0.82fr)_minmax(0,1.18fr)]">
              <WorkspaceCard
                title={t('satellite.propertyInfo')}
                icon={Building2}
                meta={<>{t('satellite.cadastralNumber')} · {property.cadastralNumber}</>}
              >
                <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DataField label={t('satellite.owner')} value={property.owner} icon={User} />
                    <DataField label={t('satellite.taxId')} value={property.taxId} icon={FileText} mono />
                    <DataField label={t('satellite.addressLabel')} value={property.address} icon={MapPin} />
                    <DataField label={t('satellite.area')} value={`${property.areaHa} ${t('satellite.hectares')}`} icon={Maximize2} mono />
                    <DataField label={t('satellite.regDate')} value={property.registeredAt} icon={Clock3} mono />
                    <DataField label={t('satellite.purpose')} value={property.landPurpose} icon={FileText} />
                  </div>

                  <div className="rounded-[24px] border border-landing-border bg-landing-surface px-4 py-4">
                    <SectionLabel>{t('satellite.regStructures')}</SectionLabel>
                    <div className="mt-4 space-y-2.5">
                      {property.registeredStructures.map((structure) => (
                        <div
                          key={structure}
                          className="flex items-center gap-3 rounded-2xl border border-landing-border bg-white px-4 py-3 text-sm text-landing-ink"
                        >
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-full"
                            style={{ background: 'color-mix(in oklch, var(--success) 10%, white)', color: 'var(--success)' }}
                          >
                            <CheckCircle2 size={15} />
                          </span>
                          <span>{structure}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </WorkspaceCard>

              <WorkspaceCard
                title={t('satellite.satelliteView')}
                icon={Satellite}
                meta={<>{t('satellite.imageDate')} · {analysis.satelliteImageDate}</>}
              >
                <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <p className="max-w-[680px] text-sm leading-relaxed text-landing-ink-soft">
                      {t('satellite.mapDescription')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <LegendItem
                        label={t('satellite.parcelBoundary')}
                        borderColor={MAP_TONES.parcel}
                        fill="color-mix(in oklch, oklch(0.62 0.16 45) 10%, white)"
                        dashed
                      />
                      <LegendItem label={t('satellite.registered')} borderColor={MAP_TONES.registeredStroke} fill={MAP_TONES.registeredFill} />
                      <LegendItem label={t('satellite.unregistered')} borderColor={MAP_TONES.unregisteredStroke} fill={MAP_TONES.unregisteredFill} />
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-landing-border bg-landing-surface p-3">
                    <div className="satellite-map-frame relative isolate overflow-hidden rounded-[20px] border border-landing-border bg-[oklch(0.95_0.004_80)]">
                      <div className="h-[420px] md:h-[480px]">
                        <MapContainer
                          center={PARCEL_CENTER}
                          zoom={18}
                          maxZoom={20}
                          scrollWheelZoom
                          zoomControl
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution="Esri, Maxar"
                            maxNativeZoom={18}
                            maxZoom={20}
                          />
                          <FitBounds bounds={PARCEL_BOUNDARY} />
                          <Polygon
                            positions={PARCEL_BOUNDARY}
                            pathOptions={{
                              color: MAP_TONES.parcel,
                              weight: 2,
                              fillColor: MAP_TONES.parcel,
                              fillOpacity: 0.08,
                              dashArray: '6 4',
                            }}
                          />
                          {analysis.detectedStructures.map((structure) => (
                            <Rectangle
                              key={structure.id}
                              bounds={structure.bounds}
                              pathOptions={{
                                color: structure.registeredInRegistry ? MAP_TONES.registeredStroke : MAP_TONES.unregisteredStroke,
                                weight: 2,
                                fillColor: structure.registeredInRegistry ? MAP_TONES.registeredStroke : MAP_TONES.unregisteredStroke,
                                fillOpacity: structure.registeredInRegistry ? 0.15 : 0.22,
                              }}
                            >
                              <Popup>
                                <div className="space-y-2">
                                  <div className="text-sm font-semibold text-landing-ink">{structure.type}</div>
                                  <div className="space-y-1 font-mono text-[11px] text-landing-muted">
                                    <div>{t('satellite.areaCol')}: {structure.estimatedAreaM2} {t('satellite.squareMeters')}</div>
                                    <div>{t('satellite.confidence')}: {structure.confidence}%</div>
                                  </div>
                                  <StatusBadge registeredInRegistry={structure.registeredInRegistry}>
                                    {structure.registeredInRegistry ? t('satellite.registered') : t('satellite.unregistered')}
                                  </StatusBadge>
                                </div>
                              </Popup>
                            </Rectangle>
                          ))}
                        </MapContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </WorkspaceCard>
            </div>

            <WorkspaceCard
              title={t('satellite.analysisResults')}
              icon={AlertTriangle}
              meta={<>{t('satellite.analysisDate')} · {analysis.analysisDate}</>}
            >
              <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <SectionLabel>{t('satellite.summary')}</SectionLabel>
                    <p className="mt-2 max-w-[760px] text-sm leading-relaxed text-landing-ink-soft">
                      {t('satellite.summaryDescription')}
                    </p>
                  </div>
                  <div className="rounded-full border border-landing-border bg-landing-surface px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-landing-muted">
                    {t('satellite.confidence')}: <span className="text-landing-ink">{analysis.overallConfidence}%</span>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryMetric
                    label={t('satellite.detectedStructures')}
                    value={analysis.detectedStructuresCount}
                    note={t('satellite.metricNotes.detected')}
                    tone="default"
                  />
                  <SummaryMetric
                    label={t('satellite.registeredCount')}
                    value={analysis.registeredStructuresCount}
                    note={t('satellite.metricNotes.registered')}
                    tone="registered"
                  />
                  <SummaryMetric
                    label={t('satellite.unregisteredCount')}
                    value={analysis.unauthorizedCount}
                    note={t('satellite.metricNotes.unregistered')}
                    tone="unregistered"
                  />
                  <SummaryMetric
                    label={t('satellite.taxEffect')}
                    value={analysis.estimatedTaxImpact}
                    note={t('satellite.metricNotes.taxEffect')}
                    tone="impact"
                  />
                </div>

                <div className="overflow-hidden rounded-[24px] border border-landing-border bg-landing-surface">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px]">
                      <thead>
                        <tr>
                          {[t('satellite.structure'), t('satellite.areaCol'), t('satellite.status'), t('satellite.confidence')].map((heading) => (
                            <th
                              key={heading}
                              className="border-b border-landing-border px-5 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.detectedStructures.map((structure) => (
                          <tr
                            key={structure.id}
                            className="border-b border-landing-border last:border-b-0"
                            style={{
                              background: structure.registeredInRegistry ? 'transparent' : 'color-mix(in oklch, var(--danger) 4%, white)',
                            }}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-start gap-3">
                                <span
                                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ background: structure.registeredInRegistry ? 'var(--success)' : 'var(--danger)' }}
                                />
                                <div>
                                  <div className="text-sm font-medium text-landing-ink">{structure.type}</div>
                                  <div className="mt-1 text-xs text-landing-ink-soft">
                                    {t('satellite.parcelMatch', { id: String(structure.id).padStart(2, '0') })}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 font-mono text-sm text-landing-ink">{structure.estimatedAreaM2} {t('satellite.squareMeters')}</td>
                            <td className="px-5 py-4">
                              <StatusBadge registeredInRegistry={structure.registeredInRegistry}>
                                {structure.registeredInRegistry ? t('satellite.registered') : t('satellite.unregistered')}
                              </StatusBadge>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${structure.confidence}%`,
                                      background: structure.confidence >= 90 ? 'var(--success)' : SIGNAL_COLOR,
                                    }}
                                  />
                                </div>
                                <span className="font-mono text-sm text-landing-ink">{structure.confidence}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </WorkspaceCard>

            <WorkspaceCard title={t('satellite.timeline')} icon={Clock3} meta={<>{t('satellite.timelineMeta', { count: timeline.length })}</>}>
              <div className="px-5 py-5 sm:px-6 sm:py-6">
                <div className="relative space-y-4 pl-5 sm:pl-6">
                  <div className="absolute bottom-3 left-[7px] top-3 w-px bg-landing-border sm:left-[9px]" />

                  {timeline.map((entry, index) => {
                    const toneColor =
                      entry.type === 'danger' ? 'var(--danger)' : entry.type === 'warning' ? 'var(--warning)' : 'var(--success)';

                    return (
                      <article
                        key={`${entry.date}-${index}`}
                        className="relative rounded-[22px] border border-landing-border bg-landing-surface px-4 py-4 sm:px-5"
                      >
                        <span
                          className="absolute left-[-18px] top-6 h-3.5 w-3.5 rounded-full border-[3px] border-landing-paper sm:left-[-22px]"
                          style={{ background: toneColor, boxShadow: `0 0 0 1px ${toneColor}` }}
                          aria-hidden="true"
                        />
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-landing-muted">{entry.date}</div>
                            <p
                              className="mt-2 text-sm leading-relaxed"
                              style={{ color: entry.type === 'danger' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                            >
                              {entry.event}
                            </p>
                          </div>
                          <TimelineTone type={entry.type} />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </WorkspaceCard>
          </div>
        ) : null}
      </div>
    </div>
  );
}
