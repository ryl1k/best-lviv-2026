import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BriefcaseBusiness, LogOut, Mail, MapPin, Phone, User } from 'lucide-react';

import {
  profilePageContent,
  type ProfileField,
  type ProfileFieldId,
  type ProfileNavItem,
} from '@/data/profile';

type PersonalValues = Record<ProfileFieldId, string>;

const initialPersonalValues = profilePageContent.personalFields.reduce((acc, field) => {
  acc[field.id] = field.value;
  return acc;
}, {} as PersonalValues);

export default function ProfilePage() {
  const [personalValues, setPersonalValues] = useState<PersonalValues>(initialPersonalValues);
  const [activeSection, setActiveSection] = useState<string>(
    profilePageContent.navigation[0]?.id ?? 'identity',
  );

  const sectionIds = useRef(profilePageContent.navigation.map((item) => item.id));

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const sections = sectionIds.current
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-16% 0px -58% 0px',
        threshold: [0.2, 0.5, 0.75],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const jumpToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFieldChange = (fieldId: ProfileFieldId, value: string) => {
    setPersonalValues((current) => ({ ...current, [fieldId]: value }));
  };

  return (
    <section className="mx-auto w-full max-w-[1400px] px-6 py-14 md:px-10 md:py-16">
      <div className="grid gap-8 px-1 sm:px-2 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:px-0">
        <div className="hidden lg:block">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
            {profilePageContent.hero.eyebrow}
          </span>
        </div>

        <header className="min-w-0 border-b border-landing-border pb-8 md:pb-9">
          <div className="max-w-3xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted lg:hidden">
              {profilePageContent.hero.eyebrow}
            </span>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-landing-ink md:text-4xl">
              {profilePageContent.hero.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-landing-ink-soft md:text-base">
              {profilePageContent.hero.description}
            </p>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-landing-border pt-4 sm:grid-cols-3 sm:gap-6">
            <HeaderMeta label="Оновлення" value={profilePageContent.hero.reviewStamp} />
            <HeaderMeta label="Статус доступу" value={profilePageContent.identity.status} />
            <HeaderMeta label="Робочий простір" value={profilePageContent.identity.organization} />
          </dl>
        </header>
      </div>

      <div className="mt-8 grid items-start gap-10 px-1 sm:px-2 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:px-0">
        <aside className="max-w-full lg:sticky lg:top-24 lg:h-fit">
          <nav className="border-y border-landing-border" aria-label="Profile sections">
            {profilePageContent.navigation.map((item) => (
              <SectionNavButton
                key={item.id}
                item={item}
                active={activeSection === item.id}
                onClick={() => jumpToSection(item.id)}
              />
            ))}
          </nav>

          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 border-none bg-transparent px-0 py-0 text-sm text-landing-ink-soft transition-colors hover:text-landing-ink"
          >
            <LogOut size={15} />
            Вийти з системи
          </button>
        </aside>

        <div className="min-w-0 space-y-14">
          <section id="identity" className="scroll-mt-28 border border-landing-border bg-landing-paper">
            <div className="grid gap-px bg-landing-border xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-landing-border bg-landing-surface text-base font-semibold tracking-[0.08em] text-landing-ink">
                    {profilePageContent.identity.initials}
                  </div>

                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                      Overview
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-landing-ink md:text-4xl">
                      {profilePageContent.identity.name}
                    </h2>
                    <p className="mt-2 text-base text-landing-ink">{profilePageContent.identity.role}</p>
                    <p className="mt-1 text-sm text-landing-ink-soft">
                      {profilePageContent.identity.organization}
                    </p>
                  </div>
                </div>

                <p className="mt-8 max-w-2xl text-base leading-relaxed text-landing-ink-soft">
                  {profilePageContent.identity.summary}
                </p>

                <div className="mt-8 grid gap-4 border-t border-landing-border pt-6 md:grid-cols-2">
                  <MetaItem
                    icon={<BriefcaseBusiness size={15} />}
                    label="Робочий контур"
                    value={profilePageContent.identityFacts[0]?.value ?? ''}
                  />
                  <MetaItem
                    icon={<MapPin size={15} />}
                    label="Поточний простір"
                    value={profilePageContent.identityFacts[2]?.value ?? ''}
                  />
                </div>
              </div>

              <div className="bg-landing-surface">
                <div className="border-b border-landing-border px-6 py-5 md:px-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                    Operational context
                  </p>
                </div>
                <dl className="grid gap-px bg-landing-border sm:grid-cols-2 xl:grid-cols-1">
                  {profilePageContent.identityFacts.map((fact) => (
                    <div key={fact.label} className="bg-landing-surface px-6 py-5 md:px-8">
                      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                        {fact.label}
                      </dt>
                      <dd className="mt-3 text-sm leading-relaxed text-landing-ink">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>

          <section id="personal" className="scroll-mt-28 border-t border-landing-border pt-10">
            <SectionIntro
              eyebrow="Personal information"
              title="Персональні дані"
              description="Базовий статичний профіль оператора. Поля лишаються редагованими лише на рівні інтерфейсу без будь-якої серверної логіки."
            />

            <div className="mt-8 overflow-hidden border border-landing-border bg-landing-paper">
              {profilePageContent.personalFields.map((field) => (
                <EditableField
                  key={field.id}
                  field={field}
                  value={personalValues[field.id]}
                  onChange={(value) => handleFieldChange(field.id, value)}
                />
              ))}
            </div>
          </section>

          <section id="municipality" className="scroll-mt-28 border-t border-landing-border pt-10">
            <SectionIntro
              eyebrow="Community context"
              title={profilePageContent.municipality.title}
              description={profilePageContent.municipality.description}
            />

            <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="overflow-hidden border border-landing-border bg-landing-paper">
                {profilePageContent.municipality.records.map((record) => (
                  <DetailRow
                    key={record.label}
                    label={record.label}
                    value={record.value}
                    mono={'mono' in record ? record.mono : false}
                  />
                ))}
              </div>

              <aside className="border border-landing-border bg-landing-surface p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                  Service notes
                </p>
                <div className="mt-5 space-y-5">
                  {profilePageContent.municipality.operationalNotes.map((note) => (
                    <div key={note.label} className="border-b border-landing-border pb-4 last:border-b-0 last:pb-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
                        {note.label}
                      </div>
                      <div className="mt-2 text-sm leading-relaxed text-landing-ink">{note.value}</div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function HeaderMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
        {label}
      </dt>
      <dd className="mt-2 text-sm text-landing-ink">{value}</dd>
    </div>
  );
}

function SectionNavButton({
  item,
  active,
  onClick,
}: {
  item: ProfileNavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start justify-between border-b border-landing-border px-0 py-4 text-left last:border-b-0"
    >
      <div>
        <div className={`text-sm font-medium ${active ? 'text-landing-ink' : 'text-landing-ink-soft'}`}>
          {item.label}
        </div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
          {item.detail}
        </div>
      </div>
      <span
        aria-hidden="true"
        className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
          active ? 'bg-landing-ink' : 'bg-landing-border-strong'
        }`}
      />
    </button>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
        {eyebrow}
      </div>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight text-landing-ink md:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-landing-ink-soft">{description}</p>
      </div>
    </div>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-landing-muted">{icon}</div>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
          {label}
        </div>
        <div className="mt-2 text-sm text-landing-ink">{value}</div>
      </div>
    </div>
  );
}

function EditableField({
  field,
  value,
  onChange,
}: {
  field: ProfileField;
  value: string;
  onChange: (value: string) => void;
}) {
  const icon =
    field.id === 'name' ? (
      <User size={15} />
    ) : field.id === 'role' ? (
      <BriefcaseBusiness size={15} />
    ) : field.id === 'email' ? (
      <Mail size={15} />
    ) : (
      <Phone size={15} />
    );

  return (
    <label className="grid gap-4 border-b border-landing-border px-5 py-5 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)] md:items-start md:gap-6">
      <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
        {icon}
        {field.label}
      </span>
      <input
        type={field.type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border-0 bg-transparent px-0 text-base text-landing-ink outline-none placeholder:text-landing-muted"
      />
    </label>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-2 border-b border-landing-border px-5 py-4 last:border-b-0 md:grid-cols-[190px_minmax(0,1fr)] md:gap-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-landing-muted">
        {label}
      </div>
      <div className={mono ? 'font-mono text-sm text-landing-ink' : 'text-sm text-landing-ink'}>
        {value}
      </div>
    </div>
  );
}
