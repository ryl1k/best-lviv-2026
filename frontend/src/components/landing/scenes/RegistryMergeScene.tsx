import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const LEFT_RECORDS = [
  { id: 'ID-4429', labelKey: 'landingVisuals.registryScene.left.0', ok: true },
  { id: 'ID-4431', labelKey: 'landingVisuals.registryScene.left.1', ok: true },
  { id: 'ID-4434', labelKey: 'landingVisuals.registryScene.left.2', ok: false },
  { id: 'ID-4438', labelKey: 'landingVisuals.registryScene.left.3', ok: true },
];

const RIGHT_RECORDS = [
  { id: 'RE-9120', labelKey: 'landingVisuals.registryScene.right.0', ok: true },
  { id: 'RE-9121', labelKey: 'landingVisuals.registryScene.right.1', ok: false },
  { id: 'RE-9123', labelKey: 'landingVisuals.registryScene.right.2', ok: true },
  { id: 'RE-9128', labelKey: 'landingVisuals.registryScene.right.3', ok: true },
];

const FLAGGED_CASES = [
  { code: 'R01', labelKey: 'scene.r01', risk: 92 },
  { code: 'R02', labelKey: 'scene.r02', risk: 78 },
  { code: 'R05', labelKey: 'scene.r05', risk: 64 },
];

export function RegistryMergeScene() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const { t } = useTranslation();

  return (
    <div
      ref={ref}
      className="landing-paper-noise landing-shadow-xl relative overflow-hidden rounded-2xl border border-landing-border bg-landing-surface-elevated"
    >
      <div className="flex items-center justify-between border-b border-landing-border px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
        <div className="flex items-center gap-2">
          <span className="landing-signal-dot landing-animate-pulse-soft" />
          {t('scene.liveAudit')}
        </div>
        <div className="hidden gap-6 md:flex">
          <span>{t('scene.sourceA')}</span>
          <span>{t('scene.sourceB')}</span>
          <span className="text-landing-signal">{t('scene.output')}</span>
        </div>
      </div>

      <div className="relative grid grid-cols-12 gap-0">
        <div className="col-span-4 border-r border-landing-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
              {t('scene.leftLabel')}
            </span>
            <span className="font-mono text-[10px] text-landing-muted">.xlsx</span>
          </div>
          <div className="space-y-2">
            {LEFT_RECORDS.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -12 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
                className="flex items-center justify-between rounded border border-landing-border bg-landing-paper px-3 py-2 font-mono text-[11px] text-landing-ink"
              >
                <span>{record.id}</span>
                <span className="hidden truncate text-landing-ink-soft md:inline">{t(record.labelKey)}</span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${record.ok ? 'bg-landing-success' : 'bg-landing-signal'}`}
                />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative col-span-4 overflow-hidden">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 400 360"
            preserveAspectRatio="none"
            fill="none"
          >
            {[60, 120, 200, 280].map((y, index) => (
              <motion.path
                key={`left-${index}`}
                d={`M 0 ${y} C 120 ${y}, 160 180, 200 180`}
                stroke="oklch(0.18 0.015 250 / 25%)"
                strokeWidth="1"
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : {}}
                transition={{ delay: 0.4 + index * 0.08, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
            {[60, 120, 200, 280].map((y, index) => (
              <motion.path
                key={`right-${index}`}
                d={`M 400 ${y} C 280 ${y}, 240 180, 200 180`}
                stroke="oklch(0.18 0.015 250 / 25%)"
                strokeWidth="1"
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : {}}
                transition={{ delay: 0.5 + index * 0.08, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
            <motion.path
              d="M 200 180 L 200 340"
              stroke="var(--landing-signal)"
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={{ delay: 1.5, duration: 0.8 }}
            />
          </svg>

          <div className="relative flex h-full min-h-[360px] items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="landing-shadow-lg relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full border border-landing-border-strong bg-landing-paper text-center"
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-landing-muted">{t('scene.audit')}</div>
              <div className="font-landing-display text-2xl leading-none text-landing-ink">Revela</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-landing-signal">
                {t('scene.rules')}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="col-span-4 border-l border-landing-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
              {t('scene.rightLabel')}
            </span>
            <span className="font-mono text-[10px] text-landing-muted">.xlsx</span>
          </div>
          <div className="space-y-2">
            {RIGHT_RECORDS.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: 12 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                className="flex items-center justify-between rounded border border-landing-border bg-landing-paper px-3 py-2 font-mono text-[11px] text-landing-ink"
              >
                <span>{record.id}</span>
                <span className="hidden truncate text-landing-ink-soft md:inline">{t(record.labelKey)}</span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${record.ok ? 'bg-landing-success' : 'bg-landing-signal'}`}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-landing-border bg-landing-paper px-6 py-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-ink-soft">
            {t('scene.bottomLabel')}
          </span>
          <span className="font-mono text-[10px] text-landing-signal">{t('scene.bottomSummary')}</span>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {FLAGGED_CASES.map((item, index) => (
            <motion.div
              key={item.code}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.8 + index * 0.12, duration: 0.6 }}
              className="flex items-center justify-between rounded border-l-2 border-landing-signal bg-landing-surface px-3 py-2.5"
            >
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-landing-signal">
                  {item.code}
                </div>
                <div className="text-[12px] text-landing-ink">{t(item.labelKey)}</div>
              </div>
              <div className="font-mono text-sm font-medium text-landing-ink">{item.risk}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
