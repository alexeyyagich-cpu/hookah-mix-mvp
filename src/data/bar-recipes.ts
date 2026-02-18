import type { CocktailMethod, BarPortionUnit } from '@/types/database'

export const COCKTAIL_METHOD_LABELS: Record<CocktailMethod, string> = {
  build: 'Билд',
  stir: 'Стир',
  shake: 'Шейк',
  blend: 'Блендер',
  layer: 'Лейер',
  muddle: 'Мадл',
}

export const COCKTAIL_METHOD_EMOJI: Record<CocktailMethod, string> = {
  build: '\u{1F37A}',
  stir: '\u{1F944}',
  shake: '\u{1F943}',
  blend: '\u{26A1}',
  layer: '\u{1F308}',
  muddle: '\u{1FAA8}',
}

export const GLASS_LABELS: Record<string, string> = {
  highball: 'Хайбол',
  rocks: 'Рокс',
  coupe: 'Купе',
  flute: 'Флют',
  martini: 'Мартини',
  collins: 'Коллинз',
  hurricane: 'Харрикейн',
  shot: 'Шот',
  wine: 'Бокал для вина',
  beer: 'Пивной бокал',
  copper_mug: 'Медная кружка',
  tiki: 'Тики',
  other: 'Другой',
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Легко',
  2: 'Средне',
  3: 'Сложно',
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
  method: CocktailMethod
  glass: string
  garnish: string
  difficulty: 1 | 2 | 3
  ingredients: RecipePresetIngredient[]
}

