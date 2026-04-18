export const landingNavLinks = [
  { label: 'Method', href: '#how' },
  { label: 'Capabilities', href: '#features' },
  { label: 'Evidence', href: '#proof' },
  { label: 'Interface', href: '#interface' },
];

export const landingHero = {
  brand: 'Revela',
  subtitle: '/ Cross-Registry Audit',
  status: 'Now auditing · 21,656 records · 14 communities',
  volume: 'Vol. 01 · 2026',
  titleLineOne: 'Two registries.',
  titleLineTwoEmphasis: 'One',
  titleLineTwoSuffix: 'source of truth.',
  description:
    'Revela compares land and real-estate registries for municipalities — surfacing the discrepancies that quietly cost communities tax revenue.',
  primaryCta: { label: 'See how it works', href: '#how' },
  secondaryCta: { label: 'Explore the interface', href: '#interface' },
  footerFacts: [
    { label: 'Approach', value: 'Cross-registry audit' },
    { label: 'Method', value: 'Rule-based detection' },
    { label: 'For', value: 'Ukrainian municipalities' },
    { label: 'Status', value: 'Pilot — Q2 2026' },
  ],
};

export const landingHeroScene = {
  liveAudit: 'Live audit · session #2026-04-18-A',
  sourceA: 'Source A: Land Registry',
  sourceB: 'Source B: Real Estate',
  output: 'Discrepancies → Cases',
  leftLabel: 'A · Land Registry',
  rightLabel: 'B · Real Estate',
  fileType: '.xlsx',
  bottomLabel: 'Output · Flagged cases',
  bottomSummary: '3 of 8 require review',
  leftRecords: [
    { id: 'ID-4429', label: 'Land · Кадастр 32:01:2200', ok: true },
    { id: 'ID-4431', label: 'Land · Кадастр 32:01:2201', ok: true },
    { id: 'ID-4434', label: 'Land · Кадастр 32:01:2204', ok: false },
    { id: 'ID-4438', label: 'Land · Кадастр 32:01:2207', ok: true },
  ],
  rightRecords: [
    { id: 'RE-9120', label: 'RE · ЄДРПОУ 38291', ok: true },
    { id: 'RE-9121', label: 'RE · ЄДРПОУ 38291', ok: false },
    { id: 'RE-9123', label: 'RE · ЄДРПОУ 38294', ok: true },
    { id: 'RE-9128', label: 'RE · ЄДРПОУ 38299', ok: true },
  ],
  flaggedCases: [
    { code: 'R01', label: 'Active land · terminated rights', risk: 92 },
    { code: 'R02', label: 'Agricultural · commercial use', risk: 78 },
    { code: 'R05', label: 'Tax ID mismatch across registries', risk: 64 },
  ],
};

export const landingHowSection = {
  eyebrow: '§02 — Method',
  titleStart: 'From two spreadsheets to a',
  titleEmphasis: 'prioritized',
  titleEnd: 'list of cases — in under sixty seconds.',
};

export const landingHowSteps = [
  {
    n: '01',
    title: 'Ingest',
    body:
      'Two Excel exports from the State Land Registry and the State Real Estate Registry. No integrations, no API keys — just the files municipalities already have.',
    visual: 'ingest' as const,
  },
  {
    n: '02',
    title: 'Normalize',
    body:
      'Streaming parser harmonizes column shapes, normalizes tax IDs and cadastral numbers, and reconciles encoding differences. The two ledgers are made comparable.',
    visual: 'normalize' as const,
  },
  {
    n: '03',
    title: 'Match',
    body:
      'Records are joined on stable identifiers — tax ID, cadastral number, address signature. O(1) hashmap indexes let one community’s data resolve in seconds.',
    visual: 'match' as const,
  },
  {
    n: '04',
    title: 'Detect',
    body:
      'Seven deterministic rules surface discrepancies: terminated rights with active land, agricultural plots used commercially, conflicting ownership, tax-ID gaps.',
    visual: 'detect' as const,
  },
  {
    n: '05',
    title: 'Prioritize',
    body:
      'Every case receives a risk score and a status. The dashboard hands the auditor a ranked list — not data, but decisions.',
    visual: 'prioritize' as const,
  },
];

export const landingCapabilitiesSection = {
  eyebrow: '§03 — Capabilities',
  titleStart: 'Five capabilities. One',
  titleEmphasis: 'loop',
  titleEnd: 'from raw data to recovered revenue.',
};

export const landingCapabilitiesItems = [
  {
    n: 'i.',
    title: 'Registry comparison',
    body:
      'Two ledgers, one resolved view. Records are joined on stable identifiers and compared field by field — every divergence is recorded.',
    visual: 'compare' as const,
  },
  {
    n: 'ii.',
    title: 'Discrepancy detection',
    body:
      'Seven deterministic rules. Each finding is reproducible, auditable, and tied to specific evidence — never a black box.',
    visual: 'detect' as const,
  },
  {
    n: 'iii.',
    title: 'Risk prioritization',
    body:
      'Cases are scored 0–100 by severity, recency, and tax exposure. Auditors work top-down through what actually matters.',
    visual: 'rank' as const,
  },
  {
    n: 'iv.',
    title: 'Case review',
    body:
      'Each case opens a side-by-side comparison: source A, source B, the conflicting fields, and the rule that triggered the flag.',
    visual: 'review' as const,
  },
  {
    n: 'v.',
    title: 'Export & follow-up',
    body:
      'Export prioritized cases to CSV or PDF for fieldwork. Status flows from NEW → IN REVIEW → CONFIRMED. The loop closes inside the product.',
    visual: 'export' as const,
  },
];

