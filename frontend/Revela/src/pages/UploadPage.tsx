import { useRef, useState, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router'
import {
  FileSpreadsheet,
  Map,
  FileText,
  X,
  ArrowRight,
  Upload,
  PlayCircle,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DropZoneId = 'property' | 'land'

interface SelectedFile {
  file: File
  name: string
  sizeMb: string
}

interface DropZoneState {
  file: SelectedFile | null
  isDragOver: boolean
}

type DropZonesState = Record<DropZoneId, DropZoneState>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACCEPTED_MIME_TYPES = new Set([
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
])

const ACCEPTED_EXTENSIONS = /\.(xlsx|xls|csv)$/i
const MAX_BYTES = 50 * 1024 * 1024

function isValidFile(file: File): boolean {
  return (
    (ACCEPTED_MIME_TYPES.has(file.type) || ACCEPTED_EXTENSIONS.test(file.name)) &&
    file.size <= MAX_BYTES
  )
}

function toSelectedFile(file: File): SelectedFile {
  return {
    file,
    name: file.name,
    sizeMb: (file.size / 1024 / 1024).toFixed(2),
  }
}

// ---------------------------------------------------------------------------
// Zone configs
// ---------------------------------------------------------------------------

interface ZoneConfig {
  id: DropZoneId
  icon: React.ReactNode
  label: string
  caption: string
  hint: string
}

const ZONE_CONFIGS: ZoneConfig[] = [
  {
    id: 'property',
    icon: <FileSpreadsheet size={32} aria-hidden="true" />,
    label: 'Реєстр нерухомості',
    caption: 'ДРПП — файл з власниками будівель',
    hint: '.xlsx, .xls, .csv · до 50 МБ',
  },
  {
    id: 'land',
    icon: <Map size={32} aria-hidden="true" />,
    label: 'Земельний реєстр',
    caption: 'ДЗК — файл з кадастровими даними',
    hint: '.xlsx, .xls, .csv · до 50 МБ',
  },
]

const INITIAL_STATE: DropZonesState = {
  property: { file: null, isDragOver: false },
  land: { file: null, isDragOver: false },
}

// ---------------------------------------------------------------------------
// How it works steps
// ---------------------------------------------------------------------------

const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    icon: <Upload size={18} aria-hidden="true" />,
    title: 'Завантаження',
    description: 'Excel або CSV. Обидва реєстри одночасно.',
  },
  {
    number: '02',
    icon: <PlayCircle size={18} aria-hidden="true" />,
    title: 'Аналіз',
    description: 'Нормалізація, зіставлення, 7 правил перевірки.',
  },
  {
    number: '03',
    icon: <FileText size={18} aria-hidden="true" />,
    title: 'Результат',
    description: 'Перелік розбіжностей з пріоритетами для перевірки.',
  },
]

// ---------------------------------------------------------------------------
// Loading overlay messages
// ---------------------------------------------------------------------------

const LOADING_MESSAGES = [
  'Завантаження файлів…',
  'Нормалізація даних…',
  'Зіставлення реєстрів…',
  'Перевірка правил…',
  'Формування результатів…',
]

// ---------------------------------------------------------------------------
// DropZone component
// ---------------------------------------------------------------------------

interface DropZoneProps {
  config: ZoneConfig
  state: DropZoneState
  onFile: (id: DropZoneId, file: File) => void
  onRemove: (id: DropZoneId) => void
  onDragOver: (id: DropZoneId) => void
  onDragLeave: (id: DropZoneId) => void
}

