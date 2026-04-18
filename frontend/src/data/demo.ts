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
  count: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const RULES: RuleBreakdown[] = [
  { code: 'R01', count: 3708, severity: 'HIGH' },
  { code: 'R02', count: 177, severity: 'HIGH' },
  { code: 'R03', count: 470, severity: 'MEDIUM' },
  { code: 'R04', count: 2673, severity: 'LOW' },
  { code: 'R05', count: 1, severity: 'MEDIUM' },
  { code: 'R06', count: 16, severity: 'MEDIUM' },
  { code: 'R07', count: 44, severity: 'LOW' },
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
