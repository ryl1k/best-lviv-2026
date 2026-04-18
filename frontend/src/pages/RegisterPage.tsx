import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

import { authApi, getApiErrorMessage } from '@/api';

function buildUsername(fullName: string, email: string): string {
  const normalized = fullName.trim();
  if (normalized.length > 0) {
    return normalized.replace(/\s+/g, ' ');
  }

  return email.trim().split('@')[0] || 'revela-user';
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === 'en';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = fullName.trim().length > 0 && email.trim().length > 0 && passwordsMatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitError(null);
    setLoading(true);
    try {
      await authApi.signup({
        username: buildUsername(fullName, email),
        email: email.trim(),
        password,
      });
      navigate('/login', { state: { registered: true } });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Не вдалося створити акаунт. Спробуйте ще раз.'));
    } finally {
      setLoading(false);
    }
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
            {isEnglish ? 'Create access.' : 'Створіть доступ.'}
            <br />
            {isEnglish ? 'Keep the same workflow.' : 'Залиштесь у тій самій робочій зоні.'}
          </h1>
          <p style={{ fontSize: 15, opacity: 0.8, lineHeight: 1.6, maxWidth: 340 }}>
            {isEnglish
              ? 'Register a municipal operator account and continue working inside the same audit interface.'
              : 'Зареєструйте обліковий запис оператора громади та працюйте в тій самій аудиторській поверхні.'}
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
              10 хв
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
              {isEnglish ? 'average to first audit launch' : 'середній час до першого запуску аудиту'}
            </div>
          </div>

          <div className="flex gap-6" style={{ fontSize: 12, opacity: 0.5 }}>
            <span>© Revela</span>
            <span>·</span>
            <span>INNOVATE Hackathon 2026</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center" style={{ padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div className="lg:hidden flex items-center gap-2" style={{ marginBottom: 40 }}>
            <span style={{ width: 6, height: 6, borderRadius: 2, background: 'var(--accent)', display: 'inline-block' }} />
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Revela</span>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)', marginBottom: 8 }}>
              {isEnglish ? 'Create account' : 'Створення акаунта'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {isEnglish ? 'Register to access audits and case review.' : 'Зареєструйтесь для доступу до аудитів та роботи з кейсами.'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {isEnglish ? 'Full name' : 'Імʼя та прізвище'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (submitError) setSubmitError(null);
                }}
                placeholder={isEnglish ? 'Name Surname' : 'Імʼя Прізвище'}
                autoComplete="name"
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

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {isEnglish ? 'Email' : 'Електронна пошта'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (submitError) setSubmitError(null);
                }}
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

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {isEnglish ? 'Password' : 'Пароль'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (submitError) setSubmitError(null);
                  }}
                  placeholder={isEnglish ? 'Enter password' : 'Введіть пароль'}
                  autoComplete="new-password"
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
                  onClick={() => setShowPassword((value) => !value)}
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

            <div style={{ marginBottom: confirmPassword.length > 0 && !passwordsMatch ? 8 : 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {isEnglish ? 'Confirm password' : 'Підтвердження пароля'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (submitError) setSubmitError(null);
                  }}
                  placeholder={isEnglish ? 'Repeat password' : 'Повторіть пароль'}
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    height: 44,
                    padding: '0 44px 0 14px',
                    border: `1px solid ${confirmPassword.length > 0 && !passwordsMatch ? '#DC2626' : 'var(--border)'}`,
                    borderRadius: 8,
                    background: 'var(--surface)',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 150ms',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = confirmPassword.length > 0 && !passwordsMatch ? '#DC2626' : 'var(--accent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = confirmPassword.length > 0 && !passwordsMatch ? '#DC2626' : 'var(--border)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
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
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {confirmPassword.length > 0 && !passwordsMatch && (
              <div style={{ marginBottom: 12, color: '#DC2626', fontSize: 12 }}>
                {isEnglish ? 'Passwords do not match.' : 'Паролі не співпадають.'}
              </div>
            )}

            {submitError && (
              <div
                style={{
                  marginBottom: 16,
                  borderRadius: 8,
                  border: '1px solid #FECACA',
                  background: '#FEF2F2',
                  color: '#B91C1C',
                  padding: '10px 12px',
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {submitError}
              </div>
            )}

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
                  {isEnglish ? 'Create account' : 'Створити акаунт'} <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            {isEnglish ? 'Already have access?' : 'Вже є доступ?'}{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
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
              {isEnglish ? 'Sign in' : 'Увійти'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
