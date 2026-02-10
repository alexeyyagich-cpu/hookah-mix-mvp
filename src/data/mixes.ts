import { Category } from "./tobaccos";

export type MixRecipe = {
  id: string;
  name: string;
  description: string;
  category: "refreshing" | "sweet" | "fruity" | "dessert" | "exotic" | "classic";
  ingredients: {
    flavor: string;
    brand?: string;
    percent: number;
    category: Category;
  }[];
  tags: string[];
  difficulty: "easy" | "medium" | "advanced";
  popularity: number; // 1-5
};

// Curated mix recipes from hookah community and official brand recommendations
export const MIX_RECIPES: MixRecipe[] = [
  // === REFRESHING MIXES ===
  {
    id: "mix-1",
    name: "Cool Banana Man",
    description: "Ягодная свежесть с банановой сладостью и холодком",
    category: "refreshing",
    ingredients: [
      { flavor: "Pinkman", brand: "Musthave", percent: 50, category: "berry" },
      { flavor: "Bananapapa", brand: "Darkside", percent: 40, category: "fruit" },
      { flavor: "Supernova", brand: "Darkside", percent: 10, category: "mint" },
    ],
    tags: ["ягоды", "банан", "свежесть", "популярный"],
    difficulty: "easy",
    popularity: 5,
  },
  {
    id: "mix-2",
    name: "Watermelon Chill",
    description: "Освежающий арбуз с мятой — классика лета",
    category: "refreshing",
    ingredients: [
      { flavor: "Torpedo", brand: "Darkside", percent: 90, category: "fruit" },
      { flavor: "Supernova", brand: "Darkside", percent: 10, category: "mint" },
    ],
    tags: ["арбуз", "мята", "лето", "классика"],
    difficulty: "easy",
    popularity: 5,
  },
  {
    id: "mix-3",
    name: "Citrus Blast",
    description: "Взрывной цитрусовый микс с освежающими нотами",
    category: "refreshing",
    ingredients: [
      { flavor: "Overdose", brand: "Black Burn", percent: 50, category: "citrus" },
      { flavor: "Lemon-Lime", brand: "Musthave", percent: 30, category: "citrus" },
      { flavor: "Cane Mint", brand: "Tangiers", percent: 20, category: "mint" },
    ],
    tags: ["цитрус", "лимон", "лайм", "свежесть"],
    difficulty: "medium",
    popularity: 4,
  },

  // === FRUITY MIXES ===
  {
    id: "mix-4",
    name: "Tropical Paradise",
    description: "Тропический рай с манго, ананасом и маракуйей",
    category: "fruity",
    ingredients: [
      { flavor: "Falling Star", brand: "Darkside", percent: 40, category: "tropical" },
      { flavor: "Pineapple", brand: "Tangiers", percent: 35, category: "tropical" },
      { flavor: "Fruity Dust", brand: "Darkside", percent: 25, category: "tropical" },
    ],
    tags: ["тропики", "манго", "ананас", "экзотика"],
    difficulty: "medium",
    popularity: 5,
  },
  {
    id: "mix-5",
    name: "Berry Explosion",
    description: "Ягодный взрыв — смородина, малина и черника",
    category: "fruity",
    ingredients: [
      { flavor: "Wild Forest", brand: "Darkside", percent: 40, category: "berry" },
      { flavor: "Shock Currant", brand: "Black Burn", percent: 35, category: "berry" },
      { flavor: "Raspberries", brand: "Black Burn", percent: 25, category: "berry" },
    ],
    tags: ["ягоды", "смородина", "малина", "насыщенный"],
    difficulty: "easy",
    popularity: 4,
  },
  {
    id: "mix-6",
    name: "Peach Dream",
    description: "Нежный персик с йогуртовыми нотами",
    category: "fruity",
    ingredients: [
      { flavor: "Kashmir Peach", brand: "Tangiers", percent: 50, category: "fruit" },
      { flavor: "Peach Yogurt", brand: "Black Burn", percent: 30, category: "dessert" },
      { flavor: "Peach Killer", brand: "Black Burn", percent: 20, category: "fruit" },
    ],
    tags: ["персик", "йогурт", "нежный", "кремовый"],
    difficulty: "medium",
    popularity: 4,
  },

  // === DESSERT MIXES ===
  {
    id: "mix-7",
    name: "Choco Cookie",
    description: "Шоколадное печенье с нотами какао и ванили",
    category: "dessert",
    ingredients: [
      { flavor: "Cookie", brand: "Musthave", percent: 50, category: "dessert" },
      { flavor: "Cocoa", brand: "Tangiers", percent: 30, category: "dessert" },
      { flavor: "Bounty Hunter", brand: "Darkside", percent: 20, category: "dessert" },
    ],
    tags: ["печенье", "шоколад", "десерт", "сладкий"],
    difficulty: "medium",
    popularity: 4,
  },
  {
    id: "mix-8",
    name: "Cheesecake Dream",
    description: "Кремовый чизкейк с ягодным топпингом",
    category: "dessert",
    ingredients: [
      { flavor: "Cheesecake", brand: "Black Burn", percent: 50, category: "dessert" },
      { flavor: "Strawberry-Lychee", brand: "Musthave", percent: 30, category: "berry" },
      { flavor: "Milky Rice", brand: "Musthave", percent: 20, category: "dessert" },
    ],
    tags: ["чизкейк", "клубника", "кремовый", "десерт"],
    difficulty: "advanced",
    popularity: 3,
  },

  // === EXOTIC MIXES ===
  {
    id: "mix-9",
    name: "Earl Grey Lounge",
    description: "Аристократичный чай Эрл Грей с цитрусовыми нотами",
    category: "exotic",
    ingredients: [
      { flavor: "Earl Grey", brand: "Musthave", percent: 60, category: "herbal" },
      { flavor: "Grapefruit", brand: "Musthave", percent: 30, category: "citrus" },
      { flavor: "Supernova", brand: "Darkside", percent: 10, category: "mint" },
    ],
    tags: ["чай", "бергамот", "цитрус", "премиум"],
    difficulty: "medium",
    popularity: 4,
  },
  {
    id: "mix-10",
    name: "Spicy Morocco",
    description: "Восточные специи с пряными травами",
    category: "exotic",
    ingredients: [
      { flavor: "Morocco", brand: "Musthave", percent: 55, category: "spice" },
      { flavor: "Basilic", brand: "Black Burn", percent: 25, category: "herbal" },
      { flavor: "Orange Soda", brand: "Tangiers", percent: 20, category: "soda" },
    ],
    tags: ["специи", "восток", "пряный", "уникальный"],
    difficulty: "advanced",
    popularity: 3,
  },

  // === CLASSIC MIXES ===
  {
    id: "mix-11",
    name: "Cola Ice",
    description: "Классическая кола с ледяной свежестью",
    category: "classic",
    ingredients: [
      { flavor: "Cola", brand: "Musthave", percent: 60, category: "soda" },
      { flavor: "Siberian Soda", brand: "Black Burn", percent: 25, category: "soda" },
      { flavor: "Ice Baby", brand: "Black Burn", percent: 15, category: "berry" },
    ],
    tags: ["кола", "лёд", "классика", "газировка"],
    difficulty: "easy",
    popularity: 5,
  },
  {
    id: "mix-12",
    name: "Apple Mint Classic",
    description: "Вечная классика — яблоко с мятой",
    category: "classic",
    ingredients: [
      { flavor: "Apple Shock", brand: "Black Burn", percent: 60, category: "fruit" },
      { flavor: "Cane Mint", brand: "Tangiers", percent: 40, category: "mint" },
    ],
    tags: ["яблоко", "мята", "классика", "простой"],
    difficulty: "easy",
    popularity: 5,
  },

  // === SWEET MIXES ===
  {
    id: "mix-13",
    name: "Candy Shop",
    description: "Барбарисовые леденцы с ягодным послевкусием",
    category: "sweet",
    ingredients: [
      { flavor: "Barberry Candy", brand: "Musthave", percent: 50, category: "candy" },
      { flavor: "Pinkman", brand: "Musthave", percent: 35, category: "berry" },
      { flavor: "Something Berry", brand: "Black Burn", percent: 15, category: "berry" },
    ],
    tags: ["леденец", "барбарис", "сладкий", "конфеты"],
    difficulty: "easy",
    popularity: 4,
  },
  {
    id: "mix-14",
    name: "Prosecco Party",
    description: "Игристый просекко с тропическими фруктами",
    category: "sweet",
    ingredients: [
      { flavor: "Prosecco", brand: "Musthave", percent: 50, category: "soda" },
      { flavor: "Pineapple Rings", brand: "Musthave", percent: 30, category: "tropical" },
      { flavor: "Grapefruit", brand: "Musthave", percent: 20, category: "citrus" },
    ],
    tags: ["просекко", "праздник", "игристый", "премиум"],
    difficulty: "medium",
    popularity: 4,
  },

  // === WINTER SPECIAL ===
  {
    id: "mix-15",
    name: "Winter Forest",
    description: "Зимний лес — хвоя, мята и ягоды",
    category: "refreshing",
    ingredients: [
      { flavor: "Elka", brand: "Black Burn", percent: 50, category: "herbal" },
      { flavor: "Wild Forest", brand: "Darkside", percent: 40, category: "berry" },
      { flavor: "Supernova", brand: "Darkside", percent: 10, category: "mint" },
    ],
    tags: ["зима", "ёлка", "хвоя", "новый год"],
    difficulty: "medium",
    popularity: 4,
  },
];

// Get mixes by category
export const getMixesByCategory = (category: MixRecipe["category"]) =>
  MIX_RECIPES.filter(m => m.category === category);

// Get popular mixes
export const getPopularMixes = (limit = 5) =>
  [...MIX_RECIPES].sort((a, b) => b.popularity - a.popularity).slice(0, limit);

// Search mixes by tag
export const searchMixesByTag = (tag: string) =>
  MIX_RECIPES.filter(m => m.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));

// Get mix categories
export const getMixCategories = () => {
  const categories: MixRecipe["category"][] = ["refreshing", "sweet", "fruity", "dessert", "exotic", "classic"];
  return categories;
};

// Category labels
export const MIX_CATEGORY_INFO: Record<MixRecipe["category"], { label: string; emoji: string }> = {
  refreshing: { label: "Освежающие", emoji: "❄️" },
  sweet: { label: "Сладкие", emoji: "🍭" },
  fruity: { label: "Фруктовые", emoji: "🍇" },
  dessert: { label: "Десертные", emoji: "🍰" },
  exotic: { label: "Экзотические", emoji: "✨" },
  classic: { label: "Классические", emoji: "👑" },
};