function DropZone({ config, state, onFile, onRemove, onDragOver, onDragLeave }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { id, icon, label, caption, hint } = config
  const { file, isDragOver } = state
  const hasFile = file !== null

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (!hasFile) onDragOver(id)
    },
    [id, hasFile, onDragOver],
  )

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      onDragLeave(id)
    },
    [id, onDragLeave],
  )

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      onDragLeave(id)
      const dropped = e.dataTransfer.files?.[0]
      if (dropped && isValidFile(dropped)) {
        onFile(id, dropped)
      }
    },
    [id, onFile, onDragLeave],
  )

  const handleClick = useCallback(() => {
    if (!hasFile) inputRef.current?.click()
  }, [hasFile])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!hasFile && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        inputRef.current?.click()
      }
    },
    [hasFile],
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (selected && isValidFile(selected)) {
        onFile(id, selected)
      }
      e.target.value = ''
    },
    [id, onFile],
  )

  const handleRemove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onRemove(id)
    },
    [id, onRemove],
  )

  return (
    <div
      role="button"
      tabIndex={hasFile ? -1 : 0}
      aria-label={`Завантажити файл: ${label}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        height: 280,
        border: `2px ${hasFile ? 'solid' : 'dashed'} ${
          hasFile
            ? 'var(--success)'
            : isDragOver
            ? 'var(--accent)'
            : 'var(--border-strong)'
        }`,
        borderRadius: 12,
        background: isDragOver && !hasFile ? 'var(--accent-subtle)' : 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        cursor: hasFile ? 'default' : 'pointer',
        transition: 'border-color 150ms, background-color 150ms',
        textAlign: 'center',
        position: 'relative',
      }}
      className={cn(
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
        !hasFile && !isDragOver && 'hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)]',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        tabIndex={-1}
        onChange={handleChange}
        aria-hidden="true"
      />

      {hasFile ? (
        <>
          {/* File icon in success-subtle bubble */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: 'var(--success-subtle)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <FileText size={24} aria-hidden="true" />
          </div>

          {/* File name */}
          <div
            style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, maxWidth: 240, wordBreak: 'break-all' }}
          >
            {file.name}
          </div>

          {/* Size · label */}
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            {file.sizeMb} МБ · {label}
          </div>

          {/* "Готово" chip */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              height: 22,
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              background: 'var(--success-subtle)',
              color: '#15803D',
              marginTop: 4,
            }}
          >
            <Check size={12} aria-hidden="true" /> Готово
          </span>

          {/* Remove button */}
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Видалити файл"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 32,
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            className="hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-colors duration-[150ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </>
      ) : (
        <>
          <div style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{icon}</div>

          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
            {label}
          </div>

          <div
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              marginBottom: 16,
              maxWidth: 280,
            }}
          >
            {caption}
          </div>

          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: 'var(--text-disabled)',
            }}
          >
            {hint}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading overlay
// ---------------------------------------------------------------------------

interface LoadingOverlayProps {
  onCancel: () => void
}

function LoadingOverlay({ onCancel }: LoadingOverlayProps) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 10, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      role="status"
      aria-label="Аналіз виконується"
    >
      {/* Card */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          minWidth: 280,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* CSS spinner */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '3px solid var(--accent-subtle)',
            borderTopColor: 'var(--accent)',
            animation: 'revela-spin 0.75s linear infinite',
          }}
          aria-hidden="true"
        />

        {/* Animated message */}
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: 'var(--text-primary)',
            minHeight: 24,
            textAlign: 'center',
            transition: 'opacity 300ms',
          }}
        >
          {LOADING_MESSAGES[msgIndex]}
        </div>

        {/* Cancel ghost button */}
        <button
          type="button"
          onClick={onCancel}
          style={{
            marginTop: 4,
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid var(--border-strong)',
            background: 'none',
            fontSize: 13,
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
          className="hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-colors duration-[150ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Скасувати
        </button>
      </div>

      {/* Spinner keyframe injected inline */}
      <style>{`
        @keyframes revela-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UploadPage() {
  const navigate = useNavigate()
  const [zones, setZones] = useState<DropZonesState>(INITIAL_STATE)
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleFile = useCallback((id: DropZoneId, file: File) => {
    setZones((prev) => ({
      ...prev,
      [id]: { ...prev[id], file: toSelectedFile(file) },
    }))
  }, [])

  const handleRemove = useCallback((id: DropZoneId) => {
    setZones((prev) => ({
      ...prev,
      [id]: { ...prev[id], file: null },
    }))
  }, [])

  const handleDragOver = useCallback((id: DropZoneId) => {
    setZones((prev) => ({
      ...prev,
      [id]: { ...prev[id], isDragOver: true },
    }))
  }, [])

  const handleDragLeave = useCallback((id: DropZoneId) => {
    setZones((prev) => ({
      ...prev,
      [id]: { ...prev[id], isDragOver: false },
    }))
  }, [])

  const bothFilesSelected = zones.property.file !== null && zones.land.file !== null

  const handleAnalyze = useCallback(() => {
    if (!bothFilesSelected) return
    setIsLoading(true)
    timerRef.current = setTimeout(() => {
      navigate('/tasks/a4f2')
    }, 2400)
  }, [bothFilesSelected, navigate])

  const handleCancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsLoading(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <>
      {isLoading && <LoadingOverlay onCancel={handleCancel} />}

      <main className="min-h-screen bg-[var(--background)] px-4">
        <div className="mx-auto w-full max-w-[960px]">

          {/* ---------------------------------------------------------------- */}
          {/* Hero                                                              */}
          {/* ---------------------------------------------------------------- */}
          <section className="pb-12 pt-16 text-center">
            {/* Hackathon chip */}
            <div className="mb-5 inline-flex items-center justify-center">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 12px',
                  borderRadius: 9999,
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                ХАКАТОН INNOVATE 2026
              </span>
            </div>

            {/* H1 */}
            <h1
              style={{
                margin: '0 auto 20px',
                maxWidth: 720,
                fontSize: 40,
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              Завантажте два реєстри — ми знайдемо що не сходиться
            </h1>

            {/* Subtitle */}
            <p
              style={{
                margin: '0 auto',
                maxWidth: 640,
                fontSize: 16,
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
              }}
            >
              Revela автоматично зіставляє земельний реєстр і реєстр нерухомості,
              виявляє розбіжності та формує перелік об'єктів для перевірки.
            </p>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Drop zones                                                        */}
          {/* ---------------------------------------------------------------- */}
          <section aria-label="Завантаження файлів">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ZONE_CONFIGS.map((config) => (
                <DropZone
                  key={config.id}
                  config={config}
                  state={zones[config.id]}
                  onFile={handleFile}
                  onRemove={handleRemove}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                />
              ))}
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* CTA                                                               */}
          {/* ---------------------------------------------------------------- */}
          <section className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              disabled={!bothFilesSelected}
              onClick={handleAnalyze}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 48,
                padding: '0 20px',
                borderRadius: 8,
                border: 'none',
                background: bothFilesSelected ? 'var(--accent)' : 'var(--border-strong)',
                color: bothFilesSelected ? '#FFFFFF' : 'var(--text-disabled)',
                fontSize: 15,
                fontWeight: 600,
                cursor: bothFilesSelected ? 'pointer' : 'not-allowed',
                transition: 'background-color 150ms, color 150ms',
              }}
              className={cn(
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
                bothFilesSelected && 'hover:bg-[var(--accent-hover)]',
              )}
              aria-disabled={!bothFilesSelected}
            >
              Запустити аналіз
              <ArrowRight size={16} aria-hidden="true" />
            </button>

            {!bothFilesSelected && (
              <p
                className="text-sm text-[var(--text-muted)]"
                role="status"
                aria-live="polite"
              >
                Завантажте обидва файли, щоб продовжити
              </p>
            )}
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* How it works                                                      */}
          {/* ---------------------------------------------------------------- */}
          <section aria-label="Як це працює" className="mt-16">
            <div className="grid grid-cols-1 divide-y divide-[var(--border)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {HOW_IT_WORKS_STEPS.map((step) => (
                <div
                  key={step.number}
                  className="flex flex-col gap-3 px-0 py-6 sm:px-6 sm:py-0 first:sm:pl-0 last:sm:pr-0"
                >
                  {/* Number + icon row */}
                  <div className="flex items-center gap-3">
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 20,
                        fontWeight: 700,
                        color: 'var(--accent)',
                        lineHeight: 1,
                      }}
                      aria-hidden="true"
                    >
                      {step.number}
                    </span>
                    <span
                      style={{ color: 'var(--text-muted)' }}
                      aria-hidden="true"
                    >
                      {step.icon}
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {step.title}
                  </h2>

                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Trust strip                                                       */}
          {/* ---------------------------------------------------------------- */}
          <footer
            className="mt-8 pb-16 text-center"
            style={{ fontSize: 12, color: 'var(--text-muted)' }}
          >
            Дані не покидають ваш сервер · Аудит-лог всіх операцій · Сумісно з Trembita
          </footer>

        </div>
      </main>
    </>
  )
}
