import { useTranslation } from 'react-i18next';

export default function PricingPage() {
  const { t } = useTranslation();

  const plans = [
    {
      name: t('pricing.pilot'),
      price: t('pricing.pilotPrice'),
      period: '',
      desc: t('pricing.pilotDesc'),
      features: [t('pricing.pilotRecords'), t('pricing.pilotUsers'), t('pricing.pilotFeature1'), t('pricing.pilotFeature2')],
      featured: false,
    },
    {
      name: t('pricing.standard'),
      price: t('pricing.standardPrice'),
      period: t('pricing.standardPeriod'),
      desc: t('pricing.standardDesc'),
      features: [t('pricing.standardRecords'), t('pricing.standardUsers'), t('pricing.standardFeature1'), t('pricing.standardFeature2')],
      featured: true,
    },
    {
      name: t('pricing.enterprise'),
      price: t('pricing.enterprisePrice'),
      period: '',
      desc: t('pricing.enterpriseDesc'),
      features: [t('pricing.enterpriseRecords'), t('pricing.enterpriseUsers'), t('pricing.enterpriseFeature1'), t('pricing.enterpriseFeature2')],
      featured: false,
    },
  ];

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-24 md:px-10">
      <div className="mb-16 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
          {t('pricing.eyebrow')}
        </span>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-landing-ink md:text-5xl">
          {t('pricing.title')}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-landing-ink-soft">
          {t('pricing.subtitle')}
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl p-8 ${
              plan.featured
                ? 'border-2 border-landing-ink bg-landing-paper shadow-lg'
                : 'border border-landing-border bg-landing-paper'
            }`}
          >
            <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-landing-muted">
              {plan.name}
            </h3>
            <div className="mt-4 text-4xl font-semibold tracking-tight text-landing-ink">
              {plan.price}
              {plan.period && <span className="text-lg text-landing-muted">{plan.period}</span>}
            </div>
            <p className="mt-2 text-sm text-landing-ink-soft">{plan.desc}</p>
            <ul className="mt-8 space-y-3 text-sm text-landing-ink-soft">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-landing-signal">•</span> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
