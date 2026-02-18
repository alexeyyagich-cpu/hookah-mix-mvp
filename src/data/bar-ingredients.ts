import type { BarIngredientCategory, BarUnitType, BarPortionUnit } from '@/types/database'

// Category labels in Russian
export const BAR_CATEGORY_LABELS: Record<BarIngredientCategory, string> = {
  spirit: 'Крепкий алкоголь',
  liqueur: 'Ликёры',
  wine: 'Вино / Шампанское',
  beer: 'Пиво',
  mixer: 'Миксеры / Газировка',
  syrup: 'Сиропы',
  juice: 'Соки',
  bitter: 'Биттеры',
  garnish: 'Гарниры',
  ice: 'Лёд',
  other: 'Прочее',
}

export const BAR_CATEGORY_EMOJI: Record<BarIngredientCategory, string> = {
  spirit: '\u{1F943}',
  liqueur: '\u{1F378}',
  wine: '\u{1F377}',
  beer: '\u{1F37A}',
  mixer: '\u{1F964}',
  syrup: '\u{1F36F}',
  juice: '\u{1F9C3}',
  bitter: '\u{1F4A7}',
  garnish: '\u{1F34B}',
  ice: '\u{1F9CA}',
  other: '\u{1F4E6}',
}

export const BAR_UNIT_LABELS: Record<BarUnitType, string> = {
  ml: 'мл',
  g: 'г',
  pcs: 'шт',
}

export const BAR_PORTION_LABELS: Record<BarPortionUnit, string> = {
  ml: 'мл',
  g: 'г',
  pcs: 'шт',
  oz: 'унция',
  cl: 'сл',
  dash: 'дэш',
  barspoon: 'бар. ложка',
  drop: 'капля',
  slice: 'слайс',
  sprig: 'веточка',
  wedge: 'долька',
  twist: 'цедра',
}

// Conversion from portion units to base units (ml or g)
// pcs-based units (slice, sprig, wedge, twist) convert 1:1 to pcs
export const PORTION_CONVERSIONS: Record<string, { value: number; baseUnit: BarUnitType }> = {
  ml: { value: 1, baseUnit: 'ml' },
  g: { value: 1, baseUnit: 'g' },
  pcs: { value: 1, baseUnit: 'pcs' },
  oz: { value: 30, baseUnit: 'ml' },
  cl: { value: 10, baseUnit: 'ml' },
  dash: { value: 0.9, baseUnit: 'ml' },
  barspoon: { value: 5, baseUnit: 'ml' },
  drop: { value: 0.05, baseUnit: 'ml' },
  slice: { value: 1, baseUnit: 'pcs' },
  sprig: { value: 1, baseUnit: 'pcs' },
  wedge: { value: 1, baseUnit: 'pcs' },
  twist: { value: 1, baseUnit: 'pcs' },
}

export interface BarIngredientPreset {
  id: string
  name: string
  brand: string
  category: BarIngredientCategory
  defaultUnit: BarUnitType
  defaultPackageSize: number
}

