export const profilePageContent = {
  hero: {
    eyebrow: 'Operator account',
    title: 'Профіль оператора',
    description: 'Огляд оператора, ролі та робочого контексту громади.',
    reviewStamp: 'Оновлено 18.04.2026',
  },
  identity: {
    initials: 'ОК',
    name: 'Олексій Коваленко',
    role: 'Начальник відділу земельних ресурсів',
    organization: 'Острівська територіальна громада',
    accessLevel: 'Адміністратор простору',
    status: 'Операційний доступ активний',
    summary:
      'Відповідає за земельний реєстр, валідацію інцидентів та міжвідомче погодження по кадастрових кейсах.',
  },
  navigation: [
    { id: 'identity', label: 'Огляд', detail: 'Оператор та роль' },
    { id: 'personal', label: 'Персональні дані', detail: 'Контактний профіль' },
    { id: 'municipality', label: 'Громада', detail: 'Контекст простору' },
  ],
  identityFacts: [
    { label: 'Робочий контур', value: 'Земельні ресурси' },
    { label: 'Рівень доступу', value: 'Повний операційний доступ' },
    { label: 'Поточний простір', value: 'Lviv Oblast / Ostrivska TG' },
    { label: 'Час у системі', value: '2 роки 4 місяці' },
  ],
  personalFields: [
    { id: 'name', label: "Повне ім'я", value: 'Олексій Коваленко', type: 'text' },
    {
      id: 'role',
      label: 'Посада',
      value: 'Начальник відділу земельних ресурсів',
      type: 'text',
    },
    {
      id: 'email',
      label: 'Електронна пошта',
      value: 'o.kovalenko@ostrivska.gov.ua',
      type: 'email',
    },
    { id: 'phone', label: 'Телефон', value: '+380 67 123 45 67', type: 'tel' },
  ],
  municipality: {
    eyebrow: 'Municipality context',
    title: 'Операційний контекст громади',
    description:
      'Цей блок лишається статичним і показує, як профіль вбудовується в простір роботи громади без окремого дашбордного шуму.',
    records: [
      { label: 'Назва громади', value: 'Острівська територіальна громада' },
      { label: 'Область', value: 'Львівська' },
      { label: 'Район', value: 'Сокальський' },
      { label: 'КОАТУУ', value: '4624884200', mono: true },
      { label: 'Населення', value: '12 400 осіб' },
      { label: 'Активний простір', value: 'Земельний реєстр / 3 модулі' },
    ],
    operationalNotes: [
      { label: 'Підписка', value: 'Активна до 31.12.2026' },
      { label: 'Остання синхронізація', value: '17.04.2026 · 18:42' },
      { label: 'Кадастрове покриття', value: '96.4% валідованих ділянок' },
    ],
  },
} as const;

export type ProfilePageContent = typeof profilePageContent;
export type ProfileNavItem = (typeof profilePageContent.navigation)[number];
export type ProfileField = (typeof profilePageContent.personalFields)[number];
export type ProfileFieldId = ProfileField['id'];
