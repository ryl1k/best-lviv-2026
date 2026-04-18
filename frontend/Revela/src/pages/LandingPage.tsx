import { useNavigate } from 'react-router';
import { ArrowRight, Shield, Zap, BarChart3, FileSearch, ChevronRight } from 'lucide-react';

const FEATURES = [
  {
    icon: FileSearch,
    title: 'Автоматичне зіставлення',
    desc: 'Порівняння земельного реєстру та реєстру нерухомості за секунди замість тижнів ручної роботи.',
  },
  {
    icon: BarChart3,
    title: '7 правил перевірки',
    desc: 'Виявлення припинених прав, невідповідностей призначення, дублікатів та інших розбіжностей.',
  },
  {
    icon: Zap,
    title: 'Миттєвий результат',
    desc: 'Пріоритезований перелік кейсів для перевірки з оцінкою критичності та потенційних втрат.',
  },
  {
    icon: Shield,
    title: 'Безпека даних',
    desc: 'Дані не покидають ваш сервер. Аудит-лог всіх операцій. Сумісність з Trembita.',
  },
];

const STATS = [
  { value: '42 038', label: 'записів оброблено', sub: 'за один аналіз' },
  { value: '4 027', label: 'розбіжностей', sub: 'виявлено автоматично' },
  { value: '<60с', label: 'час аналізу', sub: 'для повного зіставлення' },
  { value: '~2.4 млн ₴', label: 'потенційні втрати', sub: 'знайдено для однієї ТГ' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-8"
        style={{
          height: 64,
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 3,
              background: 'var(--accent)',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
            Revela
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 6,
              transition: 'background-color 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Увійти
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '8px 18px',
              fontSize: 14,
              fontWeight: 500,
              color: '#fff',
              background: 'var(--accent)',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 6,
              transition: 'background-color 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
          >
            Почати
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '80px 32px 64px',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            background: 'var(--accent-subtle)',
            color: 'var(--accent)',
            marginBottom: 24,
          }}
        >
          Hackathon Innovate 2026
        </span>

        <h1
          style={{
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: 'var(--text-primary)',
            margin: '0 auto 20px',
            maxWidth: 800,
          }}
        >
          Робить приховане
          <br />
          <span style={{ color: 'var(--accent)' }}>видимим</span>
        </h1>

        <p
          style={{
            fontSize: 18,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            maxWidth: 600,
            margin: '0 auto 40px',
          }}
        >
          Revela автоматично зіставляє державні реєстри, виявляє розбіжності та показує де громада втрачає податкові надходження.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/login')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 52,
              padding: '0 28px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
          >
            Спробувати безкоштовно <ArrowRight size={18} />
          </button>
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 52,
              padding: '0 28px',
              background: 'var(--surface)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'border-color 150ms, background-color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.background = 'var(--surface-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'var(--surface)';
            }}
          >
            Дізнатися більше <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* Stats bar */}
      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 32px 80px',
        }}
      >
        <div
          className="grid grid-cols-4 gap-0"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              style={{
                padding: '28px 24px',
                textAlign: 'center',
                borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--accent)',
                  letterSpacing: '-0.02em',
                  marginBottom: 4,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 32px 80px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: '0 0 12px',
            }}
          >
            Як це працює
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
            Завантажте два реєстри - отримайте повний аудит за секунди
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 28,
                transition: 'border-color 150ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <f.icon size={20} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                {f.title}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 32px 64px',
        }}
      >
        <div
          style={{
            background: 'var(--accent)',
            borderRadius: 12,
            padding: '48px 40px',
            textAlign: 'center',
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
              backgroundSize: '32px 32px',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#fff',
                margin: '0 0 12px',
                letterSpacing: '-0.02em',
              }}
            >
              Готові знайти приховані втрати?
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 28, maxWidth: 480, margin: '0 auto 28px' }}>
              Перші 3 аналізи безкоштовно. Без зобов'язань.
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 48,
                padding: '0 24px',
                background: '#fff',
                color: 'var(--accent)',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 150ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Розпочати <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px 32px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ width: 5, height: 5, borderRadius: 1, background: 'var(--accent)', display: 'inline-block' }} />
          <span style={{ fontWeight: 500 }}>Revela</span>
          <span>· © 2026</span>
        </div>
        <div className="flex gap-6">
          <span>Документація</span>
          <span>Підтримка</span>
          <span>Конфіденційність</span>
        </div>
      </footer>
    </div>
  );
}
