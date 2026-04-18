import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Satellite,
  Search,
  AlertTriangle,
  Building2,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  TrendingUp,
  Loader2,
  User,
  FileText,
  Maximize2,
} from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Rectangle, Popup, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Types ─────────────────────────────────────────────────────── */

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

/* ── Mock data ─────────────────────────────────────────────────── */

const PARCEL_CENTER: LatLngTuple = [49.3485, 24.6532];

const PARCEL_BOUNDARY: LatLngTuple[] = [
  [49.34885, 24.6526],
  [49.34885, 24.6538],
  [49.34815, 24.6538],
  [49.34815, 24.6526],
];

const MOCK_PROPERTY: PropertyInfo = {
  owner: 'Грицина Іван Іванович',
  taxId: '3556083731',
  landPurpose: 'Для будівництва і обслуговування житлового будинку',
  areaHa: '0.1200',
  registeredAt: '18.01.2024',
  cadastralNumber: '4624884200:05:000:0009',
  address: 'вул. Коваліва, 45, с. Острів, Львівська обл.',
  registeredStructures: ['Житловий будинок (124.5 м²)'],
};

const MOCK_ANALYSIS: AnalysisResult = {
  status: 'unauthorized_found',
  overallConfidence: 94,
  detectedStructures: [
    { id: 1, type: 'Житловий будинок', estimatedAreaM2: 124.5, registeredInRegistry: true, confidence: 98, bounds: [[49.34865, 24.6529], [49.34845, 24.6533]] },
    { id: 2, type: 'Господарська будівля', estimatedAreaM2: 48.0, registeredInRegistry: false, confidence: 91, bounds: [[49.3484, 24.6534], [49.34828, 24.65365]] },
    { id: 3, type: 'Гараж', estimatedAreaM2: 32.0, registeredInRegistry: false, confidence: 87, bounds: [[49.3487, 24.65345], [49.3486, 24.6537]] },
  ],
  analysisDate: '18.04.2026',
  satelliteImageDate: '12.03.2026',
  registeredStructuresCount: 1,
  detectedStructuresCount: 3,
  unauthorizedCount: 2,
  estimatedTaxImpact: '~18 400 ₴/рік',
};

const MOCK_TIMELINE: TimelineEntry[] = [
  { date: '18.01.2024', event: 'Реєстрація земельної ділянки та житлового будинку', type: 'normal' },
  { date: '~серпень 2024', event: 'Супутниковий знімок: поява нової будівлі на ділянці', type: 'warning' },
  { date: '~березень 2025', event: 'Супутниковий знімок: поява гаражу на ділянці', type: 'danger' },
  { date: '18.04.2026', event: 'AI-аналіз: виявлено 2 незареєстровані структури', type: 'danger' },
];

const SIGNAL_COLOR = 'oklch(0.62 0.16 45)';

/* ── Map auto-fit ────────────────────────────────────────────── */

