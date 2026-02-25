import type { CocktailMethod, CocktailCategory, BarPortionUnit } from '@/types/database'

export const COCKTAIL_METHOD_EMOJI: Record<CocktailMethod, string> = {
  build: '\u{1F37A}',
  stir: '\u{1F944}',
  shake: '\u{1F943}',
  blend: '\u{26A1}',
  layer: '\u{1F308}',
  muddle: '\u{1FAA8}',
}

export const COCKTAIL_CATEGORY_EMOJI: Record<CocktailCategory, string> = {
  classic: '\u{1F378}',
  tiki: '\u{1F334}',
  sour: '\u{1F34B}',
  highball: '\u{1F95B}',
  shot: '\u{1FA83}',
  hot: '\u{2615}',
  non_alcoholic: '\u{1F9C3}',
  smoothie: '\u{1F353}',
  signature: '\u{2B50}',
}

export interface RecipePresetIngredient {
  preset_id: string
  name: string
  quantity: number
  unit: BarPortionUnit
  is_optional?: boolean
}

export interface RecipePreset {
  id: string
  name: string
  name_en: string
  category: CocktailCategory
  method: CocktailMethod
  glass: string
  garnish: string
  difficulty: 1 | 2 | 3
  ingredients: RecipePresetIngredient[]
}

