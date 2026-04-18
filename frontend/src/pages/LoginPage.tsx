import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.length > 0 && password.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/home');
    }, 800);
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="hidden lg:flex flex-col justify-between"
        style={{
          width: 480,
          background: 'var(--accent)',
          padding: '48px 48px 32px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.06,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 64 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 3,
                background: '#fff',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>
              Revela
            </span>
          </div>

          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: 20,
            }}
          >
            {t('login.brandHeadingLineOne')}
            <br />
            {t('login.brandHeadingLineTwo')}
          </h1>
          <p style={{ fontSize: 15, opacity: 0.8, lineHeight: 1.6, maxWidth: 340 }}>
            {t('login.brandDescription')}
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              padding: '20px 24px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              backdropFilter: 'blur(10px)',
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
              42 038
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
              {t('login.processedLabel')}
            </div>
          </div>

          <div className="flex gap-6" style={{ fontSize: 12, opacity: 0.5 }}>
            <span>{t('login.footerCopyright')}</span>
            <span>·</span>
            <span>{t('login.footerEvent')}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center" style={{ padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div className="lg:hidden flex items-center gap-2" style={{ marginBottom: 40 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 2,
                background: 'var(--accent)',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
              Revela
            </span>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              {t('login.title')}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {t('login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                {t('login.emailLabel')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                autoComplete="email"
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--surface)',
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 150ms',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                {t('login.passwordLabel')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    height: 44,
                    padding: '0 44px 0 14px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 150ms',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 0,
                    display: 'flex',
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 28 }}>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {t('login.forgotPassword')}
              </button>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || loading}
              style={{
                width: '100%',
                height: 48,
                background: canSubmit ? 'var(--accent)' : 'var(--border)',
                color: canSubmit ? '#fff' : 'var(--text-disabled)',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background-color 150ms',
              }}
              onMouseEnter={(e) => {
                if (canSubmit) e.currentTarget.style.background = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                if (canSubmit) e.currentTarget.style.background = 'var(--accent)';
              }}
            >
              {loading ? (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }}
                />
              ) : (
                <>
                  {t('login.submit')} <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          <div
            className="flex items-center gap-3"
            style={{ margin: '28px 0', color: 'var(--text-disabled)', fontSize: 12 }}
          >
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span>{t('login.or')}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <button
            type="button"
            style={{
              width: '100%',
              height: 44,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background-color 150ms, border-color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-muted)';
              e.currentTarget.style.borderColor = 'var(--border-strong)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            {t('login.trembita')}
          </button>

          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            {t('login.noAccount')}{' '}
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: 12,
                cursor: 'pointer',
                padding: 0,
                fontWeight: 500,
              }}
            >
              {t('login.contactAdmin')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
