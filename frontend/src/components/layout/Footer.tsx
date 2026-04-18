import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="flex items-center justify-center gap-2 border-t border-landing-border py-4 text-[11px] text-landing-muted">
      <span>Revela</span>
      <span className="text-landing-border-strong">·</span>
      <span>v0.1.0</span>
      <span className="text-landing-border-strong">·</span>
      <Link to="/docs" className="text-landing-ink-soft no-underline hover:text-landing-ink">
        {t('footer.docs')}
      </Link>
      <span className="text-landing-border-strong">·</span>
      <Link to="/support" className="text-landing-ink-soft no-underline hover:text-landing-ink">
        {t('footer.support')}
      </Link>
    </footer>
  );
}