function FitBounds({ bounds }: { bounds: LatLngTuple[] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.length > 0) {
      map.fitBounds(bounds as LatLngBoundsExpression, { padding: [40, 40], maxZoom: 18 });
    }
  }, [map, bounds]);
  return null;
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function SatelliteAnalysisPage() {
  const { t } = useTranslation();
  const [cadastralNumber, setCadastralNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phase, setPhase] = useState<'idle' | 'loading' | 'results'>('idle');
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    t('satellite.loading1'),
    t('satellite.loading2'),
    t('satellite.loading3'),
    t('satellite.loading4'),
    t('satellite.loading5'),
  ];

  const canAnalyze = cadastralNumber.trim().length > 0;

  const handleAnalyze = useCallback(() => {
    if (!canAnalyze) return;
    setPhase('loading');
    setLoadingStep(0);
  }, [canAnalyze]);

  useEffect(() => {
    if (phase !== 'loading') return;
    if (loadingStep >= loadingMessages.length) {
      setPhase('results');
      return;
    }
    const timer = setTimeout(() => setLoadingStep((s) => s + 1), 700);
    return () => clearTimeout(timer);
  }, [phase, loadingStep, loadingMessages.length]);

  const property = MOCK_PROPERTY;
  const analysis = MOCK_ANALYSIS;
  const timeline = MOCK_TIMELINE;

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-16 pt-8 md:px-10">
      {/* Header */}
      <div className="mb-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
          {t('satellite.title')}
        </span>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-landing-ink md:text-4xl">
          {t('satellite.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-base text-landing-ink-soft">
          {t('satellite.subtitle')}
        </p>
      </div>

      {/* Input Section */}
      <div className="mb-8 rounded-2xl border border-landing-border bg-landing-surface p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1" style={{ minWidth: 280 }}>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
              {t('satellite.cadastralNumber')}
            </label>
            <input
              type="text"
              value={cadastralNumber}
              onChange={(e) => setCadastralNumber(e.target.value)}
              placeholder="4624884200:05:000:0009"
              className="w-full rounded-lg border border-landing-border bg-landing-paper px-3 py-2.5 font-mono text-sm text-landing-ink outline-none transition-colors focus:border-landing-border-strong"
            />
          </div>

          <div className="min-w-0 flex-1" style={{ minWidth: 240 }}>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
              {t('satellite.address')}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="вул. Коваліва, 45, с. Острів"
              className="w-full rounded-lg border border-landing-border bg-landing-paper px-3 py-2.5 text-sm text-landing-ink outline-none transition-colors focus:border-landing-border-strong"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze || phase === 'loading'}
            className="inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: canAnalyze ? SIGNAL_COLOR : 'var(--text-disabled)' }}
          >
            {phase === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {t('satellite.analyze')}
          </button>
        </div>
      </div>

      {/* Loading */}
      {phase === 'loading' && (
        <div className="rounded-2xl border border-landing-border bg-landing-surface py-16 text-center">
          <Loader2 size={28} className="mx-auto mb-4 animate-spin" style={{ color: SIGNAL_COLOR }} />
          <div className="text-sm font-medium text-landing-ink">
            {loadingMessages[loadingStep] ?? loadingMessages[loadingMessages.length - 1]}
          </div>
          <div className="mt-1 font-mono text-xs text-landing-muted">
            {t('satellite.step')} {Math.min(loadingStep + 1, loadingMessages.length)} {t('satellite.of')} {loadingMessages.length}
          </div>
          <div className="mx-auto mt-4 h-0.5 w-64 overflow-hidden rounded-full bg-landing-border">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%`, background: SIGNAL_COLOR }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {phase === 'results' && (
        <div className="flex flex-col gap-6">
          {/* Alert */}
          {analysis.status === 'unauthorized_found' && (
            <div className="flex items-start gap-3 rounded-2xl border border-landing-border bg-[var(--danger-subtle)] p-5">
              <AlertTriangle size={20} className="mt-0.5 shrink-0" style={{ color: 'var(--danger)' }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>
                  {t('satellite.alertTitle', { count: analysis.unauthorizedCount })}
                </div>
                <div className="mt-1 text-sm text-landing-ink-soft">
                  {t('satellite.alertDesc', { cadastral: property.cadastralNumber })}{' '}
                  {t('satellite.taxImpact')}: <strong style={{ color: 'var(--danger)' }}>{analysis.estimatedTaxImpact}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Two columns: Property + Map */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.6fr]">
            {/* Property Info */}
            <div className="rounded-2xl border border-landing-border bg-landing-surface p-6">
              <div className="mb-5 flex items-center gap-2">
                <Building2 size={16} style={{ color: SIGNAL_COLOR }} />
                <span className="text-sm font-semibold text-landing-ink">{t('satellite.propertyInfo')}</span>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  { icon: User, label: t('satellite.owner'), value: property.owner },
                  { icon: FileText, label: t('satellite.taxId'), value: property.taxId, mono: true },
                  { icon: MapPin, label: t('satellite.addressLabel'), value: property.address },
                  { icon: FileText, label: t('satellite.cadastralNumber'), value: property.cadastralNumber, mono: true },
                  { icon: Maximize2, label: t('satellite.area'), value: `${property.areaHa} га` },
                  { icon: FileText, label: t('satellite.purpose'), value: property.landPurpose },
                  { icon: Clock, label: t('satellite.regDate'), value: property.registeredAt },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
                      <item.icon size={10} />
                      {item.label}
                    </div>
                    <div className={`text-sm text-landing-ink ${item.mono ? 'font-mono' : ''}`}>
                      {item.value}
                    </div>
                  </div>
                ))}

                <div>
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
                    {t('satellite.regStructures')}
                  </div>
                  {property.registeredStructures.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-[var(--success-subtle)] px-3 py-1.5 text-sm text-landing-ink-soft">
                      <CheckCircle size={13} style={{ color: 'var(--success)' }} />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="overflow-hidden rounded-2xl border border-landing-border bg-landing-surface">
              <div className="flex items-center justify-between border-b border-landing-border px-5 py-3">
                <div className="flex items-center gap-2">
                  <Satellite size={16} style={{ color: SIGNAL_COLOR }} />
                  <span className="text-sm font-semibold text-landing-ink">{t('satellite.satelliteView')}</span>
                </div>
                <span className="font-mono text-[10px] text-landing-muted">
                  {t('satellite.imageDate')} {analysis.satelliteImageDate}
                </span>
              </div>

              <div style={{ height: 420 }}>
                <MapContainer center={PARCEL_CENTER} zoom={18} style={{ height: '100%', width: '100%' }} scrollWheelZoom zoomControl>
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri, Maxar" />
                  <FitBounds bounds={PARCEL_BOUNDARY} />
                  <Polygon positions={PARCEL_BOUNDARY} pathOptions={{ color: SIGNAL_COLOR, weight: 2, fillColor: SIGNAL_COLOR, fillOpacity: 0.08, dashArray: '6 4' }} />
                  {analysis.detectedStructures.map((s) => (
                    <Rectangle
                      key={s.id}
                      bounds={s.bounds}
                      pathOptions={{
                        color: s.registeredInRegistry ? '#22C55E' : '#EF4444',
                        weight: 2,
                        fillColor: s.registeredInRegistry ? '#22C55E' : '#EF4444',
                        fillOpacity: s.registeredInRegistry ? 0.15 : 0.25,
                      }}
                    >
                      <Popup>
                        <div style={{ fontSize: 13 }}>
                          <strong>{s.type}</strong><br />
                          {t('satellite.areaCol')}: {s.estimatedAreaM2} м²<br />
                          {t('satellite.confidence')}: {s.confidence}%<br />
                          <span style={{ color: s.registeredInRegistry ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                            {s.registeredInRegistry ? t('satellite.registered') : t('satellite.unregistered')}
                          </span>
                        </div>
                      </Popup>
                    </Rectangle>
                  ))}
                </MapContainer>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5 border-t border-landing-border px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-landing-muted">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm border-2 border-dashed" style={{ borderColor: SIGNAL_COLOR, background: `color-mix(in oklch, ${SIGNAL_COLOR} 8%, transparent)` }} />
                  {t('satellite.parcelBoundary')}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm border-2 border-[#22C55E]" style={{ background: 'rgba(34,197,94,0.15)' }} />
                  {t('satellite.registered')}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm border-2 border-[#EF4444]" style={{ background: 'rgba(239,68,68,0.25)' }} />
                  {t('satellite.unregistered')}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Stats + Table */}
          <div className="overflow-hidden rounded-2xl border border-landing-border bg-landing-surface">
            <div className="flex items-center justify-between border-b border-landing-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Eye size={16} style={{ color: SIGNAL_COLOR }} />
                <span className="text-sm font-semibold text-landing-ink">{t('satellite.analysisResults')}</span>
              </div>
              <div className="flex items-center gap-4 font-mono text-xs text-landing-muted">
                <span>{t('satellite.confidence')}: <strong className="text-[var(--success)]">{analysis.overallConfidence}%</strong></span>
                <span>{t('satellite.analysisDate')}: {analysis.analysisDate}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 border-b border-landing-border md:grid-cols-4">
              {[
                { label: t('satellite.detectedStructures'), value: analysis.detectedStructuresCount, icon: Building2, color: SIGNAL_COLOR },
                { label: t('satellite.registeredCount'), value: analysis.registeredStructuresCount, icon: CheckCircle, color: 'var(--success)' },
                { label: t('satellite.unregisteredCount'), value: analysis.unauthorizedCount, icon: XCircle, color: 'var(--danger)' },
                { label: t('satellite.taxEffect'), value: analysis.estimatedTaxImpact, icon: TrendingUp, color: 'var(--warning)' },
              ].map((stat) => (
                <div key={stat.label} className="border-r border-landing-border px-5 py-4 last:border-r-0">
                  <div className="mb-1.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-landing-muted">
                    <stat.icon size={11} style={{ color: stat.color }} />
                    {stat.label}
                  </div>
                  <div className="font-mono text-xl font-semibold" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  {[t('satellite.structure'), t('satellite.areaCol'), t('satellite.status'), t('satellite.confidence')].map((h) => (
                    <th key={h} className="border-b border-landing-border bg-landing-secondary px-5 py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-landing-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.detectedStructures.map((s) => (
                  <tr key={s.id} style={{ background: s.registeredInRegistry ? 'transparent' : 'var(--danger-subtle)' }}>
                    <td className="border-b border-landing-border px-5 py-3 text-sm font-medium text-landing-ink">{s.type}</td>
                    <td className="border-b border-landing-border px-5 py-3 font-mono text-sm text-landing-ink">{s.estimatedAreaM2} м²</td>
                    <td className="border-b border-landing-border px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          background: s.registeredInRegistry ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                          color: s.registeredInRegistry ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {s.registeredInRegistry ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        {s.registeredInRegistry ? t('satellite.registered') : t('satellite.unregistered')}
                      </span>
                    </td>
                    <td className="border-b border-landing-border px-5 py-3 font-mono text-sm font-semibold" style={{ color: s.confidence >= 90 ? 'var(--success)' : 'var(--warning)' }}>
                      {s.confidence}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-landing-border bg-landing-surface p-6">
            <div className="mb-5 flex items-center gap-2">
              <Clock size={16} style={{ color: SIGNAL_COLOR }} />
              <span className="text-sm font-semibold text-landing-ink">{t('satellite.timeline')}</span>
            </div>

            <div className="relative pl-6">
              <div className="absolute bottom-1 left-[5px] top-1 w-0.5 rounded-full bg-landing-border" />

              {timeline.map((entry, i) => {
                const dotColor = entry.type === 'danger' ? 'var(--danger)' : entry.type === 'warning' ? 'var(--warning)' : 'var(--success)';
                return (
                  <div key={i} className="relative" style={{ paddingBottom: i < timeline.length - 1 ? 20 : 0 }}>
                    <div
                      className="absolute rounded-full"
                      style={{
                        left: -20,
                        top: 4,
                        width: 10,
                        height: 10,
                        background: dotColor,
                        border: '2px solid var(--landing-surface-elevated)',
                        boxShadow: `0 0 0 2px ${dotColor}`,
                      }}
                    />
                    <div className="font-mono text-xs text-landing-muted">{entry.date}</div>
                    <div
                      className="mt-0.5 text-sm"
                      style={{
                        color: entry.type === 'danger' ? 'var(--danger)' : 'var(--text-secondary)',
                        fontWeight: entry.type === 'danger' ? 500 : 400,
                      }}
                    >
                      {entry.event}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
