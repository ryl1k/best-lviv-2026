import { useState, useEffect, useCallback } from 'react';
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

// Parcel near Ostriv, Lviv region
const PARCEL_CENTER: LatLngTuple = [49.3485, 24.6532];

const PARCEL_BOUNDARY: LatLngTuple[] = [
  [49.34885, 24.65260],
  [49.34885, 24.65380],
  [49.34815, 24.65380],
  [49.34815, 24.65260],
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
    {
      id: 1,
      type: 'Житловий будинок',
      estimatedAreaM2: 124.5,
      registeredInRegistry: true,
      confidence: 98,
      bounds: [
        [49.34865, 24.65290],
        [49.34845, 24.65330],
      ],
    },
    {
      id: 2,
      type: 'Господарська будівля',
      estimatedAreaM2: 48.0,
      registeredInRegistry: false,
      confidence: 91,
      bounds: [
        [49.34840, 24.65340],
        [49.34828, 24.65365],
      ],
    },
    {
      id: 3,
      type: 'Гараж',
      estimatedAreaM2: 32.0,
      registeredInRegistry: false,
      confidence: 87,
      bounds: [
        [49.34870, 24.65345],
        [49.34860, 24.65370],
      ],
    },
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

const LOADING_MESSAGES = [
  'Отримання даних з реєстру…',
  'Завантаження супутникового знімку…',
  'AI-аналіз зображення…',
  'Порівняння з реєстром…',
  'Формування звіту…',
];

/* ── Map auto-fit component ────────────────────────────────────── */

function FitBounds({ bounds }: { bounds: LatLngTuple[] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.length > 0) {
      map.fitBounds(bounds as LatLngBoundsExpression, { padding: [40, 40], maxZoom: 18 });
    }
  }, [map, bounds]);
  return null;
}

/* ── Page component ────────────────────────────────────────────── */

