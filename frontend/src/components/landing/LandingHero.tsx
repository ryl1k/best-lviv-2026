import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { RegistryMergeScene } from './scenes/RegistryMergeScene';

export function LandingHero() {
  const { t } = useTranslation();

  return (
    <section id="top" className="landing-bg-paper-grain relative overflow-hidden pt-32 md:pt-40">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-landing-muted"
        >
          <span className="flex items-center gap-2">
            <span className="landing-signal-dot landing-animate-pulse-soft" />
            {t('hero.status')}
          </span>
          <span className="hidden md:inline">{t('hero.volume')}</span>
        </motion.div>

        <div className="relative">
          <h1 className="text-[14vw] font-semibold leading-[0.92] tracking-[-0.035em] text-landing-ink md:text-[9.5vw] lg:text-[8.2rem]">
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              {t('hero.titleLineOne')}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              <em className="italic text-landing-ink-soft">{t('hero.titleLineTwoEmphasis')} </em>
              {t('hero.titleLineTwoSuffix')}
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
                {t('hero.description')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.65 }}
              className="flex flex-wrap items-center gap-3 md:col-span-5 md:col-start-8 md:justify-end"
            >
              <a
                href="#stats"
                className="group inline-flex items-center gap-2 rounded-full bg-landing-ink px-5 py-3 text-sm font-medium text-landing-paper transition-all hover:bg-landing-ink-soft"
              >
                {t('hero.primaryCta')}
                <span className="transition-transform group-hover:translate-x-0.5">↓</span>
              </a>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 rounded-full border border-landing-border-strong bg-transparent px-5 py-3 text-sm font-medium text-landing-ink transition-colors hover:bg-landing-surface no-underline"
              >
                {t('hero.secondaryCta')}
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-landing-border-strong px-5 py-3 text-sm font-medium text-landing-ink transition-colors hover:bg-landing-surface no-underline"
              >
                {t('hero.signIn')}
              </Link>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-20 md:mt-28"
        >
          <RegistryMergeScene />
        </motion.div>

      </div>
    </section>
  );
}