export const RECIPE_PRESETS: RecipePreset[] = [
  // === CLASSICS ===
  {
    id: 'rc-mojito', name: 'Мохито', name_en: 'Mojito',
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
    id: 'rc-margarita', name: 'Маргарита', name_en: 'Margarita',
    method: 'shake', glass: 'coupe', garnish: 'Долька лайма, соль на ободке', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-tequila-b', name: 'Текила бланко', quantity: 50, unit: 'ml' },
      { preset_id: 'lq-triple', name: 'Трипл сек', quantity: 25, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 10, unit: 'ml', is_optional: true },
    ],
  },
  {
    id: 'rc-negroni', name: 'Негрони', name_en: 'Negroni',
    method: 'stir', glass: 'rocks', garnish: 'Долька апельсина', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-gin', name: 'Джин', quantity: 30, unit: 'ml' },
      { preset_id: 'lq-campari', name: 'Кампари', quantity: 30, unit: 'ml' },
      { preset_id: 'lq-vermouth-s', name: 'Сладкий вермут', quantity: 30, unit: 'ml' },
    ],
  },
  {
    id: 'rc-old-fashioned', name: 'Олд Фэшн', name_en: 'Old Fashioned',
    method: 'stir', glass: 'rocks', garnish: 'Цедра апельсина, вишня', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-whiskey-b', name: 'Виски бурбон', quantity: 60, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 10, unit: 'ml' },
      { preset_id: 'bt-angostura', name: 'Ангостура', quantity: 2, unit: 'dash' },
    ],
  },
  {
    id: 'rc-daiquiri', name: 'Дайкири', name_en: 'Daiquiri',
    method: 'shake', glass: 'coupe', garnish: 'Долька лайма', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-rum-w', name: 'Белый ром', quantity: 60, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-moscow-mule', name: 'Московский мул', name_en: 'Moscow Mule',
    method: 'build', glass: 'copper_mug', garnish: 'Долька лайма, мята', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 50, unit: 'ml' },
      { preset_id: 'mx-ginger-beer', name: 'Имбирное пиво', quantity: 120, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-whiskey-sour', name: 'Виски Сауэр', name_en: 'Whiskey Sour',
    method: 'shake', glass: 'rocks', garnish: 'Вишня, долька апельсина', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-whiskey-b', name: 'Виски бурбон', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 15, unit: 'ml' },
      { preset_id: 'ot-egg-white', name: 'Яичный белок', quantity: 1, unit: 'pcs', is_optional: true },
    ],
  },
  {
    id: 'rc-espresso-martini', name: 'Эспрессо Мартини', name_en: 'Espresso Martini',
    method: 'shake', glass: 'martini', garnish: 'Три зерна кофе', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 50, unit: 'ml' },
      { preset_id: 'lq-kahlua', name: 'Кофейный ликёр', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 10, unit: 'ml' },
    ],
  },
  {
    id: 'rc-gin-tonic', name: 'Джин-Тоник', name_en: 'Gin & Tonic',
    method: 'build', glass: 'highball', garnish: 'Долька лайма или огурец', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-gin', name: 'Джин', quantity: 50, unit: 'ml' },
      { preset_id: 'mx-tonic', name: 'Тоник', quantity: 150, unit: 'ml' },
    ],
  },
  {
    id: 'rc-aperol-spritz', name: 'Апероль Шприц', name_en: 'Aperol Spritz',
    method: 'build', glass: 'wine', garnish: 'Долька апельсина', difficulty: 1,
    ingredients: [
      { preset_id: 'lq-aperol', name: 'Апероль', quantity: 60, unit: 'ml' },
      { preset_id: 'wn-prosecco', name: 'Просекко', quantity: 90, unit: 'ml' },
      { preset_id: 'mx-soda', name: 'Содовая', quantity: 30, unit: 'ml' },
    ],
  },
  {
    id: 'rc-cosmopolitan', name: 'Космополитен', name_en: 'Cosmopolitan',
    method: 'shake', glass: 'martini', garnish: 'Цедра лайма', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 40, unit: 'ml' },
      { preset_id: 'lq-triple', name: 'Трипл сек', quantity: 15, unit: 'ml' },
      { preset_id: 'jc-cranberry', name: 'Клюквенный сок', quantity: 30, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-pina-colada', name: 'Пина Колада', name_en: 'Pina Colada',
    method: 'blend', glass: 'hurricane', garnish: 'Ананас, вишня', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-rum-w', name: 'Белый ром', quantity: 50, unit: 'ml' },
      { preset_id: 'ot-coconut-cream', name: 'Кокосовые сливки', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-pineapple', name: 'Ананасовый сок', quantity: 100, unit: 'ml' },
    ],
  },
  {
    id: 'rc-long-island', name: 'Лонг Айленд', name_en: 'Long Island Iced Tea',
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
  {
    id: 'rc-manhattan', name: 'Манхэттен', name_en: 'Manhattan',
    method: 'stir', glass: 'coupe', garnish: 'Коктейльная вишня', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-whiskey-b', name: 'Виски бурбон', quantity: 60, unit: 'ml' },
      { preset_id: 'lq-vermouth-s', name: 'Сладкий вермут', quantity: 30, unit: 'ml' },
      { preset_id: 'bt-angostura', name: 'Ангостура', quantity: 2, unit: 'dash' },
    ],
  },
  {
    id: 'rc-martini-dry', name: 'Сухой Мартини', name_en: 'Dry Martini',
    method: 'stir', glass: 'martini', garnish: 'Оливка или цедра лимона', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-gin', name: 'Джин', quantity: 60, unit: 'ml' },
      { preset_id: 'lq-vermouth-d', name: 'Сухой вермут', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-bloody-mary', name: 'Кровавая Мэри', name_en: 'Bloody Mary',
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
    id: 'rc-cuba-libre', name: 'Куба Либре', name_en: 'Cuba Libre',
    method: 'build', glass: 'highball', garnish: 'Долька лайма', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-rum-d', name: 'Тёмный ром', quantity: 50, unit: 'ml' },
      { preset_id: 'mx-cola', name: 'Кола', quantity: 120, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 10, unit: 'ml' },
    ],
  },
  {
    id: 'rc-tequila-sunrise', name: 'Текила Санрайз', name_en: 'Tequila Sunrise',
    method: 'build', glass: 'highball', garnish: 'Долька апельсина, вишня', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-tequila-b', name: 'Текила бланко', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-orange', name: 'Апельсиновый сок', quantity: 120, unit: 'ml' },
      { preset_id: 'sy-grenadine', name: 'Гренадин', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-mai-tai', name: 'Май Тай', name_en: 'Mai Tai',
    method: 'shake', glass: 'rocks', garnish: 'Мята, лайм', difficulty: 2,
    ingredients: [
      { preset_id: 'sp-rum-w', name: 'Белый ром', quantity: 30, unit: 'ml' },
      { preset_id: 'sp-rum-d', name: 'Тёмный ром', quantity: 30, unit: 'ml' },
      { preset_id: 'lq-triple', name: 'Трипл сек', quantity: 15, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 15, unit: 'ml' },
    ],
  },
  {
    id: 'rc-tom-collins', name: 'Том Коллинз', name_en: 'Tom Collins',
    method: 'shake', glass: 'collins', garnish: 'Долька лимона, вишня', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-gin', name: 'Джин', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 15, unit: 'ml' },
      { preset_id: 'mx-soda', name: 'Содовая', quantity: 60, unit: 'ml' },
    ],
  },
  {
    id: 'rc-white-russian', name: 'Белый Русский', name_en: 'White Russian',
    method: 'build', glass: 'rocks', garnish: '', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-vodka', name: 'Водка', quantity: 50, unit: 'ml' },
      { preset_id: 'lq-kahlua', name: 'Кофейный ликёр', quantity: 25, unit: 'ml' },
      { preset_id: 'ot-cream', name: 'Сливки', quantity: 25, unit: 'ml' },
    ],
  },
  {
    id: 'rc-amaretto-sour', name: 'Амаретто Сауэр', name_en: 'Amaretto Sour',
    method: 'shake', glass: 'rocks', garnish: 'Вишня, долька апельсина', difficulty: 1,
    ingredients: [
      { preset_id: 'lq-amaretto', name: 'Амаретто', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-lemon', name: 'Сок лимона', quantity: 25, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 10, unit: 'ml' },
      { preset_id: 'ot-egg-white', name: 'Яичный белок', quantity: 1, unit: 'pcs', is_optional: true },
    ],
  },
  {
    id: 'rc-paloma', name: 'Палома', name_en: 'Paloma',
    method: 'build', glass: 'highball', garnish: 'Долька грейпфрута, соль', difficulty: 1,
    ingredients: [
      { preset_id: 'sp-tequila-b', name: 'Текила бланко', quantity: 50, unit: 'ml' },
      { preset_id: 'jc-lime', name: 'Сок лайма', quantity: 15, unit: 'ml' },
      { preset_id: 'mx-soda', name: 'Содовая', quantity: 100, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 10, unit: 'ml' },
    ],
  },
  {
    id: 'rc-sazerac', name: 'Сазерак', name_en: 'Sazerac',
    method: 'stir', glass: 'rocks', garnish: 'Цедра лимона', difficulty: 3,
    ingredients: [
      { preset_id: 'sp-whiskey-b', name: 'Виски бурбон', quantity: 60, unit: 'ml' },
      { preset_id: 'sy-sugar', name: 'Сахарный сироп', quantity: 10, unit: 'ml' },
      { preset_id: 'bt-peychauds', name: 'Пейшо биттер', quantity: 3, unit: 'dash' },
      { preset_id: 'sp-absinthe', name: 'Абсент (ринс)', quantity: 5, unit: 'ml' },
    ],
  },
]