export const RECIPE_PRESETS: RecipePreset[] = [
  // ==================== CLASSICS ====================
  {
    id: 'rc-mojito', name: 'Мохито', name_en: 'Mojito', category: 'classic',
    method: 'muddle', glass: 'highball', garnish: 'Мята, лайм', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-rum-w', name: 'Белый ром', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 30, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 20, unit: 'ml' },
      { preset_id: 'mx-soda', name: 'Содовая', quantity: 60, unit: 'ml' },
      { preset_id: 'gr-mint', name: 'Мята', quantity: 8, unit: 'pcs' },
      { preset_id: 'gr-lime', name: 'Лайм (дольки)', quantity: 2, unit: 'wedge' },
    ],
  },
  {
    id: 'rc-margarita', name: 'Маргарита', name_en: 'Margarita', category: 'classic',
    method: 'shake', glass: 'coupe', garnish: 'Долька лайма, соль на ободке', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-tequila-b', name: 'Текила бланко', quantity: 50, unit: 'ml' },
      { preset_id: 'lq-triple', name: 'Трипл сек', quantity: 25, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 10, unit: 'ml', is_optional: true },
    ],
  },
  {
    id: 'rc-negroni', name: 'Негрони', name_en: 'Negroni', category: 'classic',
    method: 'stir', glass: 'rocks', garnish: 'Долька апельсина', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-gin', name: 'Джин', quantity: 30, unit: 'ml' },
      { preset_id: 'lq-campari', name: 'Кампари', quantity: 30, unit: 'ml' },
      { preset_id: 'lq-vermouth-s', name: 'Сладкий вермут', quantity: 30, unit: 'ml' },
    ],
  },
  {
    id: 'rc-old-fashioned', name: 'Олд Фэшн', name_en: 'Old Fashioned', category: 'classic',
    method: 'stir', glass: 'rocks', garnish: 'Цедра апельсина, вишня', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-whiskey-b', name: 'Виски бурбон', quantity: 60, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 10, unit: 'ml' },
      { preset_id: 'bt-angostura', name: 'Ангостура', quantity: 2, unit: 'dash' },
    ],
  },
  {
    id: 'rc-daiquiri', name: 'Дайкири', name_en: 'Daiquiri', category: 'classic',
    method: 'shake', glass: 'coupe', garnish: 'Долька лайма', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-rum-w', name: 'Белый ром', quantity: 60, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-moscow-mule', name: 'Московский мул', name_en: 'Moscow Mule', category: 'classic',
    method: 'build', glass: 'copper_mug', garnish: 'Долька лайма, мята', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 50, unit: 'ml' },
      { preset_id: 'mx-ginger-beer', name: 'Имбирное пиво', quantity: 120, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-espresso-martini', name: 'Эспрессо Мартини', name_en: 'Espresso Martini', category: 'classic',
    method: 'shake', glass: 'martini', garnish: 'Три зерна кофе', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 50, unit: 'ml' },
      { preset_id: 'lq-kahlua', name: 'Кофейный ликёр', quantity: 25, unit: 'ml' },
      { preset_id: 'ot-espresso', name: 'Эспрессо', quantity: 30, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 10, unit: 'ml' },
    ],
  },
  {
    id: 'rc-gin-tonic', name: 'Джин-Тоник', name_en: 'Gin & Tonic', category: 'classic',
    method: 'build', glass: 'highball', garnish: 'Долька лайма или огурец', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-gin', name: 'Джин', quantity: 50, unit: 'ml' },
      { preset_id: 'mx-tonic', name: 'Тоник', quantity: 150, unit: 'ml' },
    ],
  },
  {
    id: 'rc-aperol-spritz', name: 'Апероль Шприц', name_en: 'Aperol Spritz', category: 'classic',
    method: 'build', glass: 'wine', garnish: 'Долька апельсина', difficulty: 1,
    ingredients: [
      { preset_id: 'lq-aperol', name: 'Апероль', quantity: 60, unit: 'ml' },
      { preset_id: 'wn-prosecco', name: 'Просекко', quantity: 90, unit: 'ml' },
      { preset_id: 'mx-soda', name: 'Содовая', quantity: 30, unit: 'ml' },
    ],
  },
  {
    id: 'rc-cosmopolitan', name: 'Космополитен', name_en: 'Cosmopolitan', category: 'classic',
    method: 'shake', glass: 'martini', garnish: 'Цедра лайма', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 40, unit: 'ml' },
      { preset_id: 'lq-triple', name: 'Трипл сек', quantity: 15, unit: 'ml' },
      { preset_id: 'jc-cranberry', name: 'Клюквенный сок', quantity: 30, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-manhattan', name: 'Манхэттен', name_en: 'Manhattan', category: 'classic',
    method: 'stir', glass: 'coupe', garnish: 'Коктейльная вишня', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-whiskey-b', name: 'Виски бурбон', quantity: 60, unit: 'ml' },
      { preset_id: 'lq-vermouth-s', name: 'Сладкий вермут', quantity: 30, unit: 'ml' },
      { preset_id: 'bt-angostura', name: 'Ангостура', quantity: 2, unit: 'dash' },
    ],
  },
  {
    id: 'rc-martini-dry', name: 'Сухой Мартини', name_en: 'Dry Martini', category: 'classic',
    method: 'stir', glass: 'martini', garnish: 'Оливка или цедра лимона', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-gin', name: 'Джин', quantity: 60, unit: 'ml' },
      { preset_id: 'lq-vermouth-d', name: 'Сухой вермут', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-cuba-libre', name: 'Куба Либре', name_en: 'Cuba Libre', category: 'classic',
    method: 'build', glass: 'highball', garnish: 'Долька лайма', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-rum-d', name: 'Тёмный ром', quantity: 50, unit: 'ml' },
      { preset_id: 'mx-cola', name: 'Кола', quantity: 120, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 10, unit: 'ml' },
    ],
  },
  {
    id: 'rc-white-russian', name: 'Белый Русский', name_en: 'White Russian', category: 'classic',
    method: 'build', glass: 'rocks', garnish: '', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 50, unit: 'ml' },
      { preset_id: 'lq-kahlua', name: 'Кофейный ликёр', quantity: 25, unit: 'ml' },
      { preset_id: 'ot-cream', name: 'Сливки', quantity: 25, unit: 'ml' },
    ],
  },
  {
    id: 'rc-sazerac', name: 'Сазерак', name_en: 'Sazerac', category: 'classic',
    method: 'stir', glass: 'rocks', garnish: 'Цедра лимона', difficulty: 3,
    ingredients: [
      { preset_id: 'sp-whiskey-b', name: 'Виски бурбон', quantity: 60, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 10, unit: 'ml' },
      { preset_id: 'bt-peychauds', name: 'Пейшо биттер', quantity: 3, unit: 'dash' },
      { preset_id: 'sp-absinthe', name: 'Абсент (ринс)', quantity: 5, unit: 'ml' },
    ],
  },

  // ==================== SOURS & FIZZ ====================
  {
    id: 'rc-whiskey-sour', name: 'Виски Сауэр', name_en: 'Whiskey Sour', category: 'sour',
    method: 'shake', glass: 'rocks', garnish: 'Вишня, долька апельсина', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-whiskey-b', name: 'Виски бурбон', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 15, unit: 'ml' },
      { preset_id: 'ot-egg-white', name: 'Яичный белок', quantity: 1, unit: 'pcs', is_optional: true },
    ],
  },
  {
    id: 'rc-amaretto-sour', name: 'Амаретто Сауэр', name_en: 'Amaretto Sour', category: 'sour',
    method: 'shake', glass: 'rocks', garnish: 'Вишня, долька апельсина', difficulty: 1,
    ingredients: [
      { preset_id: 'lq-amaretto', name: 'Амаретто', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 10, unit: 'ml' },
      { preset_id: 'ot-egg-white', name: 'Яичный белок', quantity: 1, unit: 'pcs', is_optional: true },
    ],
  },
  {
    id: 'rc-french-75', name: 'Французский 75', name_en: 'French 75', category: 'sour',
    method: 'shake', glass: 'flute', garnish: 'Цедра лимона', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-gin', name: 'Джин', quantity: 30, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 20, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 15, unit: 'ml' },
      { preset_id: 'wn-champagne', name: 'Шампанское', quantity: 60, unit: 'ml' },
    ],
  },
  {
    id: 'rc-gimlet', name: 'Гимлет', name_en: 'Gimlet', category: 'sour',
    method: 'shake', glass: 'coupe', garnish: 'Долька лайма', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-gin', name: 'Джин', quantity: 60, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 20, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-penicillin', name: 'Пенициллин', name_en: 'Penicillin', category: 'sour',
    method: 'shake', glass: 'rocks', garnish: 'Засахаренный имбирь', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-whiskey-s', name: 'Виски скотч', quantity: 60, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-honey', name: 'Медовый сироп', quantity: 20, unit: 'ml' },
      { preset_id: 'sy-ginger', name: 'Имбирный сироп', quantity: 10, unit: 'ml' },
    ],
  },
  {
    id: 'rc-last-word', name: 'Последнее слово', name_en: 'Last Word', category: 'sour',
    method: 'shake', glass: 'coupe', garnish: 'Коктейльная вишня', difficulty: 3,
    ingredients: [
      { preset_id: 'sp-gin', name: 'Джин', quantity: 22, unit: 'ml' },
      { preset_id: 'lq-chartreuse-g', name: 'Шартрёз зелёный', quantity: 22, unit: 'ml' },
      { preset_id: 'lq-maraschino', name: 'Мараскино', quantity: 22, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 22, unit: 'ml' },
    ],
  },
  {
    id: 'rc-sidecar', name: 'Сайдкар', name_en: 'Sidecar', category: 'sour',
    method: 'shake', glass: 'coupe', garnish: 'Сахарный ободок, цедра апельсина', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-brandy', name: 'Бренди / Коньяк', quantity: 50, unit: 'ml' },
      { preset_id: 'lq-triple', name: 'Трипл сек', quantity: 25, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 20, unit: 'ml' },
    ],
  },
  {
    id: 'rc-bees-knees', name: "Пчёлкины коленки", name_en: "Bee's Knees", category: 'sour',
    method: 'shake', glass: 'coupe', garnish: 'Цедра лимона', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-gin', name: 'Джин', quantity: 60, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 20, unit: 'ml' },
      { preset_id: 'sy-honey', name: 'Медовый сироп', quantity: 20, unit: 'ml' },
    ],
  },
  {
    id: 'rc-tom-collins', name: 'Том Коллинз', name_en: 'Tom Collins', category: 'sour',
    method: 'shake', glass: 'collins', garnish: 'Долька лимона, вишня', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-gin', name: 'Джин', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 15, unit: 'ml' },
      { preset_id: 'mx-soda', name: 'Содовая', quantity: 60, unit: 'ml' },
    ],
  },

  // ==================== HIGHBALLS ====================
  {
    id: 'rc-screwdriver', name: 'Отвёртка', name_en: 'Screwdriver', category: 'highball',
    method: 'build', glass: 'highball', garnish: 'Долька апельсина', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-orange', name: 'Апельсиновый сок', quantity: 120, unit: 'ml' },
    ],
  },
  {
    id: 'rc-sea-breeze', name: 'Морской бриз', name_en: 'Sea Breeze', category: 'highball',
    method: 'build', glass: 'highball', garnish: 'Долька лайма', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 40, unit: 'ml' },
      { preset_id: 'jc-cranberry', name: 'Клюквенный сок', quantity: 90, unit: 'ml' },
      { preset_id: 'jc-grapefruit', name: 'Грейпфрутовый сок', quantity: 30, unit: 'ml' },
    ],
  },
  {
    id: 'rc-tequila-sunrise', name: 'Текила Санрайз', name_en: 'Tequila Sunrise', category: 'highball',
    method: 'build', glass: 'highball', garnish: 'Долька апельсина, вишня', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-tequila-b', name: 'Текила бланко', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-orange', name: 'Апельсиновый сок', quantity: 120, unit: 'ml' },
      { preset_id: 'sy-grenadine', name: 'Гренадин', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-paloma', name: 'Палома', name_en: 'Paloma', category: 'highball',
    method: 'build', glass: 'highball', garnish: 'Долька грейпфрута, соль', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-tequila-b', name: 'Текила бланко', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-grapefruit', name: 'Грейпфрутовый сок', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 15, unit: 'ml' },
      { preset_id: 'mx-soda', name: 'Содовая', quantity: 60, unit: 'ml' },
    ],
  },
  {
    id: 'rc-bloody-mary', name: 'Кровавая Мэри', name_en: 'Bloody Mary', category: 'highball',
    method: 'build', glass: 'highball', garnish: 'Сельдерей, лимон', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-tomato', name: 'Томатный сок', quantity: 120, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 15, unit: 'ml' },
      { preset_id: 'ot-tabasco', name: 'Табаско', quantity: 3, unit: 'dash' },
      { preset_id: 'ot-worcester', name: 'Вустерский соус', quantity: 3, unit: 'dash' },
    ],
  },
  {
    id: 'rc-long-island', name: 'Лонг Айленд', name_en: 'Long Island Iced Tea', category: 'highball',
    method: 'shake', glass: 'highball', garnish: 'Долька лимона', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 15, unit: 'ml' },
      { preset_id: 'sp-gin', name: 'Джин', quantity: 15, unit: 'ml' },
      { preset_id: 'sp-rum-w', name: 'Белый ром', quantity: 15, unit: 'ml' },
      { preset_id: 'sp-tequila-b', name: 'Текила', quantity: 15, unit: 'ml' },
      { preset_id: 'lq-triple', name: 'Трипл сек', quantity: 15, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 10, unit: 'ml' },
      { preset_id: 'mx-cola', name: 'Кола', quantity: 30, unit: 'ml' },
    ],
  },

  // ==================== TIKI ====================
  {
    id: 'rc-pina-colada', name: 'Пина Колада', name_en: 'Pina Colada', category: 'tiki',
    method: 'blend', glass: 'hurricane', garnish: 'Ананас, вишня', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-rum-w', name: 'Белый ром', quantity: 50, unit: 'ml' },
      { preset_id: 'ot-coconut-cream', name: 'Кокосовые сливки', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-pineapple', name: 'Ананасовый сок', quantity: 100, unit: 'ml' },
    ],
  },
  {
    id: 'rc-mai-tai', name: 'Май Тай', name_en: 'Mai Tai', category: 'tiki',
    method: 'shake', glass: 'rocks', garnish: 'Мята, лайм', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-rum-w', name: 'Белый ром', quantity: 30, unit: 'ml' },
      { preset_id: 'sp-rum-d', name: 'Тёмный ром', quantity: 30, unit: 'ml' },
      { preset_id: 'lq-triple', name: 'Трипл сек', quantity: 15, unit: 'ml' },
      { preset_id: 'sy-orgeat', name: 'Оршад', quantity: 15, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 25, unit: 'ml' },
    ],
  },
  {
    id: 'rc-zombie', name: 'Зомби', name_en: 'Zombie', category: 'tiki',
    method: 'shake', glass: 'tiki', garnish: 'Мята, вишня, ананас', difficulty: 3,
    ingredients: [
      { preset_id: 'sp-rum-w', name: 'Белый ром', quantity: 30, unit: 'ml' },
      { preset_id: 'sp-rum-d', name: 'Тёмный ром', quantity: 30, unit: 'ml' },
      { preset_id: 'lq-triple', name: 'Трипл сек', quantity: 15, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 20, unit: 'ml' },
      { preset_id: 'jc-pineapple', name: 'Ананасовый сок', quantity: 30, unit: 'ml' },
      { preset_id: 'sy-grenadine', name: 'Гренадин', quantity: 10, unit: 'ml' },
      { preset_id: 'sp-absinthe', name: 'Абсент', quantity: 5, unit: 'ml' },
    ],
  },
  {
    id: 'rc-dark-stormy', name: 'Дарк энд Сторми', name_en: 'Dark & Stormy', category: 'tiki',
    method: 'build', glass: 'highball', garnish: 'Долька лайма', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-rum-d', name: 'Тёмный ром', quantity: 60, unit: 'ml' },
      { preset_id: 'mx-ginger-beer', name: 'Имбирное пиво', quantity: 120, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 10, unit: 'ml' },
    ],
  },
  {
    id: 'rc-blue-lagoon', name: 'Голубая лагуна', name_en: 'Blue Lagoon', category: 'tiki',
    method: 'build', glass: 'highball', garnish: 'Долька апельсина, вишня', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 40, unit: 'ml' },
      { preset_id: 'lq-blue-curacao', name: 'Блю Кюрасао', quantity: 20, unit: 'ml' },
      { preset_id: 'mx-lemonade', name: 'Лимонад', quantity: 120, unit: 'ml' },
    ],
  },
  {
    id: 'rc-jungle-bird', name: 'Джангл Бёрд', name_en: 'Jungle Bird', category: 'tiki',
    method: 'shake', glass: 'rocks', garnish: 'Ананас', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-rum-d', name: 'Тёмный ром', quantity: 45, unit: 'ml' },
      { preset_id: 'lq-campari', name: 'Кампари', quantity: 22, unit: 'ml' },
      { preset_id: 'jc-pineapple', name: 'Ананасовый сок', quantity: 45, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 15, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 10, unit: 'ml' },
    ],
  },

  // ==================== SHOTS ====================
  {
    id: 'rc-b52', name: 'Б-52', name_en: 'B-52', category: 'shot',
    method: 'layer', glass: 'shot', garnish: '', difficulty: 2,
    ingredients: [
      { preset_id: 'lq-kahlua', name: 'Кофейный ликёр', quantity: 20, unit: 'ml' },
      { preset_id: 'lq-baileys', name: 'Сливочный ликёр', quantity: 20, unit: 'ml' },
      { preset_id: 'lq-triple', name: 'Трипл сек', quantity: 20, unit: 'ml' },
    ],
  },
  {
    id: 'rc-kamikaze', name: 'Камикадзе', name_en: 'Kamikaze', category: 'shot',
    method: 'shake', glass: 'shot', garnish: '', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 20, unit: 'ml' },
      { preset_id: 'lq-triple', name: 'Трипл сек', quantity: 20, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 20, unit: 'ml' },
    ],
  },
  {
    id: 'rc-lemon-drop', name: 'Лемон Дроп', name_en: 'Lemon Drop Shot', category: 'shot',
    method: 'shake', glass: 'shot', garnish: 'Сахарный ободок', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 30, unit: 'ml' },
      { preset_id: 'lq-triple', name: 'Трипл сек', quantity: 15, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-jager-bomb', name: 'Егер-бомб', name_en: 'Jäger Bomb', category: 'shot',
    method: 'build', glass: 'shot', garnish: '', difficulty: 1,
    ingredients: [
      { preset_id: 'lq-jagermeister', name: 'Егермейстер', quantity: 40, unit: 'ml' },
      { preset_id: 'mx-redbull', name: 'Энергетик', quantity: 120, unit: 'ml' },
    ],
  },
  {
    id: 'rc-baby-guinness', name: 'Бейби Гиннесс', name_en: 'Baby Guinness', category: 'shot',
    method: 'layer', glass: 'shot', garnish: '', difficulty: 2,
    ingredients: [
      { preset_id: 'lq-kahlua', name: 'Кофейный ликёр', quantity: 30, unit: 'ml' },
      { preset_id: 'lq-baileys', name: 'Сливочный ликёр', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-sambuca-shot', name: 'Самбука (шот)', name_en: 'Sambuca Shot', category: 'shot',
    method: 'build', glass: 'shot', garnish: 'Три зерна кофе', difficulty: 1,
    ingredients: [
      { preset_id: 'lq-sambuca', name: 'Самбука', quantity: 40, unit: 'ml' },
    ],
  },

  // ==================== SIGNATURE / MODERN ====================
  {
    id: 'rc-pornstar-martini', name: 'Порнстар Мартини', name_en: 'Pornstar Martini', category: 'signature',
    method: 'shake', glass: 'martini', garnish: 'Половинка маракуйи, шот просекко', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 50, unit: 'ml' },
      { preset_id: 'lq-passoa', name: 'Пассоа (маракуйя)', quantity: 25, unit: 'ml' },
      { preset_id: 'pu-passion', name: 'Пюре маракуйя', quantity: 25, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 15, unit: 'ml' },
      { preset_id: 'sy-vanilla', name: 'Ванильный сироп', quantity: 10, unit: 'ml' },
    ],
  },
  {
    id: 'rc-paper-plane', name: 'Бумажный самолётик', name_en: 'Paper Plane', category: 'signature',
    method: 'shake', glass: 'coupe', garnish: '', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-whiskey-b', name: 'Виски бурбон', quantity: 22, unit: 'ml' },
      { preset_id: 'lq-aperol', name: 'Апероль', quantity: 22, unit: 'ml' },
      { preset_id: 'lq-amaretto', name: 'Амаретто', quantity: 22, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 22, unit: 'ml' },
    ],
  },
  {
    id: 'rc-boulevardier', name: 'Бульвардье', name_en: 'Boulevardier', category: 'signature',
    method: 'stir', glass: 'rocks', garnish: 'Цедра апельсина', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-whiskey-b', name: 'Виски бурбон', quantity: 40, unit: 'ml' },
      { preset_id: 'lq-campari', name: 'Кампари', quantity: 25, unit: 'ml' },
      { preset_id: 'lq-vermouth-s', name: 'Сладкий вермут', quantity: 25, unit: 'ml' },
    ],
  },
  {
    id: 'rc-peach-bellini', name: 'Беллини', name_en: 'Peach Bellini', category: 'signature',
    method: 'build', glass: 'flute', garnish: '', difficulty: 1,
    ingredients: [
      { preset_id: 'pu-mango', name: 'Пюре персик / манго', quantity: 50, unit: 'ml' },
      { preset_id: 'wn-prosecco', name: 'Просекко', quantity: 100, unit: 'ml' },
    ],
  },
  {
    id: 'rc-spicy-margarita', name: 'Острая Маргарита', name_en: 'Spicy Margarita', category: 'signature',
    method: 'shake', glass: 'rocks', garnish: 'Перец чили, лайм, соль', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-tequila-b', name: 'Текила бланко', quantity: 50, unit: 'ml' },
      { preset_id: 'lq-triple', name: 'Трипл сек', quantity: 20, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 10, unit: 'ml' },
      { preset_id: 'gr-chili', name: 'Перец чили (мадл)', quantity: 2, unit: 'slice' },
    ],
  },
  {
    id: 'rc-lavender-collins', name: 'Лавандовый Коллинз', name_en: 'Lavender Collins', category: 'signature',
    method: 'shake', glass: 'collins', garnish: 'Веточка лаванды', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-gin', name: 'Джин', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-lavender', name: 'Лавандовый сироп', quantity: 20, unit: 'ml' },
      { preset_id: 'mx-soda', name: 'Содовая', quantity: 60, unit: 'ml' },
    ],
  },

  // ==================== HOT DRINKS ====================
  {
    id: 'rc-irish-coffee', name: 'Ирландский кофе', name_en: 'Irish Coffee', category: 'hot',
    method: 'build', glass: 'other', garnish: 'Взбитые сливки', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-whiskey-s', name: 'Ирландский виски', quantity: 40, unit: 'ml' },
      { preset_id: 'ot-espresso', name: 'Горячий кофе', quantity: 120, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 15, unit: 'ml' },
      { preset_id: 'ot-whipped-cream', name: 'Взбитые сливки', quantity: 30, unit: 'ml' },
    ],
  },
  {
    id: 'rc-hot-toddy', name: 'Хот Тодди', name_en: 'Hot Toddy', category: 'hot',
    method: 'build', glass: 'other', garnish: 'Палочка корицы, лимон', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-whiskey-s', name: 'Виски', quantity: 50, unit: 'ml' },
      { preset_id: 'sy-honey', name: 'Медовый сироп', quantity: 20, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 15, unit: 'ml' },
      { preset_id: 'gr-cinnamon', name: 'Палочка корицы', quantity: 1, unit: 'pcs' },
    ],
  },
  {
    id: 'rc-mulled-wine', name: 'Глинтвейн', name_en: 'Mulled Wine', category: 'hot',
    method: 'build', glass: 'other', garnish: 'Палочка корицы, апельсин, звёздчатый анис', difficulty: 1,
    ingredients: [
      { preset_id: 'wn-red', name: 'Красное вино', quantity: 200, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 20, unit: 'ml' },
      { preset_id: 'gr-cinnamon', name: 'Палочка корицы', quantity: 1, unit: 'pcs' },
      { preset_id: 'gr-orange', name: 'Апельсин (дольки)', quantity: 2, unit: 'slice' },
    ],
  },
  {
    id: 'rc-hot-chocolate-baileys', name: 'Горячий шоколад с Бейлиз', name_en: 'Baileys Hot Chocolate', category: 'hot',
    method: 'build', glass: 'other', garnish: 'Взбитые сливки, какао', difficulty: 1,
    ingredients: [
      { preset_id: 'lq-baileys', name: 'Сливочный ликёр', quantity: 40, unit: 'ml' },
      { preset_id: 'ot-chocolate', name: 'Горячий шоколад', quantity: 150, unit: 'ml' },
      { preset_id: 'ot-whipped-cream', name: 'Взбитые сливки', quantity: 30, unit: 'ml' },
    ],
  },
  {
    id: 'rc-chai-latte-spiked', name: 'Масала чай с ромом', name_en: 'Spiked Chai Latte', category: 'hot',
    method: 'build', glass: 'other', garnish: 'Палочка корицы', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-rum-d', name: 'Тёмный ром', quantity: 40, unit: 'ml' },
      { preset_id: 'ot-chai', name: 'Чай масала', quantity: 150, unit: 'ml' },
      { preset_id: 'ot-milk', name: 'Молоко', quantity: 50, unit: 'ml' },
      { preset_id: 'sy-honey', name: 'Медовый сироп', quantity: 15, unit: 'ml' },
    ],
  },

  // ==================== NON-ALCOHOLIC ====================
  {
    id: 'rc-virgin-mojito', name: 'Безалко Мохито', name_en: 'Virgin Mojito', category: 'non_alcoholic',
    method: 'muddle', glass: 'highball', garnish: 'Мята, лайм', difficulty: 1,
    ingredients: [
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 30, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 20, unit: 'ml' },
      { preset_id: 'mx-soda', name: 'Содовая', quantity: 120, unit: 'ml' },
      { preset_id: 'gr-mint', name: 'Мята', quantity: 8, unit: 'pcs' },
    ],
  },
  {
    id: 'rc-shirley-temple', name: 'Ширли Темпл', name_en: 'Shirley Temple', category: 'non_alcoholic',
    method: 'build', glass: 'highball', garnish: 'Вишня, долька апельсина', difficulty: 1,
    ingredients: [
      { preset_id: 'mx-ginger-ale', name: 'Имбирный эль', quantity: 150, unit: 'ml' },
      { preset_id: 'sy-grenadine', name: 'Гренадин', quantity: 20, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 10, unit: 'ml' },
    ],
  },
  {
    id: 'rc-arnold-palmer', name: 'Арнольд Палмер', name_en: 'Arnold Palmer', category: 'non_alcoholic',
    method: 'build', glass: 'highball', garnish: 'Долька лимона', difficulty: 1,
    ingredients: [
      { preset_id: 'ot-green-tea', name: 'Холодный чай', quantity: 120, unit: 'ml' },
      { preset_id: 'mx-lemonade', name: 'Лимонад', quantity: 120, unit: 'ml' },
    ],
  },
  {
    id: 'rc-fresh-lemonade', name: 'Свежий лимонад', name_en: 'Fresh Lemonade', category: 'non_alcoholic',
    method: 'shake', glass: 'highball', garnish: 'Долька лимона, мята', difficulty: 1,
    ingredients: [
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 50, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 30, unit: 'ml' },
      { preset_id: 'mx-soda', name: 'Содовая', quantity: 120, unit: 'ml' },
    ],
  },
  {
    id: 'rc-iced-matcha', name: 'Айс Матча Латте', name_en: 'Iced Matcha Latte', category: 'non_alcoholic',
    method: 'shake', glass: 'highball', garnish: '', difficulty: 1,
    ingredients: [
      { preset_id: 'ot-matcha', name: 'Матча', quantity: 3, unit: 'g' },
      { preset_id: 'ot-oat-milk', name: 'Овсяное молоко', quantity: 200, unit: 'ml' },
      { preset_id: 'sy-vanilla', name: 'Ванильный сироп', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-passion-lemonade', name: 'Маракуйя лимонад', name_en: 'Passion Fruit Lemonade', category: 'non_alcoholic',
    method: 'shake', glass: 'highball', garnish: 'Долька лайма', difficulty: 1,
    ingredients: [
      { preset_id: 'pu-passion', name: 'Пюре маракуйя', quantity: 40, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 20, unit: 'ml' },
      { preset_id: 'mx-soda', name: 'Содовая', quantity: 120, unit: 'ml' },
    ],
  },
  {
    id: 'rc-berry-punch', name: 'Ягодный пунш', name_en: 'Berry Punch', category: 'non_alcoholic',
    method: 'shake', glass: 'highball', garnish: 'Свежие ягоды', difficulty: 1,
    ingredients: [
      { preset_id: 'pu-raspberry', name: 'Пюре малина', quantity: 30, unit: 'ml' },
      { preset_id: 'pu-strawberry', name: 'Пюре клубника', quantity: 30, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 20, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 15, unit: 'ml' },
      { preset_id: 'mx-soda', name: 'Содовая', quantity: 100, unit: 'ml' },
    ],
  },
  {
    id: 'rc-ginger-mocktail', name: 'Имбирный мокктейль', name_en: 'Ginger Spice Mocktail', category: 'non_alcoholic',
    method: 'build', glass: 'highball', garnish: 'Розмарин, лайм', difficulty: 1,
    ingredients: [
      { preset_id: 'sy-ginger', name: 'Имбирный сироп', quantity: 20, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 20, unit: 'ml' },
      { preset_id: 'mx-ginger-beer', name: 'Имбирное пиво (безалк.)', quantity: 150, unit: 'ml' },
    ],
  },

  // ==================== SMOOTHIES ====================
  {
    id: 'rc-tropical-smoothie', name: 'Тропический смузи', name_en: 'Tropical Smoothie', category: 'smoothie',
    method: 'blend', glass: 'highball', garnish: 'Кусочек ананаса', difficulty: 1,
    ingredients: [
      { preset_id: 'pu-mango', name: 'Пюре манго', quantity: 80, unit: 'ml' },
      { preset_id: 'pu-banana', name: 'Пюре банан', quantity: 60, unit: 'ml' },
      { preset_id: 'jc-pineapple', name: 'Ананасовый сок', quantity: 80, unit: 'ml' },
      { preset_id: 'ot-yogurt', name: 'Йогурт', quantity: 50, unit: 'ml' },
    ],
  },
  {
    id: 'rc-berry-blast', name: 'Ягодный взрыв', name_en: 'Berry Blast Smoothie', category: 'smoothie',
    method: 'blend', glass: 'highball', garnish: 'Свежие ягоды', difficulty: 1,
    ingredients: [
      { preset_id: 'pu-strawberry', name: 'Пюре клубника', quantity: 60, unit: 'ml' },
      { preset_id: 'pu-raspberry', name: 'Пюре малина', quantity: 60, unit: 'ml' },
      { preset_id: 'pu-banana', name: 'Пюре банан', quantity: 40, unit: 'ml' },
      { preset_id: 'ot-yogurt', name: 'Йогурт', quantity: 80, unit: 'ml' },
      { preset_id: 'sy-honey', name: 'Мёд', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-green-detox', name: 'Зелёный детокс', name_en: 'Green Detox Smoothie', category: 'smoothie',
    method: 'blend', glass: 'highball', garnish: '', difficulty: 1,
    ingredients: [
      { preset_id: 'pu-banana', name: 'Пюре банан', quantity: 60, unit: 'ml' },
      { preset_id: 'ot-matcha', name: 'Матча', quantity: 2, unit: 'g' },
      { preset_id: 'jc-apple', name: 'Яблочный сок', quantity: 100, unit: 'ml' },
      { preset_id: 'ot-almond-milk', name: 'Миндальное молоко', quantity: 80, unit: 'ml' },
      { preset_id: 'sy-honey', name: 'Мёд', quantity: 10, unit: 'ml' },
    ],
  },
  {
    id: 'rc-protein-shake', name: 'Протеиновый шейк', name_en: 'Protein Shake', category: 'smoothie',
    method: 'blend', glass: 'highball', garnish: '', difficulty: 1,
    ingredients: [
      { preset_id: 'pu-banana', name: 'Пюре банан', quantity: 80, unit: 'ml' },
      { preset_id: 'ot-protein', name: 'Протеин', quantity: 30, unit: 'g' },
      { preset_id: 'ot-oat-milk', name: 'Овсяное молоко', quantity: 200, unit: 'ml' },
      { preset_id: 'sy-honey', name: 'Мёд', quantity: 15, unit: 'ml' },
    ],
  },
]