export const landingProofSection = {
  eyebrow: '§04 — Evidence',
  titleStart: 'Built on real registry data — not synthetic',
  titleEmphasis: 'demos',
  titleEnd: '.',
  description:
    'Every figure below comes from a real pilot run on production exports from the State Land Registry and the State Real Estate Registry of Ukraine.',
};

export const landingProofStats = [
  { value: 21656, label: 'Records audited', note: 'in a single pilot community' },
  { value: 3708, label: 'Discrepancies surfaced', note: 'across seven detection rules' },
  { value: 60, label: 'Seconds', note: 'from upload to prioritized list', suffix: 's' },
  { value: 7, label: 'Detection rules', note: 'deterministic, auditable, evidence-backed' },
];

export const landingProofTickerItems = [
  'Cross-registry audit',
  'USAID DOBRE compatible',
  'U-LEAD ready',
  'EU4Digital aligned',
  'Built for Ukrainian OTGs',
  'Decision support, not automation',
  'Evidence-backed findings',
];

export const landingInterfaceSection = {
  eyebrow: '§05 — Interface',
  titleStart: 'A product an auditor can actually',
  titleEmphasis: 'use',
  titleEnd: 'on Monday morning.',
};

export const landingInterfaceStates = [
  { key: 'upload', label: '01 · Upload' },
  { key: 'dashboard', label: '02 · Dashboard' },
  { key: 'table', label: '03 · Discrepancies' },
  { key: 'case', label: '04 · Case detail' },
] as const;

export type LandingInterfaceState = (typeof landingInterfaceStates)[number]['key'];

export const landingInterfaceContent = {
  upload: {
    title: 'New audit session',
    description: 'Upload registry exports. Files stay local until you trigger the audit.',
    files: [
      { label: 'Land Registry · A', file: 'land_registry.xlsx', meta: '10,824 rows · 1.8 MB' },
      { label: 'Real Estate · B', file: 'real_estate.xlsx', meta: '10,832 rows · 1.9 MB' },
    ],
    footer: 'Both files validated',
    cta: 'Run audit →',
  },
  dashboard: {
    title: 'Audit overview',
    meta: 'Session #2026-04-18-A · 58 sec',
    cards: [
      { key: 'Records audited', value: '21,656' },
      { key: 'Discrepancies', value: '3,708' },
      { key: 'High-risk cases', value: '412' },
      { key: 'Avg. risk score', value: '47.2' },
    ],
    chartLabel: 'Distribution by rule',
    rules: [
      { code: 'R01', value: 92 },
      { code: 'R02', value: 71 },
      { code: 'R03', value: 22 },
      { code: 'R04', value: 56 },
      { code: 'R05', value: 64 },
      { code: 'R06', value: 38 },
      { code: 'R07', value: 18 },
    ],
  },
  table: {
    title: 'Discrepancies',
    meta: '3,708 cases · sorted by risk',
    columns: ['Case', 'Rule', 'Risk', 'Status'],
    rows: [
      { id: 'C-2841', rule: 'R01', risk: 94, status: 'NEW' },
      { id: 'C-2702', rule: 'R05', risk: 88, status: 'NEW' },
      { id: 'C-2655', rule: 'R02', risk: 81, status: 'IN REVIEW' },
      { id: 'C-2604', rule: 'R01', risk: 73, status: 'NEW' },
      { id: 'C-2541', rule: 'R04', risk: 66, status: 'IN REVIEW' },
      { id: 'C-2488', rule: 'R05', risk: 58, status: 'NEW' },
      { id: 'C-2401', rule: 'R02', risk: 51, status: 'CONFIRMED' },
    ],
  },
  case: {
    title: 'Case C-2841',
    meta: 'R01 · terminated rights with active land · risk 94',
    action: 'Mark for review',
    sources: ['Source A · Land Registry', 'Source B · Real Estate'] as const,
    rows: [
      { key: 'cadastral', values: ['32:01:2204:0034', '32:01:2204:0034'], highlight: false },
      { key: 'owner ІПН', values: ['3429105782', '3429105782'], highlight: false },
      { key: 'status', values: ['active', 'terminated · 12.03.2024'], highlight: true },
      { key: 'use type', values: ['agricultural', 'commercial'], highlight: true },
      { key: 'area, ha', values: ['2.40', '2.40'], highlight: false },
      { key: 'recorded', values: ['07.06.2021', '12.03.2024'], highlight: false },
    ],
  },
};

export const landingCta = {
  eyebrow: '§06 — Begin',
  subtitle: 'For municipal auditors, finance departments & oversight bodies',
  titleStart: 'See what your',
  titleEmphasis: 'registries',
  titleEnd: 'aren’t telling you.',
  description:
    'Revela is in pilot with municipalities across Ukraine. If you administer cadastral and real-estate data and want to recover hidden tax revenue, we’ll run a no-commitment audit on your data within a week.',
  primaryCta: 'Request a pilot audit',
  secondaryCta: 'Read the method',
  footerFacts: [
    { label: 'Product', value: 'Revela' },
    { label: 'For', value: 'Municipalities' },
    { label: 'Built at', value: 'INNOVATE Hackathon 2026' },
    { label: 'Contact', value: 'hello@revela.gov' },
  ],
};
