import { useTranslation } from 'react-i18next';
import { FileText, Upload, BarChart3, Satellite, Shield, Zap, BookOpen } from 'lucide-react';
import { Link } from 'react-router';

export default function DocsPage() {
  const { t } = useTranslation();

  const sections = [
    {
      icon: Upload,
      title: t('docs.uploadTitle'),
      content: t('docs.uploadContent'),
      steps: [
        t('docs.uploadStep1'),
        t('docs.uploadStep2'),
        t('docs.uploadStep3'),
      ],
    },
    {
      icon: BarChart3,
      title: t('docs.rulesTitle'),
      content: t('docs.rulesContent'),
      rules: [
        { code: 'R01', label: t('docs.r01'), severity: 'HIGH' },
        { code: 'R02', label: t('docs.r02'), severity: 'HIGH' },
        { code: 'R03', label: t('docs.r03'), severity: 'MEDIUM' },
        { code: 'R04', label: t('docs.r04'), severity: 'LOW' },
        { code: 'R05', label: t('docs.r05'), severity: 'MEDIUM' },
        { code: 'R06', label: t('docs.r06'), severity: 'MEDIUM' },
        { code: 'R07', label: t('docs.r07'), severity: 'LOW' },
      ],
    },
    {
      icon: Satellite,
      title: t('docs.satelliteTitle'),
      content: t('docs.satelliteContent'),
    },
    {
      icon: FileText,
      title: t('docs.formatsTitle'),
      content: t('docs.formatsContent'),
      formats: ['.xlsx', '.xls', '.csv'],
    },
    {
      icon: Shield,
      title: t('docs.securityTitle'),
      content: t('docs.securityContent'),
    },
    {
      icon: Zap,
      title: t('docs.apiTitle'),
      content: t('docs.apiContent'),
      endpoints: [
        { method: 'POST', path: '/api/v1/audits/upload' },
        { method: 'GET', path: '/api/v1/tasks/{id}' },
        { method: 'GET', path: '/api/v1/tasks/{id}/results' },
        { method: 'GET', path: '/api/v1/tasks/{id}/export' },
      ],
    },
  ];

  const severityColor = (s: string) => {
    if (s === 'HIGH') return 'var(--danger)';
    if (s === 'MEDIUM') return 'var(--warning)';
    return 'var(--success)';
  };
  const severityLabel = (s: string) => {
    if (s === 'HIGH') return t('tasks.severity.high');
    if (s === 'MEDIUM') return t('tasks.severity.medium');
    return t('tasks.severity.low');
  };

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-24 md:px-10">
      {/* Header */}
      <div className="mb-16 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
          {t('docs.eyebrow')}
        </span>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-landing-ink md:text-5xl">
          {t('docs.title')}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-landing-ink-soft">
          {t('docs.subtitle')}
        </p>
      </div>

      {/* Quick nav */}
      <div className="mx-auto mb-16 flex max-w-3xl flex-wrap items-center justify-center gap-3">
        {sections.map((s) => (
          <a
            key={s.title}
            href={`#${s.title.toLowerCase().replace(/\s+/g, '-')}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-landing-border px-3 py-1.5 text-xs font-medium text-landing-ink-soft no-underline transition-colors hover:border-landing-ink hover:text-landing-ink"
          >
            <s.icon size={12} />
            {s.title}
          </a>
        ))}
      </div>

      {/* Sections */}
      <div className="mx-auto max-w-3xl space-y-16">
        {sections.map((section) => (
          <div
            key={section.title}
            id={section.title.toLowerCase().replace(/\s+/g, '-')}
            className="scroll-mt-24"
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
              >
                <section.icon size={16} />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-landing-ink">
                {section.title}
              </h2>
            </div>

            <p className="text-sm leading-relaxed text-landing-ink-soft">
              {section.content}
            </p>

            {/* Upload steps */}
            {section.steps && (
              <ol className="mt-6 space-y-3">
                {section.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-landing-ink-soft">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold text-white"
                      style={{ background: 'var(--accent)' }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            )}

            {/* Rules table */}
            {section.rules && (
              <div className="mt-6 overflow-hidden rounded-xl border border-landing-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-landing-border bg-landing-paper">
                      <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                        {t('docs.code')}
                      </th>
                      <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                        {t('docs.description')}
                      </th>
                      <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                        {t('docs.severity')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.rules.map((rule) => (
                      <tr key={rule.code} className="border-b border-landing-border last:border-0">
                        <td className="px-4 py-2.5 font-mono text-xs text-landing-ink">{rule.code}</td>
                        <td className="px-4 py-2.5 text-landing-ink-soft">{rule.label}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className="inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-medium"
                            style={{
                              color: severityColor(rule.severity),
                              background: `color-mix(in oklch, ${severityColor(rule.severity)} 12%, transparent)`,
                            }}
                          >
                            {severityLabel(rule.severity)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* File formats */}
            {section.formats && (
              <div className="mt-6 flex gap-3">
                {section.formats.map((f) => (
                  <span
                    key={f}
                    className="rounded-lg border border-landing-border px-3 py-1.5 font-mono text-xs text-landing-ink"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}

            {/* API endpoints */}
            {section.endpoints && (
              <div className="mt-6 space-y-2">
                {section.endpoints.map((ep) => (
                  <div
                    key={ep.path}
                    className="flex items-center gap-3 rounded-lg border border-landing-border px-4 py-2.5"
                  >
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                      style={{
                        background: ep.method === 'POST' ? 'var(--accent-subtle)' : 'oklch(0.95 0.02 145)',
                        color: ep.method === 'POST' ? 'var(--accent)' : 'var(--success)',
                      }}
                    >
                      {ep.method}
                    </span>
                    <code className="font-mono text-xs text-landing-ink-soft">{ep.path}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mx-auto mt-24 max-w-3xl rounded-2xl border border-landing-border p-8 text-center">
        <BookOpen size={24} className="mx-auto mb-4 text-landing-muted" />
        <h3 className="text-lg font-semibold text-landing-ink">{t('docs.ctaTitle')}</h3>
        <p className="mt-2 text-sm text-landing-ink-soft">{t('docs.ctaDesc')}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/upload"
            className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium text-white no-underline transition-colors"
            style={{ background: 'var(--accent)', }}
          >
            {t('docs.ctaTry')}
          </Link>
          <Link
            to="/support"
            className="inline-flex items-center rounded-full border border-landing-border px-5 py-2.5 text-sm font-medium text-landing-ink no-underline transition-colors hover:border-landing-ink"
          >
            {t('docs.ctaSupport')}
          </Link>
        </div>
      </div>
    </section>
  );
}
