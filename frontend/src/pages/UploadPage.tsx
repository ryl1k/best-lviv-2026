import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet, Map, FileText, X, ArrowRight, Upload, PlayCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auditsApi, tasksApi, getApiErrorDetails } from '@/api';

type DropZoneId = 'property' | 'land';

interface SelectedFile {
  file: File;
  name: string;
  sizeMb: string;
}

interface DropZoneState {
  file: SelectedFile | null;
  isDragOver: boolean;
}

type DropZonesState = Record<DropZoneId, DropZoneState>;

const ACCEPTED_MIME_TYPES = new Set([
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
]);

const ACCEPTED_EXTENSIONS = /\.(xlsx|xls|csv)$/i;
const MAX_BYTES = 50 * 1024 * 1024;

function isValidFile(file: File): boolean {
  return (ACCEPTED_MIME_TYPES.has(file.type) || ACCEPTED_EXTENSIONS.test(file.name)) && file.size <= MAX_BYTES;
}

function toSelectedFile(file: File): SelectedFile {
  return { file, name: file.name, sizeMb: (file.size / 1024 / 1024).toFixed(2) };
}

const INITIAL_STATE: DropZonesState = {
  property: { file: null, isDragOver: false },
  land: { file: null, isDragOver: false },
};

const SIGNAL_COLOR = 'oklch(0.62 0.16 45)';

interface DropZoneProps {
  icon: React.ReactNode;
  label: string;
  caption: string;
  hint: string;
  readyText: string;
  removeLabel: string;
  mbLabel: string;
  state: DropZoneState;
  onFile: (file: File) => void;
  onRemove: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
}

function DropZone({ icon, label, caption, hint, readyText, removeLabel, mbLabel, state, onFile, onRemove, onDragOver, onDragLeave }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { file, isDragOver } = state;
  const hasFile = file !== null;

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (!hasFile) onDragOver(); }, [hasFile, onDragOver]);
  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); onDragLeave(); }, [onDragLeave]);
  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); onDragLeave();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && isValidFile(dropped)) onFile(dropped);
  }, [onFile, onDragLeave]);
  const handleClick = useCallback(() => { if (!hasFile) inputRef.current?.click(); }, [hasFile]);
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && isValidFile(selected)) onFile(selected);
    e.target.value = '';
  }, [onFile]);
  const handleRemove = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onRemove(); }, [onRemove]);

  return (
    <div
      role="button"
      tabIndex={hasFile ? -1 : 0}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex h-[280px] flex-col items-center justify-center rounded-2xl border-2 p-6 text-center transition-all duration-150',
        hasFile ? 'border-solid border-[var(--success)] bg-landing-surface' : isDragOver ? 'border-solid bg-landing-surface' : 'cursor-pointer border-dashed border-landing-border-strong bg-landing-surface hover:border-landing-ink-soft',
      )}
      style={isDragOver && !hasFile ? { borderColor: SIGNAL_COLOR, background: `color-mix(in oklch, ${SIGNAL_COLOR} 4%, var(--landing-surface))` } : undefined}
    >
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" tabIndex={-1} onChange={handleChange} />

      {hasFile ? (
        <>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--success-subtle)]" style={{ color: 'var(--success)' }}>
            <FileText size={24} />
          </div>
          <div className="mb-1 max-w-[240px] break-all text-base font-semibold text-landing-ink">{file.name}</div>
          <div className="mb-3 text-sm text-landing-muted">{file.sizeMb} {mbLabel} · {label}</div>
          <span className="inline-flex items-center gap-1 rounded bg-[var(--success-subtle)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: '#15803D' }}>
            <Check size={12} /> {readyText}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            aria-label={removeLabel}
            className="absolute right-3 top-3 rounded-md p-2 text-landing-muted transition-colors hover:bg-landing-secondary hover:text-landing-ink"
          >
            <X size={16} />
          </button>
        </>
      ) : (
        <>
          <div className="mb-3 text-landing-muted">{icon}</div>
          <div className="mb-1 text-base font-semibold text-landing-ink">{label}</div>
          <div className="mb-4 max-w-[280px] text-sm text-landing-muted">{caption}</div>
          <div className="font-mono text-xs text-landing-muted">{hint}</div>
        </>
      )}
    </div>
  );
}

