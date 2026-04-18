import { useNavigate } from 'react-router';
import {
  Plus,
  FileText,
  TrendingUp,
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from 'lucide-react';

const RECENT_TASKS = [
  {
    id: 'a4f2',
    name: 'Аналіз Острівська ТГ',
    date: '18.04.2026',
    status: 'completed' as const,
    discrepancies: 4027,
    highSeverity: 3885,
    files: 'ДРПП_ostriv.xlsx + ДЗК_ostriv.xlsx',
  },
  {
    id: 'b7c1',
    name: 'Аналіз Сокальська ТГ',
    date: '15.04.2026',
    status: 'completed' as const,
    discrepancies: 2841,
    highSeverity: 1920,
    files: 'ДРПП_sokal.xlsx + ДЗК_sokal.xlsx',
  },
  {
    id: 'c3e9',
    name: 'Аналіз Червоноградська ТГ',
    date: '10.04.2026',
    status: 'completed' as const,
    discrepancies: 1563,
    highSeverity: 890,
    files: 'ДРПП_chervono.xlsx + ДЗК_chervono.xlsx',
  },
];

const QUICK_STATS = [
  { label: 'Всього аналізів', value: '3', icon: BarChart3, color: 'var(--accent)' },
  { label: 'Виявлено розбіжностей', value: '8 431', icon: AlertTriangle, color: 'var(--danger)' },
  { label: 'Підтверджено', value: '1 247', icon: CheckCircle, color: 'var(--success)' },
  { label: 'В роботі', value: '892', icon: Clock, color: 'var(--warning)' },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div
      className="max-w-[1440px] mx-auto"
      style={{ padding: '32px 32px 64px' }}
    >
      {/* Welcome header */}
      <div
        className="flex items-start justify-between"
        style={{ marginBottom: 32 }}
      >
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            Острівська ТГ · Львівська область
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Вітаємо, Олексій
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
            Ваш останній аналіз виявив 4 027 розбіжностей. 3 885 потребують уваги.
          </p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            height: 44,
            padding: '0 20px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 150ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <Plus size={18} /> Новий аналіз
        </button>
      </div>

      {/* Quick stats */}
      <div
        className="grid grid-cols-4 gap-4"
        style={{ marginBottom: 32 }}
      >
        {QUICK_STATS.map((stat) => (
          <div
            key={stat.label}
            className="card"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                {stat.label}
              </span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `color-mix(in srgb, ${stat.color} 10%, transparent)`,
                  color: stat.color,
                }}
              >
                <stat.icon size={16} />
              </span>
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent analyses */}
      <div style={{ marginBottom: 32 }}>
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: 16 }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Останні аналізи
          </h2>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Всі аналізи
          </button>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {RECENT_TASKS.map((task, idx) => (
            <div
              key={task.id}
              onClick={() => navigate(`/tasks/${task.id}`)}
              className="flex items-center"
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'background-color 120ms',
                borderBottom:
                  idx < RECENT_TASKS.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'var(--surface-muted)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  flexShrink: 0,
                }}
              >
                <FileText size={18} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {task.name}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      background: 'var(--success-subtle)',
                      color: '#15803D',
                    }}
                  >
                    <CheckCircle size={10} /> Завершено
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {task.files}
                </div>
              </div>

              <div style={{ textAlign: 'right', marginRight: 16 }}>
                <div className="flex items-center gap-2" style={{ justifyContent: 'flex-end' }}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--danger)',
                    }}
                  >
                    {task.discrepancies.toLocaleString('uk-UA')}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>розбіжностей</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {task.highSeverity.toLocaleString('uk-UA')} високої критичності
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: 'var(--text-muted)',
                  }}
                >
                  {task.date}
                </span>
                <ChevronRight size={16} style={{ color: 'var(--text-disabled)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: '0 0 16px',
          }}
        >
          Швидкі дії
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: Plus,
              title: 'Новий аналіз',
              desc: 'Завантажити нові реєстри для перевірки',
              onClick: () => navigate('/upload'),
            },
            {
              icon: TrendingUp,
              title: 'Останній звіт',
              desc: 'Переглянути результати аналізу Острівської ТГ',
              onClick: () => navigate('/tasks/a4f2'),
            },
            {
              icon: FileText,
              title: 'Експорт даних',
              desc: 'Завантажити CSV з усіма розбіжностями',
              onClick: () => {},
            },
          ].map((action) => (
            <button
              key={action.title}
              onClick={action.onClick}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 20,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'border-color 150ms, background-color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'var(--accent-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--surface)';
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <action.icon size={18} />
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                }}
              >
                {action.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{action.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
