import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { SectionHeader } from './SectionHeader';

interface LandingCapabilityItem {
  n: string;
  title: string;
  body: string;
  visual: 'compare' | 'detect' | 'rank' | 'review' | 'export';
}

export function LandingCapabilities() {
  const { t } = useTranslation();
  const section = {
    eyebrow: t('landingCapabilities.section.eyebrow'),
    titleStart: t('landingCapabilities.section.titleStart'),
    titleEmphasis: t('landingCapabilities.section.titleEmphasis'),
    titleEnd: t('landingCapabilities.section.titleEnd'),
  };
  const items: LandingCapabilityItem[] = [
    { n: 'i.', title: t('landingCapabilities.items.0.title'), body: t('landingCapabilities.items.0.body'), visual: 'compare' },
    { n: 'ii.', title: t('landingCapabilities.items.1.title'), body: t('landingCapabilities.items.1.body'), visual: 'detect' },
    { n: 'iii.', title: t('landingCapabilities.items.2.title'), body: t('landingCapabilities.items.2.body'), visual: 'rank' },
    { n: 'iv.', title: t('landingCapabilities.items.3.title'), body: t('landingCapabilities.items.3.body'), visual: 'review' },
    { n: 'v.', title: t('landingCapabilities.items.4.title'), body: t('landingCapabilities.items.4.body'), visual: 'export' },
  ];

  return (
    <section id="features" className="relative bg-landing-surface py-32 md:py-44">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <SectionHeader {...section} />

        <div className="mt-20 grid gap-px overflow-hidden rounded-xl bg-landing-border md:grid-cols-2">
          {items.map((item, index) => (
            <motion.article
              key={item.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.7, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="group flex flex-col gap-6 bg-landing-paper p-8 transition-colors hover:bg-landing-surface-elevated md:p-10"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-landing-display text-3xl italic text-landing-signal">{item.n}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                  {t('landingVisuals.feature')}
                </span>
              </div>

              <h3 className="font-landing-display text-3xl leading-[1.1] text-landing-ink md:text-4xl">
                {item.title}
              </h3>

              <p className="text-pretty text-base leading-relaxed text-landing-ink-soft">{item.body}</p>

              <div className="mt-2 aspect-[16/9] overflow-hidden rounded-lg border border-landing-border bg-landing-surface">
                <CapabilityVisual kind={item.visual} />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CapabilityVisual({
  kind,
}: {
  kind: 'compare' | 'detect' | 'rank' | 'review' | 'export';
}) {
  const { t } = useTranslation();

  if (kind === 'compare') {
    return (
      <div className="grid h-full grid-cols-2 gap-px bg-landing-border">
        {(['A', 'B'] as const).map((side, index) => (
            <div key={side} className="bg-landing-paper p-4">
              <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-landing-muted">
                {t('landingVisuals.sourceLabel', { letter: side })}
              </div>
            {[0, 1, 2, 3].map((row) => (
              <motion.div
                key={row}
                initial={{ opacity: 0, x: index === 0 ? -6 : 6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: row * 0.08, duration: 0.4 }}
                className={`my-1 h-3 rounded ${row === 2 ? 'bg-landing-signal/60' : 'bg-landing-secondary'}`}
                style={{ width: `${60 + ((row * 7 + index * 5) % 35)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (kind === 'detect') {
    return (
      <div className="relative h-full overflow-hidden p-4">
        <div className="landing-bg-rule-grid absolute inset-0 opacity-40" />
        <div className="relative grid h-full grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, index) => {
            const flagged = [3, 11, 18, 22, 30].includes(index);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.015, duration: 0.4 }}
                className={`rounded-sm ${flagged ? 'bg-landing-signal' : 'bg-landing-border-strong/40'}`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (kind === 'rank') {
    return (
      <div className="flex h-full flex-col justify-center gap-2 p-5">
        {[94, 81, 73, 58, 41].map((value, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="w-8 font-mono text-[10px] text-landing-muted">#{index + 1}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-landing-secondary">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${value}%` }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-landing-ink"
              />
            </div>
            <span className="w-8 text-right font-mono text-xs text-landing-ink">{value}</span>
          </div>
        ))}
      </div>
    );
  }

  if (kind === 'review') {
    return (
      <div className="grid h-full grid-cols-2 gap-px bg-landing-border">
        {(['A', 'B'] as const).map((source, index) => (
          <div key={source} className="bg-landing-paper p-4 font-mono text-[10px] text-landing-ink">
            <div className="mb-2 uppercase tracking-[0.16em] text-landing-muted">{t('landingVisuals.sourceLabel', { letter: source })}</div>
            <div className="space-y-1">
              <div>
                {t('landingVisuals.review.cadastral')} <span className="text-landing-ink-soft">32:01:2204</span>
              </div>
              <div>
                {t('landingVisuals.review.owner')}{' '}
                <span className={index === 1 ? 'bg-landing-signal/30' : ''}>{t('landingVisuals.review.ownerValue')}</span>
              </div>
              <div>
                {t('landingVisuals.review.status')}{' '}
                <span className={index === 1 ? 'bg-landing-signal/30' : ''}>
                  {index === 0 ? t('landingVisuals.review.active') : t('landingVisuals.review.terminated')}
                </span>
              </div>
              <div>
                {t('landingVisuals.review.area')} <span className="text-landing-ink-soft">{t('landingVisuals.review.areaValue')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center gap-3 p-4">
      {['cases.csv', 'report.pdf', 'audit.json'].map((file, index) => (
        <motion.div
          key={file}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.12, duration: 0.5 }}
          className="flex h-20 w-24 flex-col justify-between rounded border border-landing-border-strong bg-landing-paper p-2.5"
        >
          <span className="h-1 w-6 bg-landing-signal" />
          <span className="font-mono text-[10px] text-landing-ink">{file}</span>
        </motion.div>
      ))}
    </div>
  );
}
