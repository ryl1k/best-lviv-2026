import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = email.length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex bg-[var(--auth-bg)] [--auth-bg:#F5F5F4] [--auth-surface:#FFFFFF] [--auth-surface-muted:#F5F5F4] [--auth-border:#D6D3D1] [--auth-border-strong:#A8A29E] [--auth-text-primary:#171717] [--auth-text-secondary:#292524] [--auth-text-muted:#78716C] [--auth-text-disabled:#A8A29E] [--auth-accent:#D97706] [--auth-accent-hover:#B45309] [--auth-accent-panel:#B45309]">
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
            Відновіть доступ
            <br />
            до кабінету
          </h1>
          <p className="max-w-[340px] text-[15px] leading-[1.6] opacity-80">
            Вкажіть службову пошту, і система сформує інструкції для зміни пароля.
          </p>
        </div>

        <div className="relative z-[1]">
          <div className="flex gap-6 text-xs opacity-50">
            <span>© 2026 Revela</span>
            <span>·</span>
            <span>Hackathon Innovate</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mb-8 flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-sm text-[var(--auth-text-muted)] transition-colors hover:text-[var(--auth-text-secondary)]"
          >
            <ArrowLeft size={16} />
            Назад до входу
          </button>

          <div className="mb-8">
            <h2 className="mb-2 text-2xl font-semibold tracking-[-0.01em] text-[var(--auth-text-primary)]">
              Забули пароль?
            </h2>
            <p className="text-sm text-[var(--auth-text-muted)]">
              Ця сторінка демонстраційна. Надсилання листа поки не підключене.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="mb-1.5 block text-[13px] font-medium text-[var(--auth-text-secondary)]">
                Електронна пошта
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hromada.gov.ua"
                autoComplete="email"
                className="h-11 w-full rounded-lg border border-[var(--auth-border)] bg-[var(--auth-surface)] px-3.5 text-sm text-[var(--auth-text-primary)] outline-none transition-colors placeholder:text-[var(--auth-text-muted)] focus:border-[var(--auth-accent)]"
              />
            </div>

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
                  Надіслати інструкцію <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
