import { Link } from 'react-router';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

import { landingHero } from '@/data/landing';

import { RegistryMergeScene } from './scenes/RegistryMergeScene';

export function LandingHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const titleY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} id="top" className="landing-bg-paper-grain relative overflow-hidden pt-32 md:pt-40">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-landing-muted"
        >
          <span className="flex items-center gap-2">
            <span className="landing-signal-dot landing-animate-pulse-soft" />
            {landingHero.status}
          </span>
          <span className="hidden md:inline">{landingHero.volume}</span>
        </motion.div>

        <motion.div style={{ y: titleY, opacity: titleOpacity }} className="relative">
          <h1 className="font-landing-display text-[14vw] leading-[0.92] tracking-[-0.025em] text-landing-ink md:text-[9.5vw] lg:text-[8.2rem]">
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              {landingHero.titleLineOne}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              <em className="italic text-landing-ink-soft">{landingHero.titleLineTwoEmphasis} </em>
              {landingHero.titleLineTwoSuffix}
            </motion.span>
          </h1>

          <div className="mt-12 grid gap-8 md:grid-cols-12 md:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.5 }}
              className="md:col-span-5 md:col-start-1"
            >
              <p className="text-pretty text-lg leading-relaxed text-landing-ink-soft md:text-xl">
                {landingHero.description}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.65 }}
              className="flex flex-wrap items-center gap-3 md:col-span-5 md:col-start-8 md:justify-end"
            >
              <a
                href={landingHero.primaryCta.href}
                className="group inline-flex items-center gap-2 rounded-full bg-landing-ink px-5 py-3 text-sm font-medium text-landing-paper transition-all hover:bg-landing-ink-soft"
              >
                {landingHero.primaryCta.label}
                <span className="transition-transform group-hover:translate-x-0.5">↓</span>
              </a>
              <a
                href={landingHero.secondaryCta.href}
                className="inline-flex items-center gap-2 rounded-full border border-landing-border-strong bg-transparent px-5 py-3 text-sm font-medium text-landing-ink transition-colors hover:bg-landing-surface"
              >
                {landingHero.secondaryCta.label}
              </a>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-landing-border-strong px-5 py-3 text-sm font-medium text-landing-ink transition-colors hover:bg-landing-surface"
              >
                Sign in
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-20 md:mt-28"
        >
          <RegistryMergeScene />
        </motion.div>

        <div className="mt-20 grid grid-cols-2 gap-8 border-t border-landing-border pt-8 font-mono text-[11px] uppercase tracking-[0.16em] text-landing-muted md:mt-28 md:grid-cols-4">
          {landingHero.footerFacts.map((fact) => (
            <div key={fact.label}>
              <div className="text-landing-ink/40">{fact.label}</div>
              <div className="mt-2 text-landing-ink">{fact.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
