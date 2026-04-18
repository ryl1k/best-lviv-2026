import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { getAccessToken, getApiErrorMessage, subscriptionsApi, type Subscription, type UserSubscription } from '@/api';

function tierOrder(tier: Subscription['tier']): number {
  if (tier === 'FREE') return 0;
  if (tier === 'BASIC') return 1;
  return 2;
}

function formatPrice(priceUah: number): string {
  if (priceUah <= 0) return 'Безкоштовно';
  return `₴${priceUah.toLocaleString('uk-UA')}`;
}

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('uk-UA');
}

export default function PricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = Boolean(getAccessToken());
  const [plans, setPlans] = useState<Subscription[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | null>(null);

  const loadPricing = useCallback(async () => {
    setIsLoading(true);
    setLoadingError(null);

    const [plansResult, mineResult] = await Promise.allSettled([
      subscriptionsApi.list(),
      isAuthenticated ? subscriptionsApi.mine() : Promise.resolve(null),
    ]);

    if (plansResult.status === 'fulfilled') {
      setPlans(plansResult.value.data);
    } else {
      setPlans([]);
      setLoadingError(getApiErrorMessage(plansResult.reason, 'Не вдалося завантажити список тарифів.'));
    }

    if (mineResult.status === 'fulfilled') {
      setActiveSubscription(mineResult.value?.data ?? null);
    } else {
      setActiveSubscription(null);
    }

    setIsLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadPricing();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [loadPricing]);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => tierOrder(a.tier) - tierOrder(b.tier) || a.price_uah - b.price_uah),
    [plans],
  );

  const handlePurchase = useCallback(
    async (plan: Subscription) => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      setPurchasingPlanId(plan.id);
      try {
        const response = await subscriptionsApi.purchase(plan.id);
        setActiveSubscription(response.data);
        toast.success('Тариф успішно активовано.');
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Не вдалося активувати тариф.'));
      } finally {
        setPurchasingPlanId(null);
      }
    },
    [isAuthenticated, navigate],
  );

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

      {activeSubscription && (
        <div className="mx-auto mb-8 max-w-4xl rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-700">Активна підписка</div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <span className="font-medium">{activeSubscription.subscription.name}</span>
            <span>Діє до: {formatDate(activeSubscription.expires_at)}</span>
            <span>CSV: {activeSubscription.csv_tries_used}/{activeSubscription.subscription.max_csv_tries}</span>
            <span>Супутник: {activeSubscription.satellite_tries_used}/{activeSubscription.subscription.max_satellite_tries}</span>
          </div>
        </div>
      )}

      {loadingError && (
        <div className="mx-auto mb-8 max-w-4xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadingError}
        </div>
      )}

      {isLoading ? (
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 rounded-2xl border border-landing-border bg-landing-paper px-6 py-12 text-sm text-landing-ink-soft">
          <Loader2 size={16} className="animate-spin" />
          Завантаження тарифів...
        </div>
      ) : (
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          {sortedPlans.map((plan) => {
            const isActive = activeSubscription?.subscription_id === plan.id;
            const isBusy = purchasingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-8 ${
                  plan.tier === 'BASIC'
                    ? 'border-2 border-landing-ink bg-landing-paper shadow-lg'
                    : 'border border-landing-border bg-landing-paper'
                }`}
              >
                <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-landing-muted">
                  {plan.name}
                </h3>
                <div className="mt-4 text-4xl font-semibold tracking-tight text-landing-ink">
                  {formatPrice(plan.price_uah)}
                  {plan.price_uah > 0 && <span className="text-lg text-landing-muted">/міс</span>}
                </div>
                <p className="mt-2 text-sm text-landing-ink-soft">
                  {plan.tier === 'FREE' ? 'Старт для пілотного тестування.' : 'Підписка для регулярного аудиту та масштабування.'}
                </p>
                <ul className="mt-8 space-y-3 text-sm text-landing-ink-soft">
                  <li className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 text-landing-signal" />
                    CSV аналізів: {plan.max_csv_tries}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 text-landing-signal" />
                    Супутникових аналізів: {plan.max_satellite_tries}
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => void handlePurchase(plan)}
                  disabled={isActive || isBusy}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'cursor-default border border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border border-landing-ink bg-landing-ink text-landing-paper hover:bg-landing-ink-soft disabled:opacity-60'
                  }`}
                >
                  {isBusy ? <Loader2 size={14} className="animate-spin" /> : null}
                  {isActive ? 'Поточний тариф' : isAuthenticated ? 'Активувати тариф' : 'Увійти для активації'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
