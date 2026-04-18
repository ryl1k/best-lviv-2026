import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

import { landingHowSection, landingHowSteps } from '@/data/landing';

import { SectionHeader } from './SectionHeader';

export function LandingHowItWorks() {
  return (
    <section id="how" className="relative bg-landing-paper py-32 md:py-44">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <SectionHeader {...landingHowSection} />

        <div className="mt-20 space-y-32 md:space-y-44">
          {landingHowSteps.map((step, index) => (
            <Step key={step.n} index={index} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Step({
  step,
  index,
}: {
  step: (typeof landingHowSteps)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 80%', 'end 30%'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 1, 1, 0.5]);
  const reverse = index % 2 === 1;

  return (
    <div ref={ref} className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
      <motion.div
        style={{ opacity }}
        className={`md:col-span-5 ${reverse ? 'md:order-2 md:col-start-8' : ''}`}
      >
        <div className="sticky top-32">
          <div className="mb-6 flex items-baseline gap-4">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-landing-muted">Step</span>
            <span className="font-landing-display text-6xl leading-none text-landing-signal md:text-7xl">
              {step.n}
            </span>
          </div>
          <h3 className="font-landing-display text-4xl leading-[1.05] text-landing-ink md:text-5xl">
            {step.title}
          </h3>
          <p className="text-pretty mt-5 text-lg leading-relaxed text-landing-ink-soft">{step.body}</p>
        </div>
      </motion.div>

      <motion.div style={{ y }} className={`md:col-span-7 ${reverse ? 'md:order-1 md:col-start-1' : ''}`}>
        <StepVisual kind={step.visual} />
      </motion.div>
    </div>
  );
}

function StepVisual({
  kind,
}: {
  kind: 'ingest' | 'normalize' | 'match' | 'detect' | 'prioritize';
}) {
  return (
    <div className="landing-shadow-md relative aspect-[4/3] overflow-hidden rounded-xl border border-landing-border bg-landing-surface-elevated">
      <div className="landing-bg-rule-grid absolute inset-0 opacity-40" />
      <div className="relative h-full w-full p-6">
        {kind === 'ingest' && <IngestVisual />}
        {kind === 'normalize' && <NormalizeVisual />}
        {kind === 'match' && <MatchVisual />}
        {kind === 'detect' && <DetectVisual />}
        {kind === 'prioritize' && <PrioritizeVisual />}
      </div>
    </div>
  );
}

function IngestVisual() {
  return (
    <div className="flex h-full items-center justify-center gap-6">
      {['land_registry.xlsx', 'real_estate.xlsx'].map((file, index) => (
        <motion.div
          key={file}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ delay: index * 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="landing-shadow-md flex h-40 w-44 flex-col justify-between rounded border border-landing-border-strong bg-landing-paper p-4"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
              Source {String.fromCharCode(65 + index)}
            </span>
            <span className="h-2 w-2 rounded-full bg-landing-success" />
          </div>
          <div>
            <div className="font-mono text-xs text-landing-ink">{file}</div>
            <div className="mt-1 font-mono text-[10px] text-landing-muted">
              {(['10,824 rows', '10,832 rows'] as const)[index]}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function NormalizeVisual() {
  const columns = ['ІПН', 'Cadastral', 'Owner', 'Status', 'Date'];

  return (
    <div className="flex h-full flex-col justify-center gap-2">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="grid grid-cols-5 gap-2">
          {columns.map((column, columnIndex) => (
            <motion.div
              key={`${row}-${columnIndex}`}
              initial={{ opacity: 0, scaleX: 0.7 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: row * 0.1 + columnIndex * 0.05, duration: 0.5 }}
              className="h-7 origin-left rounded border border-landing-border bg-landing-paper px-2 font-mono text-[10px] leading-7 text-landing-ink"
            >
              {row === 0 ? column : '•••••'}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MatchVisual() {
  return (
    <svg viewBox="0 0 400 280" className="h-full w-full">
      {[0, 1, 2, 3].map((index) => {
        const y = 50 + index * 55;

        return (
          <g key={index}>
            <motion.rect
              x="20"
              y={y - 14}
              width="80"
              height="28"
              rx="4"
              fill="var(--landing-paper)"
              stroke="var(--landing-border-strong)"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            />
            <motion.rect
              x="300"
              y={y - 14}
              width="80"
              height="28"
              rx="4"
              fill="var(--landing-paper)"
              stroke="var(--landing-border-strong)"
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            />
            <motion.path
              d={`M 100 ${y} L 300 ${y}`}
              stroke={index === 2 ? 'var(--landing-signal)' : 'oklch(0.18 0.015 250 / 35%)'}
              strokeWidth={index === 2 ? 1.5 : 1}
              strokeDasharray={index === 2 ? '0' : '3 3'}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + index * 0.15, duration: 0.8 }}
            />
            <text x="60" y={y + 4} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="var(--landing-ink)">
              ІПН·{1000 + index * 17}
            </text>
            <text x="340" y={y + 4} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="var(--landing-ink)">
              {index === 2 ? '≠ value' : `ІПН·${1000 + index * 17}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DetectVisual() {
  const rows = [
    { code: 'R01', label: 'terminated rights · active land', risk: 92, flag: true },
    { code: 'R02', label: 'agricultural · commercial building', risk: 78, flag: true },
    { code: 'R03', label: 'owner present in both registries', risk: 22, flag: false },
    { code: 'R04', label: 'address mismatch ≥ 2 fields', risk: 56, flag: true },
    { code: 'R05', label: 'tax ID gap across sources', risk: 64, flag: true },
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-1.5">
      {rows.map((row, index) => (
        <motion.div
          key={row.code}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.08, duration: 0.5 }}
          className={`flex items-center gap-3 rounded px-3 py-2 ${row.flag ? 'border-l-2 border-landing-signal bg-landing-paper' : 'bg-landing-paper/40'}`}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-landing-ink-soft">
            {row.code}
          </span>
          <span className="flex-1 truncate text-[12px] text-landing-ink">{row.label}</span>
          <span className={`font-mono text-xs ${row.flag ? 'text-landing-signal' : 'text-landing-muted'}`}>
            {row.risk}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function PrioritizeVisual() {
  const cases = [
    { id: 'C-2841', risk: 94, status: 'NEW' },
    { id: 'C-2702', risk: 88, status: 'NEW' },
    { id: 'C-2655', risk: 81, status: 'IN REVIEW' },
    { id: 'C-2604', risk: 73, status: 'NEW' },
    { id: 'C-2541', risk: 66, status: 'IN REVIEW' },
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-2">
      {cases.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.08, duration: 0.5 }}
          className="flex items-center gap-4 rounded border border-landing-border bg-landing-paper px-3 py-2.5"
        >
          <span className="font-mono text-[11px] text-landing-ink">{item.id}</span>
          <div className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-landing-secondary">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${item.risk}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-landing-signal"
              />
            </div>
          </div>
          <span className="w-8 text-right font-mono text-xs text-landing-ink">{item.risk}</span>
          <span className="w-20 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-landing-muted">
            {item.status}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
