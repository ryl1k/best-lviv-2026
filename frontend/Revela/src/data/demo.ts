// Demo data from real Sokalsky district dataset

export const STATS = {
  totalLand: 21_656,
  totalEstate: 20_382,
  totalRecords: 42_038,
  matchedOwners: 10_936,
  totalDiscrepancies: 4_027,
  highSeverity: 3_885,
  mediumSeverity: 487,
  lowSeverity: 2_717,
  estimatedLoss: '~2.4 млн ₴',
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

export interface Discrepancy {
  id: number;
  severity: Severity;
  ownerName: string;
  taxId: string;
  ruleCode: string;
  ruleName: string;
  description: string;
  status: ResolutionStatus;
}

export const DISCREPANCIES: Discrepancy[] = [
  {
    id: 1847,
    severity: 'HIGH',
    ownerName: 'Грицина Іван Іванович',
    taxId: '3556083731',
    ruleCode: 'R01',
    ruleName: 'Припинене право',
    description: 'Право припинено 07.04.2015, але активний землекористувач на 2 ділянках',
    status: 'NEW',
  },
  {
    id: 1848,
    severity: 'HIGH',
    ownerName: 'Ковальчук Петро Миколайович',
    taxId: '2847561093',
    ruleCode: 'R01',
    ruleName: 'Припинене право',
    description: 'Право припинено 12.08.2018, але активний землекористувач на 1 ділянці',
    status: 'NEW',
  },
  {
    id: 1849,
    severity: 'HIGH',
    ownerName: 'Бондаренко Оксана Василівна',
    taxId: '3194726580',
    ruleCode: 'R02',
    ruleName: 'Невідповідність призначення',
    description: 'Земля 01.01 (с/г), але зареєстровано нежитлову будівлю',
    status: 'IN_REVIEW',
  },
  {
    id: 1850,
    severity: 'MEDIUM',
    ownerName: 'Мельник Андрій Олегович',
    taxId: '1987654320',
    ruleCode: 'R03',
    ruleName: 'Земля без нерухомості',
    description: 'Є 3 земельні ділянки, але жодного запису в реєстрі нерухомості',
    status: 'NEW',
  },
  {
    id: 1851,
    severity: 'LOW',
    ownerName: 'Шевченко Марія Іванівна',
    taxId: '456789012',
    ruleCode: 'R04',
    ruleName: 'Невалідний ІПН',
    description: 'Податковий номер 9 цифр замість 10',
    status: 'NEW',
  },
  {
    id: 1852,
    severity: 'HIGH',
    ownerName: 'Лисенко Віталій Степанович',
    taxId: '4051237896',
    ruleCode: 'R01',
    ruleName: 'Припинене право',
    description: 'Право припинено 21.11.2019, але активний землекористувач на 4 ділянках',
    status: 'CONFIRMED',
  },
  {
    id: 1853,
    severity: 'MEDIUM',
    ownerName: 'Олійник Тетяна Петрівна',
    taxId: '3672819054',
    ruleCode: 'R06',
    ruleName: 'Розбіжність імен',
    description: 'В ДЗК "Олійник Т.П.", в ДРПП "Олiйник Тетяна Петрівна" (латинська i)',
    status: 'NEW',
  },
  {
    id: 1854,
    severity: 'HIGH',
    ownerName: 'Ткачук Сергій Васильович',
    taxId: '2938475610',
    ruleCode: 'R02',
    ruleName: 'Невідповідність призначення',
    description: 'Земля 01.03 (фермерське), але зареєстровано торговельну будівлю',
    status: 'NEW',
  },
  {
    id: 1855,
    severity: 'LOW',
    ownerName: 'Савченко Ольга Дмитрівна',
    taxId: '',
    ruleCode: 'R04',
    ruleName: 'Невалідний ІПН',
    description: 'Податковий номер відсутній у записі нерухомості',
    status: 'DISMISSED',
  },
  {
    id: 1856,
    severity: 'HIGH',
    ownerName: 'Павленко Микола Григорович',
    taxId: '3018274659',
    ruleCode: 'R01',
    ruleName: 'Припинене право',
    description: 'Право припинено 03.06.2020, але активний землекористувач на 1 ділянці',
    status: 'NEW',
  },
];

// Detailed data for Object Details page (case #1847)
export const CASE_DETAIL = {
  id: 1847,
  severity: 'HIGH' as Severity,
  ownerName: 'Грицина Іван Іванович',
  taxId: '3556083731',
  ruleCode: 'R01',
  ruleName: 'Припинене право власності на нерухомість, але активний землекористувач',
  ruleExplanation:
    'За ДРПП право власності на квартиру припинено 07.04.2015. За ДЗК особа досі числиться землекористувачем двох ділянок, найпізніший запис - 18.01.2024. Вірогідність систематичної помилки або податкового розриву - висока.',
  landRecords: [
    {
      cadastralNumber: '4624884200:05:000:0009',
      purpose: '02.01 Для будівництва і обслуговування житлового будинку',
      location: 'Львівська область, Сокальський район, Острівська сільська рада',
      areaHa: '0.2500',
      normativeValue: '125 400.00 ₴',
      registeredAt: '18.01.2024',
      owner: 'Грицина Іван Іванович',
    },
    {
      cadastralNumber: '4624884200:05:000:0134',
      purpose: '01.01 Для ведення товарного сільськогосподарського виробництва',
      location: 'Львівська область, Сокальський район, Острівська сільська рада',
      areaHa: '1.4200',
      normativeValue: '48 730.00 ₴',
      registeredAt: '14.02.2013',
      owner: 'Грицина Іван Іванович',
    },
  ],
  estateRecords: [
    {
      objectType: 'Квартира',
      address: 'вулиця Коваліва, будинок 45, квартира 77',
      areaM2: '68.4',
      registeredAt: '14.02.2013',
      terminatedAt: '07.04.2015',
      owner: 'Грицина Іван Іванович',
      ownershipShare: '1/1',
    },
  ],
  timeline: [
    { date: '14.02.2013', event: 'Реєстрація права на квартиру (ДРПП)', source: 'ДРПП' },
    { date: '14.02.2013', event: 'Реєстрація права на земельну ділянку 01.01 (ДЗК)', source: 'ДЗК' },
    { date: '07.04.2015', event: 'Припинення права на квартиру', source: 'ДРПП', danger: true },
    { date: '18.01.2024', event: 'Реєстрація права на земельну ділянку 02.01 (ДЗК)', source: 'ДЗК', danger: true },
  ],
};

export function formatNumber(n: number): string {
  return n.toLocaleString('uk-UA');
}

export function severityColor(severity: Severity) {
  switch (severity) {
    case 'HIGH':
      return { dot: 'bg-revela-danger', bg: 'bg-revela-danger-subtle', text: 'text-revela-danger', label: 'Висока' };
    case 'MEDIUM':
      return { dot: 'bg-revela-warning', bg: 'bg-revela-warning-subtle', text: 'text-revela-warning', label: 'Середня' };
    case 'LOW':
      return { dot: 'bg-revela-success', bg: 'bg-revela-success-subtle', text: 'text-revela-success', label: 'Низька' };
  }
}

export function statusLabel(status: ResolutionStatus): { label: string; variant: string } {
  switch (status) {
    case 'NEW':
      return { label: 'Новий', variant: 'default' };
    case 'IN_REVIEW':
      return { label: 'В роботі', variant: 'secondary' };
    case 'CONFIRMED':
      return { label: 'Підтверджено', variant: 'destructive' };
    case 'DISMISSED':
      return { label: 'Відхилено', variant: 'outline' };
  }
}
