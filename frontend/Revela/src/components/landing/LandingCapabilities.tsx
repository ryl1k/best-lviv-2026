import { motion } from 'framer-motion';

import { landingCapabilitiesItems, landingCapabilitiesSection } from '@/data/landing';

import { SectionHeader } from './SectionHeader';

export function LandingCapabilities() {
  return (
    <section id="features" className="relative bg-landing-surface py-32 md:py-44">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <SectionHeader {...landingCapabilitiesSection} />

        <div className="mt-20 grid gap-px overflow-hidden rounded-xl bg-landing-border md:grid-cols-2">
          {landingCapabilitiesItems.map((item, index) => (
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
                  Feature
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
  if (kind === 'compare') {
    return (
      <div className="grid h-full grid-cols-2 gap-px bg-landing-border">
        {(['A', 'B'] as const).map((side, index) => (
          <div key={side} className="bg-landing-paper p-4">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-landing-muted">
              Source {side}
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
            <div className="mb-2 uppercase tracking-[0.16em] text-landing-muted">Source {source}</div>
            <div className="space-y-1">
              <div>
                cad. <span className="text-landing-ink-soft">32:01:2204</span>
              </div>
              <div>
                owner{' '}
                <span className={index === 1 ? 'bg-landing-signal/30' : ''}>ТОВ «Зелений лан»</span>
              </div>
              <div>
                status{' '}
                <span className={index === 1 ? 'bg-landing-signal/30' : ''}>
                  {index === 0 ? 'active' : 'terminated'}
                </span>
              </div>
              <div>
                area <span className="text-landing-ink-soft">2.40 ha</span>
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