export default function SatelliteAnalysisPage() {
  const [cadastralNumber, setCadastralNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phase, setPhase] = useState<'idle' | 'loading' | 'results'>('idle');
  const [loadingStep, setLoadingStep] = useState(0);

  const canAnalyze = cadastralNumber.trim().length > 0;

  const handleAnalyze = useCallback(() => {
    if (!canAnalyze) return;
    setPhase('loading');
    setLoadingStep(0);
  }, [canAnalyze]);

  // Loading step cycling
  useEffect(() => {
    if (phase !== 'loading') return;
    if (loadingStep >= LOADING_MESSAGES.length) {
      setPhase('results');
      return;
    }
    const timer = setTimeout(() => setLoadingStep((s) => s + 1), 700);
    return () => clearTimeout(timer);
  }, [phase, loadingStep]);

  const property = MOCK_PROPERTY;
  const analysis = MOCK_ANALYSIS;
  const timeline = MOCK_TIMELINE;

  return (
    <div className="max-w-[1440px] mx-auto" style={{ padding: '32px 32px 64px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
          <Satellite size={20} style={{ color: 'var(--accent)' }} />
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Аналіз з супутника
          </h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Виявлення незареєстрованих будівель за допомогою супутникових знімків та AI — Львівська область
        </p>
      </div>

      {/* Input Section */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div className="flex items-end gap-4 flex-wrap">
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 6,
              }}
            >
              Кадастровий номер
            </label>
            <input
              type="text"
              value={cadastralNumber}
              onChange={(e) => setCadastralNumber(e.target.value)}
              placeholder="4624884200:05:000:0009"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 150ms',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 6,
              }}
            >
              Адреса (необов'язково)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="вул. Коваліва, 45, с. Острів"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 150ms',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze || phase === 'loading'}
            className="inline-flex items-center gap-2"
            style={{
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: canAnalyze ? 'var(--accent)' : 'var(--text-disabled)',
              border: 'none',
              borderRadius: 8,
              cursor: canAnalyze ? 'pointer' : 'not-allowed',
              transition: 'opacity 150ms',
              whiteSpace: 'nowrap',
              height: 42,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (canAnalyze) e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {phase === 'loading' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            Аналізувати
          </button>
        </div>
      </div>

      {/* Loading State */}
      {phase === 'loading' && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <Loader2
            size={32}
            className="animate-spin"
            style={{ color: 'var(--accent)', margin: '0 auto 16px' }}
          />
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
            {LOADING_MESSAGES[loadingStep] ?? LOADING_MESSAGES[LOADING_MESSAGES.length - 1]}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Крок {Math.min(loadingStep + 1, LOADING_MESSAGES.length)} з {LOADING_MESSAGES.length}
          </div>
          {/* Progress bar */}
          <div
            style={{
              width: 280,
              height: 3,
              background: 'var(--surface-muted)',
              borderRadius: 2,
              margin: '16px auto 0',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${((loadingStep + 1) / LOADING_MESSAGES.length) * 100}%`,
                height: '100%',
                background: 'var(--accent)',
                borderRadius: 2,
                transition: 'width 600ms ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {phase === 'results' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Alert Banner */}
          {analysis.status === 'unauthorized_found' && (
            <div
              className="flex items-start gap-3"
              style={{
                background: 'var(--danger-subtle)',
                border: '1px solid rgba(220,38,38,0.25)',
                borderRadius: 8,
                padding: '16px 20px',
              }}
            >
              <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--danger)', marginBottom: 4 }}>
                  Виявлено {analysis.unauthorizedCount} незареєстрован{analysis.unauthorizedCount === 1 ? 'у' : 'і'} структур{analysis.unauthorizedCount === 1 ? 'у' : 'и'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  На ділянці {property.cadastralNumber} знайдено будівлі, які відсутні в реєстрі нерухомості.
                  Орієнтовний вплив на оподаткування: <strong style={{ color: 'var(--danger)' }}>{analysis.estimatedTaxImpact}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Two-column: Property Info + Map */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20 }}>
            {/* Property Info */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 20,
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
                <Building2 size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Дані з реєстру
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {([
                  { icon: User, label: 'Власник', value: property.owner },
                  { icon: FileText, label: 'ІПН', value: property.taxId, mono: true },
                  { icon: MapPin, label: 'Адреса', value: property.address },
                  { icon: FileText, label: 'Кадастровий номер', value: property.cadastralNumber, mono: true },
                  { icon: Maximize2, label: 'Площа', value: `${property.areaHa} га` },
                  { icon: FileText, label: 'Цільове призначення', value: property.landPurpose },
                  { icon: Clock, label: 'Дата реєстрації', value: property.registeredAt },
                ] as const).map((item) => (
                  <div key={item.label}>
                    <div
                      className="flex items-center gap-1.5"
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        marginBottom: 3,
                      }}
                    >
                      <item.icon size={11} />
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        fontFamily: 'mono' in item && item.mono ? "'JetBrains Mono', monospace" : undefined,
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}

                {/* Registered structures */}
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    Зареєстровані будівлі
                  </div>
                  {property.registeredStructures.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2"
                      style={{
                        padding: '6px 10px',
                        background: 'var(--success-subtle)',
                        borderRadius: 4,
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        marginBottom: 4,
                      }}
                    >
                      <CheckCircle size={13} style={{ color: 'var(--success)' }} />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Satellite Map */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Satellite size={16} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Супутниковий знімок
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Знімок від {analysis.satelliteImageDate}
                </span>
              </div>

              <div style={{ height: 420, position: 'relative' }}>
                <MapContainer
                  center={PARCEL_CENTER}
                  zoom={18}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                  zoomControl={true}
                >
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="Esri, Maxar, Earthstar Geographics"
                  />
                  <FitBounds bounds={PARCEL_BOUNDARY} />

                  {/* Parcel boundary */}
                  <Polygon
                    positions={PARCEL_BOUNDARY}
                    pathOptions={{
                      color: '#3B82F6',
                      weight: 2,
                      fillColor: '#3B82F6',
                      fillOpacity: 0.08,
                      dashArray: '6 4',
                    }}
                  />

                  {/* Detected structures */}
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
                          <strong>{s.type}</strong>
                          <br />
                          Площа: {s.estimatedAreaM2} м²
                          <br />
                          Впевненість: {s.confidence}%
                          <br />
                          <span
                            style={{
                              color: s.registeredInRegistry ? '#22C55E' : '#EF4444',
                              fontWeight: 600,
                            }}
                          >
                            {s.registeredInRegistry ? 'Зареєстровано' : 'Не зареєстровано'}
                          </span>
                        </div>
                      </Popup>
                    </Rectangle>
                  ))}
                </MapContainer>
              </div>

              {/* Legend */}
              <div
                className="flex items-center gap-5"
                style={{
                  padding: '10px 20px',
                  borderTop: '1px solid var(--border)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      border: '2px dashed #3B82F6',
                      background: 'rgba(59,130,246,0.08)',
                      display: 'inline-block',
                    }}
                  />
                  Межа ділянки
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      border: '2px solid #22C55E',
                      background: 'rgba(34,197,94,0.15)',
                      display: 'inline-block',
                    }}
                  />
                  Зареєстровано
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      border: '2px solid #EF4444',
                      background: 'rgba(239,68,68,0.25)',
                      display: 'inline-block',
                    }}
                  />
                  Не зареєстровано
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Results Table */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center gap-2">
                <Eye size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Результати аналізу
                </span>
              </div>
              <div className="flex items-center gap-4" style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Впевненість:{' '}
                  <strong
                    style={{
                      color: analysis.overallConfidence > 90 ? 'var(--success)' : 'var(--warning)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {analysis.overallConfidence}%
                  </strong>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  Дата аналізу: {analysis.analysisDate}
                </span>
              </div>
            </div>

            {/* Summary stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {[
                {
                  label: 'Виявлено структур',
                  value: analysis.detectedStructuresCount,
                  icon: Building2,
                  color: 'var(--accent)',
                },
                {
                  label: 'Зареєстровано',
                  value: analysis.registeredStructuresCount,
                  icon: CheckCircle,
                  color: 'var(--success)',
                },
                {
                  label: 'Не зареєстровано',
                  value: analysis.unauthorizedCount,
                  icon: XCircle,
                  color: 'var(--danger)',
                },
                {
                  label: 'Вплив на податки',
                  value: analysis.estimatedTaxImpact,
                  icon: TrendingUp,
                  color: 'var(--warning)',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: '16px 20px',
                    borderRight: '1px solid var(--border)',
                  }}
                >
                  <div
                    className="flex items-center gap-1.5"
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    <stat.icon size={12} style={{ color: stat.color }} />
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: stat.color,
                      fontFamily: typeof stat.value === 'number' ? "'JetBrains Mono', monospace" : undefined,
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Структура', 'Площа', 'Статус', 'Впевненість'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 20px',
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--surface-muted)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.detectedStructures.map((s) => (
                  <tr
                    key={s.id}
                    style={{
                      background: s.registeredInRegistry ? 'transparent' : 'var(--danger-subtle)',
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 20px',
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {s.type}
                    </td>
                    <td
                      style={{
                        padding: '12px 20px',
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        fontFamily: "'JetBrains Mono', monospace",
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {s.estimatedAreaM2} м²
                    </td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{
                          padding: '3px 10px',
                          borderRadius: 99,
                          fontSize: 12,
                          fontWeight: 500,
                          background: s.registeredInRegistry
                            ? 'var(--success-subtle)'
                            : 'var(--danger-subtle)',
                          color: s.registeredInRegistry ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {s.registeredInRegistry ? (
                          <CheckCircle size={12} />
                        ) : (
                          <XCircle size={12} />
                        )}
                        {s.registeredInRegistry ? 'Зареєстровано' : 'Не зареєстровано'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 20px',
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', monospace",
                        color:
                          s.confidence >= 90
                            ? 'var(--success)'
                            : s.confidence >= 80
                              ? 'var(--warning)'
                              : 'var(--text-secondary)',
                        fontWeight: 600,
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {s.confidence}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Timeline */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
              <Clock size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                Історія змін
              </span>
            </div>

            <div style={{ position: 'relative', paddingLeft: 24 }}>
              {/* Vertical line */}
              <div
                style={{
                  position: 'absolute',
                  left: 6,
                  top: 4,
                  bottom: 4,
                  width: 2,
                  background: 'var(--border)',
                  borderRadius: 1,
                }}
              />

              {timeline.map((entry, i) => {
                const dotColor =
                  entry.type === 'danger'
                    ? 'var(--danger)'
                    : entry.type === 'warning'
                      ? 'var(--warning)'
                      : 'var(--success)';
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3"
                    style={{
                      position: 'relative',
                      paddingBottom: i < timeline.length - 1 ? 20 : 0,
                    }}
                  >
                    {/* Dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: -20,
                        top: 4,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: dotColor,
                        border: '2px solid var(--surface)',
                        boxShadow: `0 0 0 2px ${dotColor}`,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: 'var(--text-muted)',
                          marginBottom: 2,
                        }}
                      >
                        {entry.date}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color:
                            entry.type === 'danger'
                              ? 'var(--danger)'
                              : entry.type === 'warning'
                                ? 'var(--text-secondary)'
                                : 'var(--text-primary)',
                          fontWeight: entry.type === 'danger' ? 500 : 400,
                        }}
                      >
                        {entry.event}
                      </div>
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