export const BAR_INGREDIENT_PRESETS: BarIngredientPreset[] = [
  // === Spirits ===
  { id: 'sp-vodka', name: 'Водка', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-gin', name: 'Джин', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-rum-w', name: 'Ром белый', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-rum-d', name: 'Ром тёмный', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-tequila-b', name: 'Текила бланко', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-tequila-r', name: 'Текила репосадо', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-whiskey-b', name: 'Виски бурбон', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-whiskey-s', name: 'Виски скотч', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-brandy', name: 'Бренди / Коньяк', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-absinthe', name: 'Абсент', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 500 },
  { id: 'sp-mezcal', name: 'Мескаль', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },

  // === Liqueurs ===
  { id: 'lq-triple', name: 'Трипл сек / Куантро', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-kahlua', name: 'Кофейный ликёр', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-amaretto', name: 'Амаретто', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-campari', name: 'Кампари', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-aperol', name: 'Апероль', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-baileys', name: 'Сливочный ликёр', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-vermouth-d', name: 'Вермут сухой', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 750 },
  { id: 'lq-vermouth-s', name: 'Вермут сладкий', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 750 },
  { id: 'lq-elderflower', name: 'Ликёр бузина', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-maraschino', name: 'Мараскино', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },

  // === Wine ===
  { id: 'wn-prosecco', name: 'Просекко', brand: '', category: 'wine', defaultUnit: 'ml', defaultPackageSize: 750 },
  { id: 'wn-champagne', name: 'Шампанское', brand: '', category: 'wine', defaultUnit: 'ml', defaultPackageSize: 750 },

  // === Mixers ===
  { id: 'mx-tonic', name: 'Тоник', brand: '', category: 'mixer', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'mx-cola', name: 'Кола', brand: '', category: 'mixer', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'mx-soda', name: 'Содовая', brand: '', category: 'mixer', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'mx-ginger-ale', name: 'Имбирный эль', brand: '', category: 'mixer', defaultUnit: 'ml', defaultPackageSize: 330 },
  { id: 'mx-ginger-beer', name: 'Имбирное пиво', brand: '', category: 'mixer', defaultUnit: 'ml', defaultPackageSize: 330 },
  { id: 'mx-redbull', name: 'Энергетик', brand: '', category: 'mixer', defaultUnit: 'ml', defaultPackageSize: 250 },

  // === Syrups ===
  { id: 'sy-sugar', name: 'Сахарный сироп', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'sy-grenadine', name: 'Гренадин', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sy-honey', name: 'Медовый сироп', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 500 },
  { id: 'sy-vanilla', name: 'Ванильный сироп', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sy-caramel', name: 'Карамельный сироп', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 700 },

  // === Juices ===
  { id: 'jc-lime', name: 'Сок лайма', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'jc-lemon', name: 'Сок лимона', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'jc-orange', name: 'Апельсиновый сок', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'jc-cranberry', name: 'Клюквенный сок', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'jc-pineapple', name: 'Ананасовый сок', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'jc-tomato', name: 'Томатный сок', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },

  // === Bitters ===
  { id: 'bt-angostura', name: 'Ангостура', brand: 'Angostura', category: 'bitter', defaultUnit: 'ml', defaultPackageSize: 200 },
  { id: 'bt-orange', name: 'Апельсиновый биттер', brand: '', category: 'bitter', defaultUnit: 'ml', defaultPackageSize: 200 },
  { id: 'bt-peychauds', name: 'Пейшо биттер', brand: "Peychaud's", category: 'bitter', defaultUnit: 'ml', defaultPackageSize: 148 },

  // === Garnishes ===
  { id: 'gr-lime', name: 'Лайм', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 10 },
  { id: 'gr-lemon', name: 'Лимон', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 10 },
  { id: 'gr-orange', name: 'Апельсин', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 10 },
  { id: 'gr-mint', name: 'Мята (веточки)', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 50 },
  { id: 'gr-cherry', name: 'Коктейльная вишня', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 100 },
  { id: 'gr-olive', name: 'Оливки', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 50 },
  { id: 'gr-celery', name: 'Сельдерей', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 5 },

  // === Ice ===
  { id: 'ice-cube', name: 'Лёд кубиками', brand: '', category: 'ice', defaultUnit: 'g', defaultPackageSize: 5000 },
  { id: 'ice-crushed', name: 'Дроблёный лёд', brand: '', category: 'ice', defaultUnit: 'g', defaultPackageSize: 5000 },

  // === Other ===
  { id: 'ot-cream', name: 'Сливки', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 500 },
  { id: 'ot-milk', name: 'Молоко', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'ot-coconut-cream', name: 'Кокосовые сливки', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 400 },
  { id: 'ot-egg-white', name: 'Яичный белок', brand: '', category: 'other', defaultUnit: 'pcs', defaultPackageSize: 30 },
  { id: 'ot-sugar', name: 'Сахар', brand: '', category: 'other', defaultUnit: 'g', defaultPackageSize: 1000 },
  { id: 'ot-salt', name: 'Соль', brand: '', category: 'other', defaultUnit: 'g', defaultPackageSize: 500 },
  { id: 'ot-tabasco', name: 'Табаско', brand: 'Tabasco', category: 'other', defaultUnit: 'ml', defaultPackageSize: 60 },
  { id: 'ot-worcester', name: 'Вустерский соус', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 150 },
]
