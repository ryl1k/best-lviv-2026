import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const TICKER_KEYS = [
  'ticker.crossRegistry',
  'ticker.satellite',
  'ticker.rules',
  'ticker.riskScoring',
  'ticker.export',
  'ticker.speed',
  'ticker.noApi',
  'ticker.pilot',
  'ticker.communities',
  'ticker.records',
  'ticker.municipalities',
  'ticker.decision',
];

export function LandingStats() {
  const { t } = useTranslation();

  const stats = [
    { value: t('stats.recordsValue'), label: t('stats.recordsLabel'), detail: t('stats.recordsDetail') },
    { value: t('stats.discrepanciesValue'), label: t('stats.discrepanciesLabel'), detail: t('stats.discrepanciesDetail') },
    { value: t('stats.timeValue'), label: t('stats.timeLabel'), detail: t('stats.timeDetail') },
    { value: t('stats.lossesValue'), label: t('stats.lossesLabel'), detail: t('stats.lossesDetail') },
  ];

  const advantages = [
    { title: t('advantages.registryTitle'), description: t('advantages.registryDesc') },
    { title: t('advantages.satelliteTitle'), description: t('advantages.satelliteDesc') },
    { title: t('advantages.rulesTitle'), description: t('advantages.rulesDesc') },
    { title: t('advantages.priorityTitle'), description: t('advantages.priorityDesc') },
  ];

  const tickerItems = TICKER_KEYS.map((k) => t(k));
  const doubled = [...tickerItems, ...tickerItems];

  return (
    <section id="stats" className="relative pb-24 pt-16">
      {/* Ticker */}
      <div className="mb-20 overflow-hidden border-y border-landing-border py-4">
        <div className="landing-animate-ticker flex w-max items-center gap-8">
          {doubled.map((item, i) => (
            <span
              key={i}
              className="flex shrink-0 items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-landing-muted"
            >
              <span className="h-1 w-1 rounded-full bg-landing-signal" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20 grid grid-cols-2 gap-6 md:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-landing-border bg-landing-surface p-6">
              <div className="font-mono text-3xl font-semibold tracking-tight text-landing-ink md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-2 text-sm font-medium text-landing-ink">{stat.label}</div>
              <div className="mt-0.5 text-xs text-landing-muted">{stat.detail}</div>
            </div>
          ))}
        </motion.div>

        {/* Advantages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
            {t('advantages.eyebrow')}
          </span>
          <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-landing-ink md:text-4xl">
            {t('advantages.title')}
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {advantages.map((adv, i) => (
              <motion.div
                key={adv.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-2xl border border-landing-border bg-landing-surface p-6 transition-all duration-150 hover:border-landing-border-strong"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-landing-secondary font-mono text-xs font-medium text-landing-ink">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-sm font-semibold text-landing-ink">{adv.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-landing-ink-soft">{adv.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
