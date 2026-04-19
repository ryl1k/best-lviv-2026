import { useTranslation } from 'react-i18next';

import { AnimatedCounter } from './AnimatedCounter';
import { SectionHeader } from './SectionHeader';

export function LandingProof() {
  const { t } = useTranslation();
  const section = {
    eyebrow: t('landingProof.section.eyebrow'),
    titleStart: t('landingProof.section.titleStart'),
    titleEmphasis: t('landingProof.section.titleEmphasis'),
    titleEnd: t('landingProof.section.titleEnd'),
    description: t('landingProof.section.description'),
  };
  const stats = [
    { value: 21656, label: t('landingProof.stats.0.label'), note: t('landingProof.stats.0.note') },
    { value: 3708, label: t('landingProof.stats.1.label'), note: t('landingProof.stats.1.note') },
    { value: 60, label: t('landingProof.stats.2.label'), note: t('landingProof.stats.2.note'), suffix: 's' },
    { value: 7, label: t('landingProof.stats.3.label'), note: t('landingProof.stats.3.note') },
  ];
  const tickerItems = [
    t('landingProof.ticker.0'),
    t('landingProof.ticker.1'),
    t('landingProof.ticker.2'),
    t('landingProof.ticker.3'),
    t('landingProof.ticker.4'),
    t('landingProof.ticker.5'),
    t('landingProof.ticker.6'),
  ];

  return (
    <section id="proof" className="relative bg-landing-paper py-32 md:py-44">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <SectionHeader {...section} />

        <div className="mt-20 grid gap-px overflow-hidden rounded-xl bg-landing-border md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-landing-paper p-8 md:p-10">
              <div className="font-landing-display text-6xl leading-none text-landing-ink md:text-7xl">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-4 text-sm font-medium text-landing-ink">{stat.label}</div>
              <div className="mt-1 text-xs text-landing-muted">{stat.note}</div>
            </div>
          ))}
        </div>

        <div className="landing-mask-fade-edges relative mt-20 overflow-hidden border-y border-landing-border py-6">
          <div className="landing-animate-ticker flex w-max gap-12 font-landing-display text-3xl italic text-landing-ink-soft md:text-4xl">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <span key={`${item}-${index}`} className="flex items-center gap-12 whitespace-nowrap">
                {item}
                <span className="landing-signal-dot" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
