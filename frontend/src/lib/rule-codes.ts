import type { TFunction } from 'i18next';

const UNKNOWN_RULE_CODE = 'RXX';
const RULE_CODE_PATTERN = /^R[A-Z0-9]{2,}$/;

export function getRuleShortCode(value: string | undefined): string {
  const normalized = (value ?? '').trim().toUpperCase();
  if (!normalized) return UNKNOWN_RULE_CODE;

  const firstSegment = normalized.split('_')[0];
  if (RULE_CODE_PATTERN.test(firstSegment)) {
    return firstSegment;
  }

  const embeddedMatch = normalized.match(/R[A-Z0-9]{2,}/);
  return embeddedMatch?.[0] ?? UNKNOWN_RULE_CODE;
}

export function getRuleLabel(t: TFunction, value: string | undefined): string {
  const shortCode = getRuleShortCode(value);
  const key = `tasks.rules.${shortCode}.name`;
  const translated = t(key);

  return translated === key ? t('tasks.rules.unknown') : translated;
}

export function getRuleDisplay(t: TFunction, value: string | undefined): { code: string; label: string } {
  const code = getRuleShortCode(value);
  return {
    code,
    label: getRuleLabel(t, value),
  };
}
