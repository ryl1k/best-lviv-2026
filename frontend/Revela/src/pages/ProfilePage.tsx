import { useState } from 'react';
import { User, Building2, Mail, Phone, Shield, Key, LogOut, Save } from 'lucide-react';

export default function ProfilePage() {
  const [name, setName] = useState('Олексій Коваленко');
  const [email, setEmail] = useState('o.kovalenko@ostrivska.gov.ua');
  const [phone, setPhone] = useState('+380 67 123 45 67');
  const [position, setPosition] = useState('Начальник відділу земельних ресурсів');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      className="max-w-[960px] mx-auto"
      style={{ padding: '32px 32px 64px' }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: 'var(--text-primary)',
          margin: '0 0 8px',
        }}
      >
        Профіль
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>
        Керуйте вашим обліковим записом та налаштуваннями
      </p>

      <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {[
              { icon: User, label: 'Особисті дані', active: true },
              { icon: Building2, label: 'Громада', active: false },
              { icon: Shield, label: 'Безпека', active: false },
              { icon: Key, label: 'API ключі', active: false },
            ].map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-3 w-full"
                style={{
                  padding: '12px 16px',
                  fontSize: 13,
                  fontWeight: item.active ? 600 : 400,
                  color: item.active ? 'var(--accent)' : 'var(--text-secondary)',
                  background: item.active ? 'var(--accent-subtle)' : 'transparent',
                  border: 'none',
                  borderLeft: item.active ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 150ms',
                }}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>

          <button
            className="flex items-center gap-3 w-full"
            style={{
              padding: '12px 16px',
              fontSize: 13,
              color: 'var(--danger)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginTop: 8,
            }}
          >
            <LogOut size={16} />
            Вийти з системи
          </button>
        </div>

        {/* Main content */}
        <div style={{ flex: 1 }}>
          {/* Avatar + name card */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <div className="flex items-center gap-4" style={{ marginBottom: 24 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  fontSize: 22,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ОК
              </div>
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 2,
                  }}
                >
                  {name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{position}</div>
                <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      background: 'var(--accent-subtle)',
                      color: 'var(--accent)',
                    }}
                  >
                    Адміністратор
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
                    Активний
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: 20,
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 16,
                }}
              >
                Особисті дані
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Повне ім'я"
                  icon={<User size={14} />}
                  value={name}
                  onChange={setName}
                />
                <FormField
                  label="Посада"
                  icon={<Building2 size={14} />}
                  value={position}
                  onChange={setPosition}
                />
                <FormField
                  label="Електронна пошта"
                  icon={<Mail size={14} />}
                  value={email}
                  onChange={setEmail}
                  type="email"
                />
                <FormField
                  label="Телефон"
                  icon={<Phone size={14} />}
                  value={phone}
                  onChange={setPhone}
                  type="tel"
                />
              </div>
            </div>
          </div>

          {/* OTG info */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 16,
              }}
            >
              Інформація про громаду
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InfoRow label="Назва" value="Острівська територіальна громада" />
              <InfoRow label="Область" value="Львівська" />
              <InfoRow label="Район" value="Сокальський" />
              <InfoRow label="КОАТУУ" value="4624884200" mono />
              <InfoRow label="Населення" value="~12 400 осіб" />
              <InfoRow
                label="Статус підписки"
                value={
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
                    Активна до 31.12.2026
                  </span>
                }
              />
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 40,
                padding: '0 20px',
                background: saved ? 'var(--success)' : 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 150ms',
              }}
            >
              <Save size={16} />
              {saved ? 'Збережено!' : 'Зберегти зміни'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  icon,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--text-muted)',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <span style={{ color: 'var(--text-disabled)' }}>{icon}</span>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          height: 40,
          padding: '0 12px',
          border: '1px solid var(--border)',
          borderRadius: 6,
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
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        padding: '8px 0',
        borderBottom: '1px solid var(--border)',
        gap: 12,
      }}
    >
      <span
        style={{
          width: 160,
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          color: 'var(--text-primary)',
          fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
        }}
      >
        {value}
      </span>
    </div>
  );
}
