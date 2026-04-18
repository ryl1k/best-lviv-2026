import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import {
  landingInterfaceContent,
  landingInterfaceSection,
  landingInterfaceStates,
  type LandingInterfaceState,
} from '@/data/landing';

import { SectionHeader } from './SectionHeader';

const stateOrder = landingInterfaceStates.map((state) => state.key);

export function LandingInterfacePreview() {
  const [state, setState] = useState<LandingInterfaceState>('upload');

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setState((current) => stateOrder[(stateOrder.indexOf(current) + 1) % stateOrder.length]);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section id="interface" className="relative bg-landing-surface py-32 md:py-44">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <SectionHeader {...landingInterfaceSection} />

        <div className="mt-16 grid gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <ul className="space-y-1">
              {landingInterfaceStates.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => setState(item.key)}
                    className={`group flex w-full items-center justify-between border-l-2 py-3 pl-4 pr-2 text-left transition-all ${
                      state === item.key
                        ? 'border-landing-signal text-landing-ink'
                        : 'border-transparent text-landing-muted hover:border-landing-border-strong hover:text-landing-ink'
                    }`}
                  >
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em]">{item.label}</span>
                    {state === item.key ? <span className="landing-signal-dot" /> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-9">
            <div className="landing-paper-noise landing-shadow-xl relative overflow-hidden rounded-xl border border-landing-border bg-landing-paper">
              <div className="flex items-center justify-between border-b border-landing-border px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-landing-border-strong" />
                  <span className="h-2.5 w-2.5 rounded-full bg-landing-border-strong" />
                  <span className="h-2.5 w-2.5 rounded-full bg-landing-border-strong" />
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
                  revela.app / {state}
                </div>
                <div className="w-12" />
              </div>

              <div className="relative min-h-[480px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={state}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 p-6 md:p-8"
                  >
                    {state === 'upload' ? <UploadView /> : null}
                    {state === 'dashboard' ? <DashboardView /> : null}
                    {state === 'table' ? <TableView /> : null}
                    {state === 'case' ? <CaseView /> : null}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function UploadView() {
  const { upload } = landingInterfaceContent;

  return (
    <div className="flex h-full flex-col">
      <h4 className="font-landing-display text-2xl text-landing-ink">{upload.title}</h4>
      <p className="mt-1 text-sm text-landing-muted">{upload.description}</p>
      <div className="mt-8 grid flex-1 gap-4 md:grid-cols-2">
        {upload.files.map((file) => (
          <div
            key={file.label}
            className="relative flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-landing-border-strong bg-landing-surface p-10"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
              {file.label}
            </span>
            <div className="font-landing-display text-xl text-landing-ink">{file.file}</div>
            <div className="font-mono text-[11px] text-landing-muted">{file.meta}</div>
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-landing-success" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <span className="font-mono text-[11px] text-landing-muted">{upload.footer}</span>
        <button type="button" className="rounded-full bg-landing-ink px-5 py-2.5 text-sm font-medium text-landing-paper">
          {upload.cta}
        </button>
      </div>
    </div>
  );
}

function DashboardView() {
  const { dashboard } = landingInterfaceContent;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between">
        <h4 className="font-landing-display text-2xl text-landing-ink">{dashboard.title}</h4>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
          {dashboard.meta}
        </span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {dashboard.cards.map((card) => (
          <div key={card.key} className="rounded-md border border-landing-border bg-landing-surface p-4">
            <div className="font-landing-display text-3xl text-landing-ink">{card.value}</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-landing-muted">{card.key}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex-1 rounded-md border border-landing-border bg-landing-surface p-5">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
          {dashboard.chartLabel}
        </div>
        <div className="space-y-2">
          {dashboard.rules.map((rule) => (
            <div key={rule.code} className="flex items-center gap-3">
              <span className="w-10 font-mono text-[10px] text-landing-ink">{rule.code}</span>
              <div className="h-2 flex-1 rounded-full bg-landing-secondary">
                <div className="h-full rounded-full bg-landing-ink" style={{ width: `${rule.value}%` }} />
              </div>
              <span className="w-8 text-right font-mono text-xs text-landing-ink">{rule.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TableView() {
  const { table } = landingInterfaceContent;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between">
        <h4 className="font-landing-display text-2xl text-landing-ink">{table.title}</h4>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">{table.meta}</span>
      </div>
      <div className="mt-5 overflow-hidden rounded-md border border-landing-border">
        <div className="grid grid-cols-12 border-b border-landing-border bg-landing-surface px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-landing-muted">
          <div className="col-span-2">{table.columns[0]}</div>
          <div className="col-span-2">{table.columns[1]}</div>
          <div className="col-span-5">{table.columns[2]}</div>
          <div className="col-span-3 text-right">{table.columns[3]}</div>
        </div>
        {table.rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-12 items-center border-b border-landing-border px-4 py-2.5 last:border-0"
          >
            <div className="col-span-2 font-mono text-xs text-landing-ink">{row.id}</div>
            <div className="col-span-2 font-mono text-xs text-landing-signal">{row.rule}</div>
            <div className="col-span-5 flex items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full bg-landing-secondary">
                <div className="h-full rounded-full bg-landing-signal" style={{ width: `${row.risk}%` }} />
              </div>
              <span className="font-mono text-xs text-landing-ink">{row.risk}</span>
            </div>
            <div className="col-span-3 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-landing-muted">
              {row.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseView() {
  const { case: caseContent } = landingInterfaceContent;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between">
        <div>
          <h4 className="font-landing-display text-2xl text-landing-ink">{caseContent.title}</h4>
          <div className="mt-1 font-mono text-[11px] text-landing-muted">{caseContent.meta}</div>
        </div>
        <button type="button" className="rounded-full border border-landing-border-strong px-4 py-1.5 text-xs text-landing-ink">
          {caseContent.action}
        </button>
      </div>
      <div className="mt-5 grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-md border border-landing-border bg-landing-border">
        {caseContent.sources.map((source, sourceIndex) => (
          <div key={source} className="bg-landing-paper p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">{source}</div>
            <dl className="mt-4 space-y-2 font-mono text-[12px] text-landing-ink">
              {caseContent.rows.map((row) => (
                <CaseRow
                  key={row.key}
                  label={row.key}
                  value={row.values[sourceIndex]}
                  highlight={row.highlight}
                />
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-landing-muted">{label}</dt>
      <dd className={highlight ? 'rounded bg-landing-signal/15 px-1.5 py-0.5 text-landing-ink' : 'text-landing-ink'}>
        {value}
      </dd>
    </div>
  );
}
