import type { nav as NavType } from '../ru/nav'

export const nav: typeof NavType = {
  home: '← Home',
  defaultBusiness: 'My venue',
  defaultUser: 'User',

  hookahGroup: 'HOOKAH',
  barGroup: 'BAR',
  managementGroup: 'MANAGEMENT',
  otherGroup: 'OTHER',

  overview: 'Overview',
  inventory: 'Inventory',
  bowls: 'Bowls',
  sessions: 'Sessions',
  mixCalculator: 'Mix Calculator',
  warehouse: 'Warehouse',
  recipes: 'Recipes',
  menu: 'Menu',
  sales: 'Sales',
  floorPlan: 'Floor Plan',
  reservations: 'Reservations',
  kdsOrders: 'KDS Orders',
  statistics: 'Statistics',
  pnlReports: 'P&L Reports',
  reviews: 'Reviews',
  marketplace: 'Marketplace',
  team: 'Team',
  settings: 'Settings',

  upgradeToPro: 'Upgrade to Pro',
  upgradeDescription: 'Unlimited inventory and full statistics',
  logout: 'Log out',

  openNav: 'Open navigation menu',
  closeNav: 'Close navigation menu',
  logoutLabel: 'Log out of account',
  proOnlyLabel: (name: string) => `${name} — available in Pro plan`,
} as const
