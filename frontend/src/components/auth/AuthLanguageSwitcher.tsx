import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
] as const;

export function AuthLanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentCode = i18n.resolvedLanguage?.slice(0, 2) ?? 'uk';
  const currentLanguage = LANGUAGES.find((item) => item.code === currentCode) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="fixed top-4 right-4 z-30">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--auth-border)] bg-[var(--auth-surface)] px-3 text-xs font-medium text-[var(--auth-text-secondary)] shadow-sm transition-colors hover:bg-[var(--auth-surface-muted)]"
      >
        <Globe size={14} />
        <span>{currentLanguage.code.toUpperCase()}</span>
        <ChevronDown size={12} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-40 overflow-hidden rounded-lg border border-[var(--auth-border)] bg-[var(--auth-surface)] p-1 shadow-md">
          {LANGUAGES.map((lang) => {
            const active = lang.code === currentCode;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  void i18n.changeLanguage(lang.code);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-[var(--auth-surface-muted)]"
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span className={active ? 'font-semibold text-[var(--auth-accent)]' : 'text-[var(--auth-text-secondary)]'}>
                  {lang.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

