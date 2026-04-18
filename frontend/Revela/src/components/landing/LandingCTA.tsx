import { Link } from 'react-router';
import { motion } from 'framer-motion';

import { landingCta } from '@/data/landing';

export function LandingCTA() {
  return (
    <section id="cta" className="relative overflow-hidden bg-landing-ink py-32 text-landing-paper md:py-44">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="grid gap-8 border-b border-landing-paper/10 pb-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-landing-signal">{landingCta.eyebrow}</p>
          </div>
          <div className="md:col-span-9">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-landing-paper/50">
              {landingCta.subtitle}
            </span>
          </div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 font-landing-display text-[12vw] leading-[0.95] tracking-[-0.02em] text-landing-paper md:text-[8.4rem]"
        >
          {landingCta.titleStart} <br />
          <em className="italic text-landing-paper/60">{landingCta.titleEmphasis}</em> {landingCta.titleEnd}
        </motion.h2>

        <div className="mt-16 grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="text-pretty text-lg leading-relaxed text-landing-paper/70">{landingCta.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:col-span-6 md:justify-end">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-landing-paper px-6 py-3.5 text-sm font-medium text-landing-ink transition-all hover:opacity-90"
            >
              {landingCta.primaryCta}
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-landing-paper/20 px-6 py-3.5 text-sm font-medium text-landing-paper transition-colors hover:bg-landing-paper/5"
            >
              {landingCta.secondaryCta}
            </a>
          </div>
        </div>

        <div className="mt-32 grid grid-cols-2 gap-8 border-t border-landing-paper/10 pt-8 font-mono text-[11px] uppercase tracking-[0.16em] text-landing-paper/50 md:grid-cols-4">
          {landingCta.footerFacts.map((fact) => (
            <div key={fact.label}>
              <div className="text-landing-paper/30">{fact.label}</div>
              <div className="mt-2 text-landing-paper">{fact.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
