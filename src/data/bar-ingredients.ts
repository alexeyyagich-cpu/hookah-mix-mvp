import type { BarIngredientCategory, BarUnitType } from '@/types/database'

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
  name_en: string
  brand: string
  category: BarIngredientCategory
  defaultUnit: BarUnitType
  defaultPackageSize: number
}

export const BAR_INGREDIENT_PRESETS: BarIngredientPreset[] = [
  // === Spirits ===
  { id: 'sp-vodka', name: 'Водка', name_en: 'Vodka', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-gin', name: 'Джин', name_en: 'Gin', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-rum-w', name: 'Ром белый', name_en: 'White Rum', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-rum-d', name: 'Ром тёмный', name_en: 'Dark Rum', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-tequila-b', name: 'Текила бланко', name_en: 'Tequila Blanco', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-tequila-r', name: 'Текила репосадо', name_en: 'Tequila Reposado', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-whiskey-b', name: 'Виски бурбон', name_en: 'Bourbon Whiskey', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-whiskey-s', name: 'Виски скотч', name_en: 'Scotch Whisky', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-brandy', name: 'Бренди / Коньяк', name_en: 'Brandy / Cognac', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sp-absinthe', name: 'Абсент', name_en: 'Absinthe', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 500 },
  { id: 'sp-mezcal', name: 'Мескаль', name_en: 'Mezcal', brand: '', category: 'spirit', defaultUnit: 'ml', defaultPackageSize: 700 },

  // === Liqueurs ===
  { id: 'lq-triple', name: 'Трипл сек / Куантро', name_en: 'Triple Sec / Cointreau', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-kahlua', name: 'Кофейный ликёр', name_en: 'Coffee Liqueur', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-amaretto', name: 'Амаретто', name_en: 'Amaretto', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-campari', name: 'Кампари', name_en: 'Campari', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-aperol', name: 'Апероль', name_en: 'Aperol', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-baileys', name: 'Сливочный ликёр', name_en: 'Cream Liqueur', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-vermouth-d', name: 'Вермут сухой', name_en: 'Dry Vermouth', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 750 },
  { id: 'lq-vermouth-s', name: 'Вермут сладкий', name_en: 'Sweet Vermouth', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 750 },
  { id: 'lq-elderflower', name: 'Ликёр бузина', name_en: 'Elderflower Liqueur', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-maraschino', name: 'Мараскино', name_en: 'Maraschino', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },

  // === Wine ===
  { id: 'wn-prosecco', name: 'Просекко', name_en: 'Prosecco', brand: '', category: 'wine', defaultUnit: 'ml', defaultPackageSize: 750 },
  { id: 'wn-champagne', name: 'Шампанское', name_en: 'Champagne', brand: '', category: 'wine', defaultUnit: 'ml', defaultPackageSize: 750 },

  // === Mixers ===
  { id: 'mx-tonic', name: 'Тоник', name_en: 'Tonic Water', brand: '', category: 'mixer', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'mx-cola', name: 'Кола', name_en: 'Cola', brand: '', category: 'mixer', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'mx-soda', name: 'Содовая', name_en: 'Soda Water', brand: '', category: 'mixer', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'mx-ginger-ale', name: 'Имбирный эль', name_en: 'Ginger Ale', brand: '', category: 'mixer', defaultUnit: 'ml', defaultPackageSize: 330 },
  { id: 'mx-ginger-beer', name: 'Имбирное пиво', name_en: 'Ginger Beer', brand: '', category: 'mixer', defaultUnit: 'ml', defaultPackageSize: 330 },
  { id: 'mx-redbull', name: 'Энергетик', name_en: 'Energy Drink', brand: '', category: 'mixer', defaultUnit: 'ml', defaultPackageSize: 250 },

  // === Syrups ===
  { id: 'sy-sugar', name: 'Сахарный сироп', name_en: 'Simple Syrup', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'sy-grenadine', name: 'Гренадин', name_en: 'Grenadine', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sy-honey', name: 'Медовый сироп', name_en: 'Honey Syrup', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 500 },
  { id: 'sy-vanilla', name: 'Ванильный сироп', name_en: 'Vanilla Syrup', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sy-caramel', name: 'Карамельный сироп', name_en: 'Caramel Syrup', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 700 },

  // === Juices ===
  { id: 'jc-lime', name: 'Сок лайма', name_en: 'Lime Juice', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'jc-lemon', name: 'Сок лимона', name_en: 'Lemon Juice', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'jc-orange', name: 'Апельсиновый сок', name_en: 'Orange Juice', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'jc-cranberry', name: 'Клюквенный сок', name_en: 'Cranberry Juice', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'jc-pineapple', name: 'Ананасовый сок', name_en: 'Pineapple Juice', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'jc-tomato', name: 'Томатный сок', name_en: 'Tomato Juice', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },

  // === Bitters ===
  { id: 'bt-angostura', name: 'Ангостура', name_en: 'Angostura Bitters', brand: 'Angostura', category: 'bitter', defaultUnit: 'ml', defaultPackageSize: 200 },
  { id: 'bt-orange', name: 'Апельсиновый биттер', name_en: 'Orange Bitters', brand: '', category: 'bitter', defaultUnit: 'ml', defaultPackageSize: 200 },
  { id: 'bt-peychauds', name: 'Пейшо биттер', name_en: "Peychaud's Bitters", brand: "Peychaud's", category: 'bitter', defaultUnit: 'ml', defaultPackageSize: 148 },

  // === Garnishes ===
  { id: 'gr-lime', name: 'Лайм', name_en: 'Lime', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 10 },
  { id: 'gr-lemon', name: 'Лимон', name_en: 'Lemon', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 10 },
  { id: 'gr-orange', name: 'Апельсин', name_en: 'Orange', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 10 },
  { id: 'gr-mint', name: 'Мята (веточки)', name_en: 'Mint (sprigs)', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 50 },
  { id: 'gr-cherry', name: 'Коктейльная вишня', name_en: 'Cocktail Cherry', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 100 },
  { id: 'gr-olive', name: 'Оливки', name_en: 'Olives', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 50 },
  { id: 'gr-celery', name: 'Сельдерей', name_en: 'Celery', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 5 },

  // === Ice ===
  { id: 'ice-cube', name: 'Лёд кубиками', name_en: 'Ice Cubes', brand: '', category: 'ice', defaultUnit: 'g', defaultPackageSize: 5000 },
  { id: 'ice-crushed', name: 'Дроблёный лёд', name_en: 'Crushed Ice', brand: '', category: 'ice', defaultUnit: 'g', defaultPackageSize: 5000 },

  // === Other ===
  { id: 'ot-cream', name: 'Сливки', name_en: 'Cream', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 500 },
  { id: 'ot-milk', name: 'Молоко', name_en: 'Milk', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'ot-coconut-cream', name: 'Кокосовые сливки', name_en: 'Coconut Cream', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 400 },
  { id: 'ot-egg-white', name: 'Яичный белок', name_en: 'Egg White', brand: '', category: 'other', defaultUnit: 'pcs', defaultPackageSize: 30 },
  { id: 'ot-sugar', name: 'Сахар', name_en: 'Sugar', brand: '', category: 'other', defaultUnit: 'g', defaultPackageSize: 1000 },
  { id: 'ot-salt', name: 'Соль', name_en: 'Salt', brand: '', category: 'other', defaultUnit: 'g', defaultPackageSize: 500 },
  { id: 'ot-tabasco', name: 'Табаско', name_en: 'Tabasco', brand: 'Tabasco', category: 'other', defaultUnit: 'ml', defaultPackageSize: 60 },
  { id: 'ot-worcester', name: 'Вустерский соус', name_en: 'Worcestershire Sauce', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 150 },

  // === Additional Liqueurs ===
  { id: 'lq-chartreuse-g', name: 'Шартрёз зелёный', name_en: 'Green Chartreuse', brand: 'Chartreuse', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-chartreuse-y', name: 'Шартрёз жёлтый', name_en: 'Yellow Chartreuse', brand: 'Chartreuse', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-fernet', name: 'Фернет Бранка', name_en: 'Fernet Branca', brand: 'Fernet-Branca', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-midori', name: 'Мидори (дыня)', name_en: 'Midori (Melon)', brand: 'Midori', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-blue-curacao', name: 'Блю Кюрасао', name_en: 'Blue Curacao', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-jagermeister', name: 'Егермейстер', name_en: 'Jägermeister', brand: 'Jägermeister', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-sambuca', name: 'Самбука', name_en: 'Sambuca', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-limoncello', name: 'Лимончелло', name_en: 'Limoncello', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-galliano', name: 'Гальяно', name_en: 'Galliano', brand: 'Galliano', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-frangelico', name: 'Франжелико', name_en: 'Frangelico', brand: 'Frangelico', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-passoa', name: 'Пассоа (маракуйя)', name_en: 'Passoa (Passion Fruit)', brand: 'Passoa', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-peach', name: 'Персиковый ликёр', name_en: 'Peach Liqueur', brand: '', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'lq-st-germain', name: 'Сен-Жермен (бузина)', name_en: 'St-Germain (Elderflower)', brand: 'St-Germain', category: 'liqueur', defaultUnit: 'ml', defaultPackageSize: 700 },

  // === Purées ===
  { id: 'pu-strawberry', name: 'Пюре клубника', name_en: 'Strawberry Purée', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'pu-mango', name: 'Пюре манго', name_en: 'Mango Purée', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'pu-passion', name: 'Пюре маракуйя', name_en: 'Passion Fruit Purée', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'pu-raspberry', name: 'Пюре малина', name_en: 'Raspberry Purée', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'pu-banana', name: 'Пюре банан', name_en: 'Banana Purée', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'jc-grapefruit', name: 'Грейпфрутовый сок', name_en: 'Grapefruit Juice', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'jc-apple', name: 'Яблочный сок', name_en: 'Apple Juice', brand: '', category: 'juice', defaultUnit: 'ml', defaultPackageSize: 1000 },

  // === Additional Syrups ===
  { id: 'sy-lavender', name: 'Лавандовый сироп', name_en: 'Lavender Syrup', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sy-orgeat', name: 'Оршад (миндальный)', name_en: 'Orgeat Syrup', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sy-cinnamon', name: 'Коричный сироп', name_en: 'Cinnamon Syrup', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sy-ginger', name: 'Имбирный сироп', name_en: 'Ginger Syrup', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sy-elderflower', name: 'Бузиновый сироп', name_en: 'Elderflower Syrup', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sy-passion', name: 'Сироп маракуйя', name_en: 'Passion Fruit Syrup', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sy-peach', name: 'Персиковый сироп', name_en: 'Peach Syrup', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 700 },
  { id: 'sy-raspberry', name: 'Малиновый сироп', name_en: 'Raspberry Syrup', brand: '', category: 'syrup', defaultUnit: 'ml', defaultPackageSize: 700 },

  // === Coffee & Tea ===
  { id: 'ot-espresso', name: 'Эспрессо', name_en: 'Espresso', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'ot-green-tea', name: 'Зелёный чай', name_en: 'Green Tea', brand: '', category: 'other', defaultUnit: 'g', defaultPackageSize: 200 },
  { id: 'ot-chai', name: 'Чай масала (концентрат)', name_en: 'Chai Concentrate', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'ot-matcha', name: 'Матча (порошок)', name_en: 'Matcha Powder', brand: '', category: 'other', defaultUnit: 'g', defaultPackageSize: 100 },

  // === Dairy & Alt-Milk ===
  { id: 'ot-oat-milk', name: 'Овсяное молоко', name_en: 'Oat Milk', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'ot-almond-milk', name: 'Миндальное молоко', name_en: 'Almond Milk', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'ot-coconut-milk', name: 'Кокосовое молоко', name_en: 'Coconut Milk', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 400 },
  { id: 'ot-whipped-cream', name: 'Взбитые сливки', name_en: 'Whipped Cream', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 500 },
  { id: 'ot-yogurt', name: 'Йогурт натуральный', name_en: 'Natural Yogurt', brand: '', category: 'other', defaultUnit: 'ml', defaultPackageSize: 500 },

  // === Spices & Fresh ===
  { id: 'gr-cucumber', name: 'Огурец', name_en: 'Cucumber', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 5 },
  { id: 'gr-ginger', name: 'Имбирь (свежий)', name_en: 'Fresh Ginger', brand: '', category: 'garnish', defaultUnit: 'g', defaultPackageSize: 200 },
  { id: 'gr-cinnamon', name: 'Палочка корицы', name_en: 'Cinnamon Stick', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 20 },
  { id: 'gr-chili', name: 'Перец чили', name_en: 'Chili Pepper', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 10 },
  { id: 'gr-rosemary', name: 'Розмарин', name_en: 'Rosemary', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 20 },
  { id: 'gr-basil', name: 'Базилик', name_en: 'Basil', brand: '', category: 'garnish', defaultUnit: 'pcs', defaultPackageSize: 30 },
  { id: 'ot-nutmeg', name: 'Мускатный орех', name_en: 'Nutmeg', brand: '', category: 'other', defaultUnit: 'g', defaultPackageSize: 50 },
  { id: 'ot-chocolate', name: 'Горячий шоколад', name_en: 'Hot Chocolate Mix', brand: '', category: 'other', defaultUnit: 'g', defaultPackageSize: 500 },
  { id: 'ot-protein', name: 'Протеин (порошок)', name_en: 'Protein Powder', brand: '', category: 'other', defaultUnit: 'g', defaultPackageSize: 1000 },

  // === Additional Mixers ===
  { id: 'mx-lemonade', name: 'Лимонад', name_en: 'Lemonade', brand: '', category: 'mixer', defaultUnit: 'ml', defaultPackageSize: 1000 },
  { id: 'mx-sprite', name: 'Спрайт / 7UP', name_en: 'Sprite / 7UP', brand: '', category: 'mixer', defaultUnit: 'ml', defaultPackageSize: 1000 },

  // === Wine & Beer ===
  { id: 'wn-red', name: 'Красное вино', name_en: 'Red Wine', brand: '', category: 'wine', defaultUnit: 'ml', defaultPackageSize: 750 },
  { id: 'wn-white', name: 'Белое вино', name_en: 'White Wine', brand: '', category: 'wine', defaultUnit: 'ml', defaultPackageSize: 750 },
  { id: 'wn-rose', name: 'Розовое вино', name_en: 'Rosé Wine', brand: '', category: 'wine', defaultUnit: 'ml', defaultPackageSize: 750 },
  { id: 'br-lager', name: 'Пиво лагер', name_en: 'Lager Beer', brand: '', category: 'beer', defaultUnit: 'ml', defaultPackageSize: 500 },
  { id: 'br-stout', name: 'Стаут / Гиннесс', name_en: 'Stout / Guinness', brand: '', category: 'beer', defaultUnit: 'ml', defaultPackageSize: 440 },
]