export default function UploadPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [zones, setZones] = useState<DropZonesState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [requiresSubscription, setRequiresSubscription] = useState(false);

  const STEPS = [
    'Завантаження файлів',
    'Аналіз реєстру нерухомості',
    'Перевірка правил',
    'Формування звіту',
  ];

  const handleFile = useCallback((id: DropZoneId, file: File) => {
    setZones((prev) => ({ ...prev, [id]: { ...prev[id], file: toSelectedFile(file) } }));
  }, []);
  const handleRemove = useCallback((id: DropZoneId) => {
    setZones((prev) => ({ ...prev, [id]: { ...prev[id], file: null } }));
  }, []);
  const handleDragOver = useCallback((id: DropZoneId) => {
    setZones((prev) => ({ ...prev, [id]: { ...prev[id], isDragOver: true } }));
  }, []);
  const handleDragLeave = useCallback((id: DropZoneId) => {
    setZones((prev) => ({ ...prev, [id]: { ...prev[id], isDragOver: false } }));
  }, []);

  const bothFilesSelected = zones.property.file !== null && zones.land.file !== null;

  const handleAnalyze = useCallback(async () => {
    if (!bothFilesSelected) return;

    const estateFile = zones.property.file?.file;
    const landFile = zones.land.file?.file;
    if (!estateFile || !landFile) return;

    setSubmitError(null);
    setRequiresSubscription(false);
    setIsLoading(true);
    setProcessingStep(0);
    setProgress(0);

    let taskId: string;
    try {
      const response = await auditsApi.uploadFiles(landFile, estateFile);
      taskId = response.data.task_id;
      if (!taskId) throw new Error('Task id is missing in upload response');
    } catch (error) {
      const errorDetails = getApiErrorDetails(error, { context: 'upload' });
      setSubmitError(errorDetails.message);
      setRequiresSubscription(
        errorDetails.backendCode === 'no active subscription' ||
        errorDetails.backendCode === 'subscription tier is insufficient for this operation' ||
        errorDetails.backendCode === 'no tries remaining for this operation',
      );
      setIsLoading(false);
      return;
    }

    // Step 1 done — files uploaded
    setProcessingStep(1);
    setProgress(20);

    // Poll task status
    const pollInterval = setInterval(async () => {
      try {
        const { data: task } = await tasksApi.getTask(taskId);

        if (task.status === 'PROCESSING') {
          setProcessingStep(2);
          setProgress((p) => Math.min(p + 5, 75));
        }

        if (task.status === 'COMPLETED') {
          clearInterval(pollInterval);
          setProcessingStep(3);
          setProgress(95);
          setTimeout(() => {
            setProgress(100);
            setTimeout(() => navigate(`/tasks/${taskId}`), 400);
          }, 600);
        }

        if (task.status === 'FAILED') {
          clearInterval(pollInterval);
          setSubmitError(task.error_message ?? 'Помилка обробки файлів');
          setIsLoading(false);
        }
      } catch {
        // transient poll error — keep trying
      }
    }, 2000);
  }, [bothFilesSelected, navigate, zones.land.file, zones.property.file]);

  const steps = [
    { number: '01', icon: <Upload size={18} />, title: t('upload.step1Title'), desc: t('upload.step1Desc') },
    { number: '02', icon: <PlayCircle size={18} />, title: t('upload.step2Title'), desc: t('upload.step2Desc') },
    { number: '03', icon: <FileText size={18} />, title: t('upload.step3Title'), desc: t('upload.step3Desc') },
  ];

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(10,10,10,0.72)', backdropFilter: 'blur(4px)' }}>
          <div className="flex w-[340px] flex-col gap-6 rounded-2xl border border-landing-border bg-landing-paper p-8 shadow-xl">
            <div>
              <div className="mb-1 text-sm font-semibold text-landing-ink">Обробка даних...</div>
              <div className="text-xs text-landing-muted">{STEPS[Math.min(processingStep, STEPS.length - 1)]}</div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-landing-border">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%`, background: SIGNAL_COLOR }}
              />
            </div>

            {/* Steps */}
            <ul className="space-y-3">
              {STEPS.map((label, i) => {
                const done = i < processingStep;
                const active = i === processingStep;
                return (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    <span className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors',
                      done ? 'border-transparent text-white' : active ? 'border-transparent' : 'border-landing-border text-landing-muted',
                    )}
                      style={done ? { background: SIGNAL_COLOR } : active ? { background: SIGNAL_COLOR, color: '#fff' } : {}}
                    >
                      {done ? <Check size={10} /> : i + 1}
                    </span>
                    <span className={cn(
                      'transition-colors',
                      done ? 'text-landing-muted line-through' : active ? 'font-medium text-landing-ink' : 'text-landing-muted',
                    )}>
                      {label}
                    </span>
                    {active && <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: SIGNAL_COLOR }} />}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[960px] px-6 md:px-10">
        {/* Hero */}
        <section className="pb-12 pt-8 text-center">
          <h1 className="mx-auto mb-5 max-w-[720px] text-3xl font-semibold leading-tight tracking-tight text-landing-ink md:text-4xl">
            {t('upload.title')}
          </h1>
          <p className="mx-auto max-w-[640px] text-base leading-relaxed text-landing-ink-soft">
            {t('upload.subtitle')}
          </p>
        </section>

        {/* Drop zones */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DropZone
            icon={<FileSpreadsheet size={32} />}
            label={t('upload.estateLabel')}
            caption={t('upload.estateCaption')}
            hint={t('upload.fileHint')}
            readyText={t('upload.ready')}
            removeLabel={t('upload.removeFile')}
            mbLabel={t('upload.mb')}
            state={zones.property}
            onFile={(f) => handleFile('property', f)}
            onRemove={() => handleRemove('property')}
            onDragOver={() => handleDragOver('property')}
            onDragLeave={() => handleDragLeave('property')}
          />
          <DropZone
            icon={<Map size={32} />}
            label={t('upload.landLabel')}
            caption={t('upload.landCaption')}
            hint={t('upload.fileHint')}
            readyText={t('upload.ready')}
            removeLabel={t('upload.removeFile')}
            mbLabel={t('upload.mb')}
            state={zones.land}
            onFile={(f) => handleFile('land', f)}
            onRemove={() => handleRemove('land')}
            onDragOver={() => handleDragOver('land')}
            onDragLeave={() => handleDragLeave('land')}
          />
        </section>

        {/* CTA */}
        <section className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            disabled={!bothFilesSelected}
            onClick={handleAnalyze}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: bothFilesSelected ? SIGNAL_COLOR : 'var(--text-disabled)' }}
          >
            {t('upload.analyze')}
            <ArrowRight size={16} />
          </button>
          {!bothFilesSelected && (
            <p className="text-sm text-landing-muted">{t('upload.bothFiles')}</p>
          )}
          {submitError && (
            <>
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </p>
              {requiresSubscription && (
                <button
                  type="button"
                  onClick={() => navigate('/pricing')}
                  className="rounded-full border border-landing-ink bg-landing-ink px-4 py-2 text-sm font-medium text-landing-paper transition-colors hover:bg-landing-ink-soft"
                >
                  Перейти до тарифів
                </button>
              )}
            </>
          )}
        </section>

        {/* How it works */}
        <section className="mt-16">
          <div className="grid grid-cols-1 divide-y divide-landing-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col gap-3 px-0 py-6 first:sm:pl-0 last:sm:pr-0 sm:px-6 sm:py-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xl font-bold leading-none" style={{ color: SIGNAL_COLOR }}>{step.number}</span>
                  <span className="text-landing-muted">{step.icon}</span>
                </div>
                <h2 className="text-sm font-semibold text-landing-ink">{step.title}</h2>
                <p className="text-sm leading-relaxed text-landing-ink-soft">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust */}
        <footer className="mt-8 pb-16 text-center text-xs text-landing-muted">
          {t('upload.trust')}
        </footer>
      </main>
    </>
  );
}
