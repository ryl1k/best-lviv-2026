import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Bell, User, LogOut, Settings, LayoutDashboard, Globe } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

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

  const getCrumbs = (): string[] => {
    if (location.pathname.includes('/discrepancies/')) {
      const discId = location.pathname.split('/discrepancies/')[1];
      return ['Завдання #a4f2', 'Розбіжності', `Кейс #${discId}`];
    }
    if (location.pathname.includes('/tasks/')) return ['Завдання #a4f2', 'Розбіжності'];
    return [];
  };

  const crumbs = getCrumbs();
  const isHome = location.pathname === '/home';
  const isUpload = location.pathname === '/upload';
  const isDashboard = location.pathname.startsWith('/tasks');
  const isSatellite = location.pathname === '/satellite';

  const navItems = [
    { label: 'Панель', path: '/home', active: isHome },
    { label: 'Новий аналіз', path: '/upload', active: isUpload },
    { label: 'Дашборд', path: '/tasks/a4f2', active: isDashboard },
    { label: 'Супутник', path: '/satellite', active: isSatellite },
  ];

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  return (
    <nav
      className="sticky top-0 z-50 flex items-center px-6"
      style={{
        height: 56,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left: Logo + nav links */}
      <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
        <Link
          to="/home"
          className="no-underline flex items-center gap-1.5"
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 2,
              background: 'var(--accent)',
              display: 'inline-block',
              transform: 'translateY(-1px)',
            }}
          />
          Revela
        </Link>

        <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path + item.label}
              to={item.path}
              className="no-underline"
              style={{
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: item.active ? 500 : 400,
                color: item.active ? 'var(--accent)' : 'var(--text-muted)',
                borderRadius: 6,
                background: item.active ? 'var(--accent-subtle)' : 'transparent',
                transition: 'background-color 150ms, color 150ms',
              }}
              onMouseEnter={(e) => {
                if (!item.active) e.currentTarget.style.background = 'var(--surface-muted)';
              }}
              onMouseLeave={(e) => {
                if (!item.active) e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Center: Breadcrumbs */}
      <div className="flex-1 flex justify-center" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {crumbs.length > 0 && (
          <div className="flex items-center gap-2">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span style={{ color: 'var(--text-disabled)' }}>/</span>}
                <span
                  style={
                    i === crumbs.length - 1
                      ? { color: 'var(--text-secondary)', fontWeight: 500 }
                      : undefined
                  }
                >
                  {c}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: Lang, OTG, bell, profile */}
      <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
        {/* Language selector */}
        <div ref={langRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="inline-flex items-center gap-1.5"
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              border: 'none',
              background: langOpen ? 'var(--surface-muted)' : 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--text-muted)',
              transition: 'background-color 150ms',
            }}
            onMouseEnter={(e) => {
              if (!langOpen) e.currentTarget.style.background = 'var(--surface-muted)';
            }}
            onMouseLeave={(e) => {
              if (!langOpen) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Globe size={14} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>
              {currentLang.code.toUpperCase()}
            </span>
          </button>

          {langOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 6px)',
                width: 170,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                zIndex: 100,
                padding: 4,
              }}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  className="flex items-center gap-2.5 w-full"
                  style={{
                    padding: '8px 10px',
                    fontSize: 13,
                    color: lang.code === i18n.language ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: lang.code === i18n.language ? 500 : 400,
                    background: lang.code === i18n.language ? 'var(--accent-subtle)' : 'transparent',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 120ms',
                  }}
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    setLangOpen(false);
                  }}
                  onMouseEnter={(e) => {
                    if (lang.code !== i18n.language) e.currentTarget.style.background = 'var(--surface-muted)';
                  }}
                  onMouseLeave={(e) => {
                    if (lang.code !== i18n.language) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: 15 }}>{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="inline-flex items-center gap-1.5"
          style={{
            padding: '6px 10px',
            background: 'var(--surface-muted)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'border-color 150ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          Острівська ТГ <ChevronDown size={14} />
        </button>

        <button
          className="relative inline-flex items-center justify-center"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            color: 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 150ms',
          }}
          aria-label="Сповіщення"
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Bell size={18} />
          <span
            className="absolute"
            style={{
              top: 6,
              right: 6,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--danger)',
              border: '1.5px solid var(--surface)',
            }}
          />
        </button>

        {/* Profile dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2"
            style={{
              padding: '4px 8px 4px 4px',
              borderRadius: 8,
              border: profileOpen ? '1px solid var(--border-strong)' : '1px solid transparent',
              background: profileOpen ? 'var(--surface-muted)' : 'transparent',
              cursor: 'pointer',
              transition: 'background-color 150ms, border-color 150ms',
            }}
            onMouseEnter={(e) => {
              if (!profileOpen) e.currentTarget.style.background = 'var(--surface-muted)';
            }}
            onMouseLeave={(e) => {
              if (!profileOpen) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ОК
            </div>
            <ChevronDown
              size={12}
              style={{
                color: 'var(--text-muted)',
                transform: profileOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 150ms',
              }}
            />
          </button>

          {profileOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 6px)',
                width: 220,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Олексій Коваленко
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  o.kovalenko@ostrivska.gov.ua
                </div>
              </div>

              <div style={{ padding: '4px' }}>
                {[
                  { icon: LayoutDashboard, label: 'Панель', path: '/home' },
                  { icon: User, label: 'Профіль', path: '/profile' },
                  { icon: Settings, label: 'Налаштування', path: '/profile' },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="flex items-center gap-2.5 w-full"
                    style={{
                      padding: '8px 10px',
                      fontSize: 13,
                      color: location.pathname === item.path ? 'var(--accent)' : 'var(--text-secondary)',
                      background: 'none',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 120ms',
                    }}
                    onClick={() => {
                      navigate(item.path);
                      setProfileOpen(false);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-muted)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <item.icon size={15} />
                    {item.label}
                  </button>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', padding: '4px' }}>
                <button
                  className="flex items-center gap-2.5 w-full"
                  style={{
                    padding: '8px 10px',
                    fontSize: 13,
                    color: 'var(--danger)',
                    background: 'none',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 120ms',
                  }}
                  onClick={() => {
                    navigate('/');
                    setProfileOpen(false);
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--danger-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={15} />
                  Вийти
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
