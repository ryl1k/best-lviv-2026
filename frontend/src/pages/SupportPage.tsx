import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Mail, Clock, ChevronDown, Send, ExternalLink } from 'lucide-react';

const brown = '#7C5C3E';
const brownSubtle = '#F5EDE4';

export default function SupportPage() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const channels = [
    {
      icon: Mail,
      title: t('support.emailTitle'),
      desc: t('support.emailDesc'),
      action: 'support@revela.gov.ua',
      href: 'mailto:support@revela.gov.ua',
    },
    {
      icon: Clock,
      title: t('support.hoursTitle'),
      desc: t('support.hoursDesc'),
      action: t('support.hoursAction'),
      href: undefined,
    },
  ];

  const faqs = [
    { q: t('support.faq1q'), a: t('support.faq1a') },
    { q: t('support.faq2q'), a: t('support.faq2a') },
    { q: t('support.faq3q'), a: t('support.faq3a') },
    { q: t('support.faq4q'), a: t('support.faq4a') },
    { q: t('support.faq5q'), a: t('support.faq5a') },
    { q: t('support.faq6q'), a: t('support.faq6a') },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info(t('support.inDevelopment'));
  };

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-24 md:px-10">
      {/* Header */}
      <div className="mb-16 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
          {t('support.eyebrow')}
        </span>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-landing-ink md:text-5xl">
          {t('support.title')}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-landing-ink-soft">
          {t('support.subtitle')}
        </p>
      </div>

      {/* Contact channels */}
      <div className="mx-auto mb-20 grid max-w-2xl gap-6 md:grid-cols-2">
        {channels.map((ch) => (
          <div
            key={ch.title}
            className="rounded-2xl border border-landing-border bg-landing-paper p-6"
          >
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: brownSubtle, color: brown }}
            >
              <ch.icon size={18} />
            </div>
            <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-landing-muted">
              {ch.title}
            </h3>
            <p className="mt-2 text-sm text-landing-ink-soft">{ch.desc}</p>
            {ch.href ? (
              <a
                href={ch.href}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium no-underline transition-colors"
                style={{ color: brown }}
                onClick={ch.href === '#' ? (e) => e.preventDefault() : undefined}
              >
                {ch.action}
                <ExternalLink size={12} />
              </a>
            ) : (
              <p className="mt-4 text-sm font-medium text-landing-ink">{ch.action}</p>
            )}
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
            {t('support.faqEyebrow')}
          </span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-landing-ink">
            {t('support.faqTitle')}
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-landing-border transition-colors"
              style={{
                background: openFaq === i ? 'oklch(0.98 0.003 80)' : 'transparent',
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between border-none px-5 py-4 text-left text-sm font-medium text-landing-ink"
                style={{ background: 'none', cursor: 'pointer' }}
              >
                {faq.q}
                <ChevronDown
                  size={16}
                  className="shrink-0 text-landing-muted transition-transform duration-200"
                  style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none' }}
                />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm leading-relaxed text-landing-ink-soft">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact form */}
      <div className="mx-auto mt-20 max-w-xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-landing-ink">
            {t('support.formTitle')}
          </h2>
          <p className="mt-2 text-sm text-landing-ink-soft">{t('support.formDesc')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                {t('support.labelName')}
              </label>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-landing-border bg-white px-4 py-2.5 text-sm text-landing-ink outline-none transition-colors focus:border-landing-ink"
                placeholder={t('support.placeholderName')}
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                {t('support.labelEmail')}
              </label>
              <input
                type="email"
                required
                className="w-full rounded-lg border border-landing-border bg-white px-4 py-2.5 text-sm text-landing-ink outline-none transition-colors focus:border-landing-ink"
                placeholder={t('support.placeholderEmail')}
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                {t('support.labelSubject')}
              </label>
              <select
                className="w-full appearance-none rounded-lg border border-landing-border bg-white px-4 py-2.5 text-sm text-landing-ink outline-none transition-colors focus:border-landing-ink"
                defaultValue=""
                required
              >
                <option value="" disabled>{t('support.selectSubject')}</option>
                <option value="bug">{t('support.subjectBug')}</option>
                <option value="feature">{t('support.subjectFeature')}</option>
                <option value="account">{t('support.subjectAccount')}</option>
                <option value="other">{t('support.subjectOther')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                {t('support.labelMessage')}
              </label>
              <textarea
                required
                rows={5}
                className="w-full resize-none rounded-lg border border-landing-border bg-white px-4 py-2.5 text-sm text-landing-ink outline-none transition-colors focus:border-landing-ink"
                placeholder={t('support.placeholderMessage')}
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border-none px-5 py-3 text-sm font-medium text-white transition-colors"
              style={{ background: brown, cursor: 'pointer' }}
            >
              <Send size={14} />
              {t('support.send')}
            </button>
          </form>
      </div>
    </section>
  );
}
