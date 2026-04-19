import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <main className="landing-page flex min-h-screen flex-col items-center justify-center bg-landing-paper px-6 text-center text-landing-ink">
      <span className="landing-signal-dot mb-6" />
      <h1 className="font-mono text-6xl font-semibold tracking-tight">404</h1>
      <p className="mt-4 max-w-md text-lg text-landing-ink-soft">
        {t('notFound.description')}
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-landing-ink px-5 py-3 text-sm font-medium text-landing-paper no-underline transition-opacity hover:opacity-90"
      >
        {t('notFound.back')}
      </Link>
    </main>
  );
}
