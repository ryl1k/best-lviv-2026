import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, LogOut, Settings, LayoutDashboard, Globe, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: t('nav.home'), path: '/' },
    { label: t('nav.upload'), path: '/upload' },
    { label: t('nav.satellite'), path: '/satellite' },
    { label: t('nav.pricing'), path: '/pricing' },
  ];
  const languages = [
    { code: 'uk', label: t('languages.uk'), flag: '🇺🇦' },
    { code: 'en', label: t('languages.en'), flag: '🇬🇧' },
  ] as const;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('/tasks')) return location.pathname.startsWith('/tasks');
    return location.pathname === path;
  };

  const currentLang = languages.find((language) => language.code === i18n.language) ?? languages[0];
  const forceSolidShell = location.pathname === '/satellite';

  return (
    <header
      role="banner"
      className={`fixed inset-x-0 top-0 z-[1000] transition-all duration-500 ${
        scrolled || mobileOpen || forceSolidShell ? 'border-b border-landing-border backdrop-blur-xl' : 'border-b border-transparent'
      }`}
      style={{
        backgroundColor: scrolled || mobileOpen || forceSolidShell ? 'oklch(0.985 0.005 80 / 92%)' : 'transparent',
      }}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:px-10">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label={t('nav.brandHome')}>
          <span className="landing-signal-dot" aria-hidden="true" />
          <span className="font-landing-display text-3xl leading-none text-landing-ink">
            Revela
          </span>
          <span className="ml-1 hidden font-mono text-[13px] uppercase tracking-[0.18em] text-landing-muted sm:inline" aria-hidden="true">
            {t('nav.tagline')}
          </span>
        </Link>

        {/* Center: Desktop nav */}
        <nav className="hidden items-center gap-9 md:flex" aria-label={t('nav.mainNavigation')}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`landing-link-underline text-sm font-medium transition-colors no-underline ${
                isActive(item.path) ? 'text-landing-ink' : 'text-landing-ink-soft hover:text-landing-ink'
              }`}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Language selector */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              aria-expanded={langOpen}
              aria-haspopup="true"
              aria-label={t('nav.languageLabel', { language: currentLang.label })}
              className="inline-flex items-center gap-1.5 rounded-full border-none px-2.5 py-1.5 text-sm font-medium transition-all duration-150 text-landing-ink-soft hover:text-landing-ink"
              style={{
                background: langOpen ? 'oklch(0 0 0 / 4%)' : 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { if (!langOpen) e.currentTarget.style.background = 'oklch(0 0 0 / 4%)'; }}
              onMouseLeave={(e) => { if (!langOpen) e.currentTarget.style.background = 'transparent'; }}
            >
              <Globe size={14} aria-hidden="true" />
              <span className="text-xs font-medium">{currentLang.code.toUpperCase()}</span>
              <ChevronDown size={12} aria-hidden="true" style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
            </button>

            {langOpen && (
              <div className="absolute right-0 z-[100] mt-1.5 w-44 overflow-hidden rounded-lg border border-landing-border bg-landing-paper p-1" role="menu" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded border-none px-2.5 py-2 text-left text-sm transition-colors duration-100"
                    style={{
                      color: lang.code === i18n.language ? 'var(--accent)' : undefined,
                      fontWeight: lang.code === i18n.language ? 500 : 400,
                      background: lang.code === i18n.language ? 'oklch(0 0 0 / 4%)' : 'transparent',
                      cursor: 'pointer',
                    }}
                    onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                    onMouseEnter={(e) => { if (lang.code !== i18n.language) e.currentTarget.style.background = 'oklch(0 0 0 / 4%)'; }}
                    onMouseLeave={(e) => { if (lang.code !== i18n.language) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span className="text-base" aria-hidden="true">{lang.flag}</span>
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div ref={profileRef} className="relative hidden md:block">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label={t('nav.profileMenu')}
              className="flex items-center gap-2 rounded-full"
              style={{
                padding: '4px 8px 4px 4px',
                border: profileOpen ? '1px solid oklch(0 0 0 / 10%)' : '1px solid transparent',
                background: profileOpen ? 'oklch(0 0 0 / 4%)' : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 150ms, border-color 150ms',
              }}
              onMouseEnter={(e) => { if (!profileOpen) e.currentTarget.style.background = 'oklch(0 0 0 / 4%)'; }}
              onMouseLeave={(e) => { if (!profileOpen) e.currentTarget.style.background = 'transparent'; }}
            >
              <div
                className="flex items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ width: 30, height: 30, background: 'var(--landing-signal)', color: 'white' }}
                aria-hidden="true"
              >
                ОК
              </div>
              <ChevronDown size={12} className="text-landing-ink-soft" aria-hidden="true" style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-[100] mt-1.5 w-56 overflow-hidden rounded-lg border border-landing-border bg-landing-paper" role="menu" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="border-b border-landing-border px-3.5 py-3">
                  <div className="text-sm font-semibold text-landing-ink">Олексій Коваленко</div>
                  <div className="mt-0.5 text-xs text-landing-muted">o.kovalenko@ostrivska.gov.ua</div>
                </div>
                <div className="p-1">
                  {[
                    { icon: LayoutDashboard, labelKey: 'nav.home', path: '/' },
                    { icon: User, labelKey: 'nav.profile', path: '/profile' },
                    { icon: Settings, labelKey: 'nav.settings', path: '/profile' },
                  ].map((item) => (
                    <button
                      key={item.labelKey}
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 rounded border-none px-2.5 py-2 text-left text-sm text-landing-ink-soft transition-colors duration-100"
                      style={{ background: 'none', cursor: 'pointer' }}
                      onClick={() => { navigate(item.path); setProfileOpen(false); }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'oklch(0 0 0 / 4%)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <item.icon size={15} aria-hidden="true" />
                      {t(item.labelKey)}
                    </button>
                  ))}
                </div>
                <div className="border-t border-landing-border p-1">
                  <button
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded border-none px-2.5 py-2 text-left text-sm transition-colors duration-100"
                    style={{ color: 'var(--danger)', background: 'none', cursor: 'pointer' }}
                    onClick={() => { navigate('/'); setProfileOpen(false); }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--danger-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut size={15} aria-hidden="true" />
                    {t('nav.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            className="inline-flex items-center justify-center rounded-lg p-2 text-landing-ink-soft transition-colors hover:text-landing-ink md:hidden"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-landing-border px-6 pb-6 pt-4 md:hidden" aria-label={t('nav.mobileNavigation')} style={{ backgroundColor: 'oklch(0.985 0.005 80 / 95%)', backdropFilter: 'blur(16px)' }}>
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition-colors ${
                  isActive(item.path) ? 'bg-landing-secondary text-landing-ink' : 'text-landing-ink-soft hover:text-landing-ink'
                }`}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 border-t border-landing-border pt-4">
            <div className="flex flex-col gap-1">
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-landing-ink-soft no-underline transition-colors hover:text-landing-ink">
                {t('nav.profile')}
              </Link>
              <button
                onClick={() => { navigate('/'); setMobileOpen(false); }}
                className="rounded-lg border-none px-3 py-2.5 text-left text-sm transition-colors"
                style={{ color: 'var(--danger)', background: 'none', cursor: 'pointer' }}
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
