import type { TFunction } from 'i18next';

export type ProfileFieldId = 'name' | 'role' | 'email' | 'phone';

export interface ProfileNavItem {
  id: string;
  label: string;
  detail: string;
}

export interface ProfileField {
  id: ProfileFieldId;
  label: string;
  value: string;
  type: 'text' | 'email' | 'tel';
}

export function getProfilePageContent(t: TFunction) {
  return {
    hero: {
      eyebrow: t('profile.hero.eyebrow'),
      title: t('profile.hero.title'),
      description: t('profile.hero.description'),
      reviewStamp: t('profile.hero.reviewStamp'),
    },
    identity: {
      initials: 'ОК',
      name: t('profile.identity.name'),
      role: t('profile.identity.role'),
      organization: t('profile.identity.organization'),
      accessLevel: t('profile.identity.accessLevel'),
      status: t('profile.identity.status'),
      summary: t('profile.identity.summary'),
    },
    navigation: [
      { id: 'identity', label: t('profile.navigation.identity.label'), detail: t('profile.navigation.identity.detail') },
      { id: 'personal', label: t('profile.navigation.personal.label'), detail: t('profile.navigation.personal.detail') },
      { id: 'municipality', label: t('profile.navigation.municipality.label'), detail: t('profile.navigation.municipality.detail') },
    ] satisfies ProfileNavItem[],
    identityFacts: [
      { label: t('profile.identityFacts.workstream.label'), value: t('profile.identityFacts.workstream.value') },
      { label: t('profile.identityFacts.access.label'), value: t('profile.identityFacts.access.value') },
      { label: t('profile.identityFacts.workspace.label'), value: t('profile.identityFacts.workspace.value') },
      { label: t('profile.identityFacts.tenure.label'), value: t('profile.identityFacts.tenure.value') },
    ],
    personalFields: [
      { id: 'name', label: t('profile.personalFields.name.label'), value: t('profile.personalFields.name.value'), type: 'text' },
      { id: 'role', label: t('profile.personalFields.role.label'), value: t('profile.personalFields.role.value'), type: 'text' },
      { id: 'email', label: t('profile.personalFields.email.label'), value: t('profile.personalFields.email.value'), type: 'email' },
      { id: 'phone', label: t('profile.personalFields.phone.label'), value: t('profile.personalFields.phone.value'), type: 'tel' },
    ] satisfies ProfileField[],
    municipality: {
      eyebrow: t('profile.municipality.eyebrow'),
      title: t('profile.municipality.title'),
      description: t('profile.municipality.description'),
      records: [
        { label: t('profile.municipality.records.name.label'), value: t('profile.municipality.records.name.value') },
        { label: t('profile.municipality.records.region.label'), value: t('profile.municipality.records.region.value') },
        { label: t('profile.municipality.records.district.label'), value: t('profile.municipality.records.district.value') },
        { label: t('profile.municipality.records.koatuu.label'), value: t('profile.municipality.records.koatuu.value'), mono: true },
        { label: t('profile.municipality.records.population.label'), value: t('profile.municipality.records.population.value') },
        { label: t('profile.municipality.records.workspace.label'), value: t('profile.municipality.records.workspace.value') },
      ],
      operationalNotes: [
        { label: t('profile.municipality.notes.subscription.label'), value: t('profile.municipality.notes.subscription.value') },
        { label: t('profile.municipality.notes.sync.label'), value: t('profile.municipality.notes.sync.value') },
        { label: t('profile.municipality.notes.coverage.label'), value: t('profile.municipality.notes.coverage.value') },
      ],
    },
  } as const;
}

export type ProfilePageContent = ReturnType<typeof getProfilePageContent>;
