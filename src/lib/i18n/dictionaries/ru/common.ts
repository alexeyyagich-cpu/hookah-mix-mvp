export const common = {
  // Actions
  save: 'Сохранить изменения',
  saving: 'Сохранение...',
  cancel: 'Отмена',
  delete: 'Удалить',
  edit: 'Редактировать',
  add: 'Добавить',
  create: 'Создать',
  close: 'Закрыть',
  confirm: 'Подтвердить',
  search: 'Поиск',
  back: 'Назад',
  next: 'Далее',
  retry: 'Попробовать снова',
  optional: 'необязательно',
  copy: 'Копировать',
  download: 'Скачать',
  export: 'Экспорт',
  upgrade: 'Обновить',
  loading: 'Загрузка...',
  all: 'Все',
  none: 'Нет',
  yes: 'Да',
  no: 'Нет',
  or: 'или',
  empty: 'Пусто',
  more: 'ещё',

  // Status
  active: 'Активный',
  inactive: 'Неактивный',
  enabled: 'Включено',
  disabled: 'Отключено',
  connected: 'Подключено',
  disconnected: 'Отключено',
  soon: 'Скоро',

  // Time
  today: 'Сегодня',
  yesterday: 'Вчера',
  thisWeek: 'Эта неделя',
  thisMonth: 'Этот месяц',
  last7days: 'Последние 7 дней',
  last30days: 'Последние 30 дней',

  // Units
  grams: 'г',
  ml: 'мл',
  pieces: 'шт',
  seconds: 'с',

  // Feedback
  saved: 'Сохранено!',
  deleted: 'Удалено!',

  // Errors
  deleteWarning: 'Это действие нельзя отменить.',
  error: 'Ошибка',
  errorSaving: 'Ошибка сохранения',
  errorDeleting: 'Ошибка удаления',
  errorLoading: 'Ошибка загрузки',
  errorGeneric: 'Что-то пошло не так',
  invalidValue: 'Некорректное значение',

  // Roles
  roles: {
    owner: 'Владелец',
    staff: 'Кальянщик',
    guest: 'Гость',
  },

  // Modules
  modules: {
    hookah: 'Кальянная',
    bar: 'Бар',
    kitchen: 'Кухня',
  },

  // PWA
  installApp: 'Установить Hookah Torus',
  installAppDesc: 'Быстрый доступ с рабочего стола',
  install: 'Установить',

  // 404 / Not Found
  notFound: {
    title: 'Страница не найдена',
    description: 'Такой страницы не существует или она была удалена.',
    goHome: 'На главную',
    goDashboard: 'В личный кабинет',
  },

  // Access Denied
  accessDenied: {
    title: 'Нет доступа',
    description: 'У вас нет прав для просмотра этой страницы. Обратитесь к владельцу заведения.',
    goBack: 'Вернуться назад',
    goDashboard: 'На главную',
  },

  // Offline
  offline: {
    title: 'Нет подключения к интернету',
    description: 'Проверьте подключение и попробуйте позже.',
    indicator: 'Оффлайн',
    syncing: 'Синхронизация...',
    syncPending: (count: string) => `${count} изм. ожидают синхр.`,
    syncComplete: 'Всё синхронизировано',
    syncFailed: (count: string) => `${count} изм. не удалось синхронизировать`,
    cachedData: 'Показаны сохранённые данные',
    queuedOffline: 'Сохранено оффлайн',
  },

  // Error page
  errorPage: {
    description: 'Произошла непредвиденная ошибка. Попробуйте обновить страницу.',
    errorCode: 'Код ошибки:',
  },

  // Auth layout
  auth: {
    mixCalculator: 'Калькулятор миксов',
    footerText: 'Hookah Torus — сервис для кальянных заведений',
  },

  // Low stock notifications
  lowStock: {
    outOfStock: '{count} позиций закончились!',
    lowStock: '{count} позиций на исходе',
  },

  // Service worker
  sw: {
    updateAvailable: 'Доступно обновление',
    updateDescription: 'Нажмите чтобы обновить приложение',
    update: 'Обновить',
  },

  // Trial
  trialExpired: 'Пробный период закончился. Данные доступны только для чтения.',
  trialDaysLeft: (days: number) => days === 1 ? 'Остался 1 день пробного периода.' : `Осталось ${days} дн. пробного периода.`,
  upgradeNow: 'Выбрать тариф',

  // Pricing card
  pricing: {
    select: 'Выбрать',
    popular: 'Популярный',
    currentPlan: 'Ваш тариф',
  },

  // Tobacco card
  tobaccoCard: {
    strength: 'крепость',
    heatResistance: 'жаростойкость',
    selected: 'выбран',
  },

  // Legal
  legalTerms: 'Условия',
  legalPrivacy: 'Конфиденциальность',
  legalImpressum: 'Impressum',
  legalAllRights: 'Все права защищены.',

  changeTheme: 'Сменить тему',

  // Command palette
  commandPalette: {
    placeholder: 'Перейти к странице...',
    noResults: 'Ничего не найдено',
    hint: '⌘K для быстрого перехода',
  },

  // Cookie consent
  cookieText: 'Мы используем файлы cookie для обеспечения работы сайта и улучшения качества обслуживания.',
  privacyPolicy: 'Политика конфиденциальности',
  accept: 'Принять',
  decline: 'Отклонить',
}
