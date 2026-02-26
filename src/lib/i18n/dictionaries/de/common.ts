import type { common as CommonType } from '../ru/common'

export const common: typeof CommonType = {
  save: 'Änderungen speichern',
  saving: 'Speichern...',
  cancel: 'Abbrechen',
  delete: 'Löschen',
  edit: 'Bearbeiten',
  add: 'Hinzufügen',
  create: 'Erstellen',
  close: 'Schließen',
  confirm: 'Bestätigen',
  search: 'Suchen',
  back: 'Zurück',
  next: 'Weiter',
  retry: 'Erneut versuchen',
  optional: 'optional',
  copy: 'Kopieren',
  download: 'Herunterladen',
  export: 'Exportieren',
  upgrade: 'Upgraden',
  loading: 'Laden...',
  all: 'Alle',
  none: 'Keine',
  yes: 'Ja',
  no: 'Nein',
  or: 'oder',
  empty: 'Leer',
  more: 'mehr',

  active: 'Aktiv',
  inactive: 'Inaktiv',
  enabled: 'Aktiviert',
  disabled: 'Deaktiviert',
  connected: 'Verbunden',
  disconnected: 'Getrennt',
  soon: 'Demnächst',

  today: 'Heute',
  yesterday: 'Gestern',
  thisWeek: 'Diese Woche',
  thisMonth: 'Dieser Monat',
  last7days: 'Letzte 7 Tage',
  last30days: 'Letzte 30 Tage',

  grams: 'g',
  ml: 'ml',
  pieces: 'Stk',
  seconds: 's',

  saved: 'Gespeichert!',
  deleted: 'Gelöscht!',

  deleteWarning: 'Diese Aktion kann nicht rückgängig gemacht werden.',
  error: 'Fehler',
  errorSaving: 'Fehler beim Speichern',
  errorDeleting: 'Fehler beim Löschen',
  errorLoading: 'Fehler beim Laden',
  errorGeneric: 'Etwas ist schiefgelaufen',

  roles: {
    owner: 'Inhaber',
    staff: 'Shisha-Meister',
    guest: 'Gast',
  },

  modules: {
    hookah: 'Shisha',
    bar: 'Bar',
    kitchen: 'Küche',
  },

  installApp: 'Hookah Torus installieren',
  installAppDesc: 'Schnellzugriff vom Startbildschirm',
  install: 'Installieren',

  notFound: {
    title: 'Seite nicht gefunden',
    description: 'Diese Seite existiert nicht oder wurde entfernt.',
    goHome: 'Zur Startseite',
    goDashboard: 'Zum Dashboard',
  },

  accessDenied: {
    title: 'Zugriff verweigert',
    description: 'Sie haben keine Berechtigung, diese Seite anzuzeigen. Wenden Sie sich an den Inhaber.',
    goBack: 'Zurück',
    goDashboard: 'Zum Dashboard',
  },

  offline: {
    title: 'Keine Internetverbindung',
    description: 'Prüfen Sie Ihre Verbindung und versuchen Sie es später erneut.',
    indicator: 'Offline',
    syncing: 'Synchronisierung...',
    syncPending: (count: string) => `${count} Änderungen ausstehend`,
    syncComplete: 'Alles synchronisiert',
    syncFailed: (count: string) => `${count} Änderungen fehlgeschlagen`,
    cachedData: 'Gespeicherte Daten werden angezeigt',
    queuedOffline: 'Offline gespeichert',
  },

  errorPage: {
    description: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie, die Seite zu aktualisieren.',
    errorCode: 'Fehlercode:',
  },

  auth: {
    mixCalculator: 'Mix-Rechner',
    footerText: 'Hookah Torus — Service für Shisha-Lounges',
  },

  lowStock: {
    outOfStock: '{count} Artikel nicht vorrätig!',
    lowStock: '{count} Artikel gehen zur Neige',
  },

  sw: {
    updateAvailable: 'Update verfügbar',
    updateDescription: 'Klicken Sie, um die App zu aktualisieren',
    update: 'Aktualisieren',
  },

  pricing: {
    select: 'Auswählen',
    popular: 'Beliebt',
    currentPlan: 'Aktueller Tarif',
  },

  tobaccoCard: {
    strength: 'Stärke',
    heatResistance: 'Hitzebeständigkeit',
    selected: 'ausgewählt',
  },

  // Legal
  legalTerms: 'AGB',
  legalPrivacy: 'Datenschutz',
  legalImpressum: 'Impressum',
  legalAllRights: 'Alle Rechte vorbehalten.',

  changeTheme: 'Design ändern',

  commandPalette: {
    placeholder: 'Zur Seite gehen...',
    noResults: 'Keine Ergebnisse gefunden',
    hint: '⌘K zum Schnellzugriff',
  },

  // Cookie consent
  cookieText: 'Wir verwenden Cookies, um den Betrieb der Website zu gewährleisten und unseren Service zu verbessern.',
  privacyPolicy: 'Datenschutzerklärung',
  accept: 'Akzeptieren',
  decline: 'Ablehnen',
} as const
