import { landingProofSection, landingProofStats, landingProofTickerItems } from '@/data/landing';

import { AnimatedCounter } from './AnimatedCounter';
import { SectionHeader } from './SectionHeader';

export function LandingProof() {
  return (
    <section id="proof" className="relative bg-landing-paper py-32 md:py-44">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <SectionHeader {...landingProofSection} />

        <div className="mt-20 grid gap-px overflow-hidden rounded-xl bg-landing-border md:grid-cols-4">
          {landingProofStats.map((stat) => (
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
            {[...landingProofTickerItems, ...landingProofTickerItems].map((item, index) => (
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
