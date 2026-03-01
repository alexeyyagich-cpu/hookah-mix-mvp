import type { common as CommonType } from '../ru/common'

export const common: typeof CommonType = {
  save: 'Save changes',
  saving: 'Saving...',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  create: 'Create',
  close: 'Close',
  confirm: 'Confirm',
  search: 'Search',
  back: 'Back',
  next: 'Next',
  retry: 'Try again',
  optional: 'optional',
  copy: 'Copy',
  download: 'Download',
  export: 'Export',
  upgrade: 'Upgrade',
  loading: 'Loading...',
  all: 'All',
  none: 'None',
  yes: 'Yes',
  no: 'No',
  or: 'or',
  empty: 'Empty',
  more: 'more',

  active: 'Active',
  inactive: 'Inactive',
  enabled: 'Enabled',
  disabled: 'Disabled',
  connected: 'Connected',
  disconnected: 'Disconnected',
  soon: 'Coming soon',

  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This week',
  thisMonth: 'This month',
  last7days: 'Last 7 days',
  last30days: 'Last 30 days',

  grams: 'g',
  ml: 'ml',
  pieces: 'pcs',
  seconds: 's',

  saved: 'Saved!',
  deleted: 'Deleted!',

  deleteWarning: 'This action cannot be undone.',
  error: 'Error',
  errorSaving: 'Error saving',
  errorDeleting: 'Error deleting',
  errorLoading: 'Error loading',
  errorGeneric: 'Something went wrong',
  insufficientStock: 'Insufficient stock',
  venueNotFound: 'Venue not found',
  invalidValue: 'Invalid value',

  roles: {
    owner: 'Owner',
    staff: 'Hookah master',
    guest: 'Guest',
  },

  modules: {
    hookah: 'Hookah',
    bar: 'Bar',
    kitchen: 'Kitchen',
  },

  installApp: 'Install Hookah Torus',
  installAppDesc: 'Quick access from your home screen',
  install: 'Install',

  notFound: {
    title: 'Page not found',
    description: 'This page does not exist or has been removed.',
    goHome: 'Go to home',
    goDashboard: 'Go to dashboard',
  },

  accessDenied: {
    title: 'Access denied',
    description: 'You don\'t have permission to view this page. Contact the venue owner.',
    goBack: 'Go back',
    goDashboard: 'Go to dashboard',
  },

  offline: {
    title: 'No internet connection',
    description: 'Check your connection and try again later.',
    indicator: 'Offline',
    syncing: 'Syncing...',
    syncPending: (count: string) => `${count} changes pending`,
    syncComplete: 'All synced',
    syncFailed: (count: string) => `${count} changes failed to sync`,
    cachedData: 'Showing cached data',
    queuedOffline: 'Saved offline',
  },

  errorPage: {
    description: 'An unexpected error occurred. Please try refreshing the page.',
    errorCode: 'Error code:',
  },

  auth: {
    mixCalculator: 'Mix calculator',
    footerText: 'Hookah Torus — service for hookah lounges',
  },

  lowStock: {
    outOfStock: '{count} items out of stock!',
    lowStock: '{count} items running low',
  },

  sw: {
    updateAvailable: 'Update available',
    updateDescription: 'Click to update the app',
    update: 'Update',
  },

  trialExpired: 'Your trial has expired. Data is read-only.',
  trialDaysLeft: (days: number) => days === 1 ? '1 day left in your trial.' : `${days} days left in your trial.`,
  upgradeNow: 'Upgrade now',

  pricing: {
    select: 'Select',
    popular: 'Popular',
    currentPlan: 'Current plan',
  },

  tobaccoCard: {
    strength: 'strength',
    heatResistance: 'heat resistance',
    selected: 'selected',
  },

  // Legal
  legalTerms: 'Terms',
  legalPrivacy: 'Privacy',
  legalImpressum: 'Impressum',
  legalAllRights: 'All rights reserved.',

  changeTheme: 'Change theme',

  commandPalette: {
    placeholder: 'Go to page...',
    noResults: 'No results found',
    hint: '⌘K to quick navigate',
    navigate: 'navigate',
    select: 'select',
    close: 'close',
  },

  // Cookie consent
  cookieText: 'We use cookies to ensure the site works properly and to improve our service.',
  privacyPolicy: 'Privacy Policy',
  accept: 'Accept',
  decline: 'Decline',
} as const
