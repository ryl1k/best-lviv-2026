import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="flex items-center justify-center gap-2 border-t border-landing-border py-4 text-[11px] text-landing-muted">
      <span>Revela</span>
      <span className="text-landing-border-strong">·</span>
      <span>v0.1.0</span>
      <span className="text-landing-border-strong">·</span>
      <a href="#docs" onClick={(e) => e.preventDefault()} className="text-landing-ink-soft no-underline hover:text-landing-ink">
        {t('footer.docs')}
      </a>
      <span className="text-landing-border-strong">·</span>
      <a href="#support" onClick={(e) => e.preventDefault()} className="text-landing-ink-soft no-underline hover:text-landing-ink">
        {t('footer.support')}
      </a>
    </footer>
  );
}
