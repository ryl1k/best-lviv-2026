import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi, getApiErrorMessage } from '@/api';
import { AuthLanguageSwitcher } from '@/components/auth/AuthLanguageSwitcher';

interface LoginLocationState {
  registered?: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LoginLocationState | null) ?? null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitError(null);
    setLoading(true);
    try {
      await authApi.loginAndLoadUser({
        email: email.trim(),
        password,
      });
      navigate('/upload');
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Не вдалося виконати вхід. Перевірте дані та спробуйте ще раз.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--auth-bg)] [--auth-bg:#F5F5F4] [--auth-surface:#FFFFFF] [--auth-surface-muted:#F5F5F4] [--auth-border:#D6D3D1] [--auth-border-strong:#A8A29E] [--auth-text-primary:#171717] [--auth-text-secondary:#292524] [--auth-text-muted:#78716C] [--auth-text-disabled:#A8A29E] [--auth-accent:#D97706] [--auth-accent-hover:#B45309] [--auth-accent-panel:#B45309]">
      <AuthLanguageSwitcher />
      <div className="relative hidden w-[480px] flex-col justify-between overflow-hidden bg-[var(--auth-accent-panel)] px-12 pt-12 pb-8 text-white lg:flex">
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:40px_40px]" />

        <div className="relative z-[1]">
          <div className="mb-16 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-[3px] bg-white" />
            <span className="text-[22px] font-semibold tracking-[-0.01em]">
              Revela
            </span>
          </div>

          <h1 className="mb-5 text-[32px] leading-[1.2] font-bold tracking-[-0.02em]">
            Робить приховане
            <br />
            видимим
          </h1>
          <p className="max-w-[340px] text-[15px] leading-[1.6] opacity-80">
            Автоматичне зіставлення державних реєстрів для виявлення
            розбіжностей та оптимізації податкових надходжень громади.
          </p>
        </div>

        <div className="relative z-[1]">
          <div className="mb-6 rounded-xl bg-white/15 px-6 py-5 backdrop-blur-md">
            <div className="font-mono text-[28px] font-bold">
              42 038
            </div>
            <div className="mt-1 text-[13px] opacity-70">
              записів оброблено для Острівської ТГ
            </div>
          </div>

          <div className="flex gap-6 text-xs opacity-50">
            <span>© 2026 Revela</span>
            <span>·</span>
            <span>Hackathon Innovate</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-2 lg:hidden">
            <span className="inline-block h-1.5 w-1.5 rounded-[2px] bg-[var(--auth-accent)]" />
            <span className="text-lg font-semibold text-[var(--auth-text-primary)]">
              Revela
            </span>
          </div>

          <div className="mb-8">
            <h2 className="mb-2 text-2xl font-semibold tracking-[-0.01em] text-[var(--auth-text-primary)]">
              Вхід в систему
            </h2>
            <p className="text-sm text-[var(--auth-text-muted)]">
              Увійдіть для доступу до аудиту активів вашої громади
            </p>
          </div>

          {locationState?.registered && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Акаунт створено. Тепер увійдіть у систему.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--auth-text-secondary)]">
                Електронна пошта
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (submitError) setSubmitError(null);
                }}
                placeholder="admin@ostrivska.gov.ua"
                autoComplete="email"
                className="h-11 w-full rounded-lg border border-[var(--auth-border)] bg-[var(--auth-surface)] px-3.5 text-sm text-[var(--auth-text-primary)] outline-none transition-colors placeholder:text-[var(--auth-text-muted)] focus:border-[var(--auth-accent)]"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--auth-text-secondary)]">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (submitError) setSubmitError(null);
                  }}
                  placeholder="Введіть пароль"
                  autoComplete="current-password"
                  className="h-11 w-full rounded-lg border border-[var(--auth-border)] bg-[var(--auth-surface)] px-3.5 pr-11 text-sm text-[var(--auth-text-primary)] outline-none transition-colors placeholder:text-[var(--auth-text-muted)] focus:border-[var(--auth-accent)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 flex -translate-y-1/2 cursor-pointer items-center bg-transparent p-0 text-[var(--auth-text-muted)]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-7 text-right">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="cursor-pointer border-none bg-transparent p-0 text-[13px] text-[var(--auth-accent)]"
              >
                Забули пароль?
              </button>
            </div>

            {submitError && (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className={cn(
                'flex h-12 w-full items-center justify-center gap-2 rounded-lg border-none text-sm font-semibold transition-colors',
                canSubmit
                  ? 'cursor-pointer bg-[var(--auth-accent)] text-white hover:bg-[var(--auth-accent-hover)]'
                  : 'cursor-not-allowed bg-[var(--auth-border)] text-[var(--auth-text-disabled)]',
              )}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Увійти <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[var(--auth-text-muted)]">
            Немає акаунту?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="cursor-pointer border-none bg-transparent p-0 text-xs font-medium text-[var(--auth-accent)]"
            >
              Створити акаунт
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
