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

  error: 'Error',
  errorSaving: 'Error saving',
  errorLoading: 'Error loading',
  errorGeneric: 'Something went wrong',

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

  offline: {
    title: 'No internet connection',
    description: 'Check your connection and try again later.',
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

  // Cookie consent
  cookieText: 'We use cookies to ensure the site works properly and to improve our service.',
  privacyPolicy: 'Privacy Policy',
  accept: 'Accept',
  decline: 'Decline',
} as const
