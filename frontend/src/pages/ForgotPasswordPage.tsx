import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === 'en';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const canSubmit = email.trim().length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
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
            <span style={{ width: 8, height: 8, borderRadius: 3, background: '#fff', display: 'inline-block' }} />
            <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>
              Revela
            </span>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 20 }}>
            {isEnglish ? 'Restore access.' : 'Відновіть доступ.'}
            <br />
            {isEnglish ? 'Stay in the same workspace.' : 'Залиштесь у тій самій робочій зоні.'}
          </h1>
          <p style={{ fontSize: 15, opacity: 0.8, lineHeight: 1.6, maxWidth: 340 }}>
            {isEnglish
              ? 'Enter your work email and we will prepare password reset instructions.'
              : 'Вкажіть службову пошту, і система підготує інструкції для відновлення пароля.'}
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex gap-6" style={{ fontSize: 12, opacity: 0.5 }}>
            <span>© Revela</span>
            <span>·</span>
            <span>INNOVATE Hackathon 2026</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center" style={{ padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 0,
              marginBottom: 28,
              fontSize: 13,
            }}
          >
            <ArrowLeft size={16} />
            {isEnglish ? 'Back to sign in' : 'Назад до входу'}
          </button>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)', marginBottom: 8 }}>
              {isEnglish ? 'Forgot password?' : 'Забули пароль?'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {isEnglish
                ? 'This is a demo flow. Password email delivery is not connected yet.'
                : 'Це демонстраційний сценарій. Надсилання листів поки не підключене.'}
            </p>
          </div>

          {isSubmitted && (
            <div
              style={{
                marginBottom: 16,
                borderRadius: 8,
                border: '1px solid #86EFAC',
                background: '#F0FDF4',
                color: '#166534',
                padding: '10px 12px',
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {isEnglish ? 'Instructions prepared. Check your work mailbox.' : 'Інструкції підготовлено. Перевірте вашу службову пошту.'}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {isEnglish ? 'Email' : 'Електронна пошта'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@municipality.gov.ua"
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
                  {isEnglish ? 'Send instructions' : 'Надіслати інструкцію'} <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </div>
  );
}
