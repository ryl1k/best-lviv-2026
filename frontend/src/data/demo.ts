export const STATS = {
  totalLand: 21_656,
  totalEstate: 20_382,
  totalRecords: 42_038,
  matchedOwners: 10_936,
  totalDiscrepancies: 4_027,
  highSeverity: 3_885,
  mediumSeverity: 487,
  lowSeverity: 2_717,
  estimatedLoss: 2_400_000,
} as const;

export interface RuleBreakdown {
  code: string;
  name: string;
  count: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const RULES: RuleBreakdown[] = [
  { code: 'R01', name: 'Припинене право, активний землекористувач', count: 3708, severity: 'HIGH' },
  { code: 'R02', name: 'Невідповідність призначення землі', count: 177, severity: 'HIGH' },
  { code: 'R03', name: 'Земля без нерухомості', count: 470, severity: 'MEDIUM' },
  { code: 'R04', name: 'Невалідний податковий номер', count: 2673, severity: 'LOW' },
  { code: 'R05', name: 'Дублікати записів', count: 1, severity: 'MEDIUM' },
  { code: 'R06', name: 'Розбіжність імен', count: 16, severity: 'MEDIUM' },
  { code: 'R07', name: 'Неповний запис', count: 44, severity: 'LOW' },
];

export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';
export type ResolutionStatus = 'NEW' | 'IN_REVIEW' | 'CONFIRMED' | 'DISMISSED';

export function formatNumber(value: number, locale = 'uk-UA'): string {
  return value.toLocaleString(locale);
}

export function formatCurrencyCompact(value: number, locale = 'uk-UA'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 1,
    notation: 'compact',
  }).format(value);
}
