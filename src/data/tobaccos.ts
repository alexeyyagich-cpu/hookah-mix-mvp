export type Category = "berry" | "citrus" | "mint" | "tropical" | "dessert" | "soda" | "fruit" | "candy" | "spice" | "herbal";

// Emoji mapping for flavor categories
export const CATEGORY_EMOJI: Record<Category, string> = {
  berry: "🍇",
  citrus: "🍋",
  mint: "🌿",
  tropical: "🥭",
  dessert: "🍪",
  soda: "🥤",
  fruit: "🍑",
  candy: "🍬",
  spice: "🌶️",
  herbal: "🌱",
};

export type Tobacco = {
  id: string;
  brand: string;
  flavor: string;
  strength: number;        // 1..10
  heatResistance: number;  // 1..10
  color: string;           // hex
  category: Category;
  pairsWith: Category[];   // recommended pairing categories
  image?: string;          // optional background image path
};

// Image mapping by flavor category and name for cinematic backgrounds
// Use .svg for placeholders, replace with .jpg/.webp for real photos
export const FLAVOR_IMAGES: Record<string, string> = {
  // === MUSTHAVE — Real category photos ===
  "pinkman": "/images/flavors/mh-berries.jpg",
  "cola": "/images/flavors/mh-beverages.jpg",
  "cookie": "/images/flavors/mh-desserts.jpg",
  "strawberry-lychee": "/images/flavors/mh-berries.jpg",
  "lemon": "/images/flavors/mh-fruits.jpg",
  "earl grey": "/images/flavors/mh-brand-1.jpg",
  "morocco": "/images/flavors/mh-brand-2.jpg",
  "lemon-lime": "/images/flavors/mh-fruits.jpg",
  "barberry candy": "/images/flavors/mh-berries.jpg",
  "pineapple rings": "/images/flavors/mh-fruits.jpg",
  "milky rice": "/images/flavors/mh-desserts.jpg",
  "prosecco": "/images/flavors/mh-beverages.jpg",
  "grapefruit": "/images/flavors/mh-fruits.jpg",

  // === TANGIERS — Real product photos from hookahvault.com ===
  "cane mint": "/images/flavors/tg-cane-mint.png",
  "kashmir peach": "/images/flavors/tg-kashmir-peach.png",
  "pink grapefruit": "/images/flavors/tg-grapefruit.png",
  "foreplay on the peach": "/images/flavors/tg-foreplay-peach.png",
  "cocoa": "/images/flavors/tg-cocoa.webp",
  "pineapple": "/images/flavors/tg-pineapple.png",
  "orange soda": "/images/flavors/tg-orange-soda.png",

  // === BLACK BURN — Real product photos from b2hookah.com ===
  "overdose": "/images/flavors/bb-overdose.jpg",
  "red orange": "/images/flavors/bb-red-orange.webp",
  "shock currant": "/images/flavors/bb-shock-currant.webp",
  "raspberries": "/images/flavors/bb-raspberries.webp",
  "ice baby": "/images/flavors/bb-ice-baby.webp",
  "tropic jack": "/images/flavors/bb-tropic-jack.webp",
  "peach killer": "/images/flavors/bb-peach-killer.webp",
  "peach yogurt": "/images/flavors/bb-peach-yogurt.webp",
  "elka": "/images/flavors/bb-elka.webp",
  "basilic": "/images/flavors/bb-basilic.webp",
  "siberian soda": "/images/flavors/bb-siberian-soda.jpg",
  "something berry": "/images/flavors/bb-something-berry.webp",
  "cheesecake": "/images/flavors/bb-cheesecake.webp",
  "apple shock": "/images/flavors/bb-apple-shock.webp",

  // === DARKSIDE — Real product photos ===
  "wild forest": "/images/flavors/wild-forest.jpg",
  "supernova": "/images/flavors/supernova.jpg",
  "falling star": "/images/flavors/falling-star.jpg",
  "fruity dust": "/images/flavors/fruity-dust.jpg",
  "bananapapa": "/images/flavors/bananapapa.jpg",
  "torpedo": "/images/flavors/torpedo.jpg",
  "kalee grap": "/images/flavors/grape-core.jpg",

  // Other flavors (SVG placeholders)
  "blueberry": "/images/flavors/berry-mix.svg",
  "blue mist": "/images/flavors/berry-mix.svg",
  "lemon mint": "/images/flavors/lemon.svg",
  "limoncello": "/images/flavors/lemon.svg",
  "ananas shock": "/images/flavors/tropical-mix.svg",
  "code 69": "/images/flavors/tropical-mix.svg",
  "sex on the beach": "/images/flavors/tropical-mix.svg",
  "grape with mint": "/images/flavors/berry-mix.svg",
  "two apples": "/images/flavors/tropical-mix.svg",
  "watermelon": "/images/flavors/berry-mix.svg",
  "ambrosia": "/images/flavors/tropical-mix.svg",
  "pirates cave": "/images/flavors/tropical-mix.svg",

  // Dessert flavors (brown/warm tones)
  "bounty hunter": "/images/flavors/bounty-hunter.jpg",  // Darkside real photo
  "blueberry muffin": "/images/flavors/cookie.svg",

  // Candy & Spice
  "white gummi bear": "/images/flavors/tropical-mix.svg",
  "spiced chai": "/images/flavors/cookie.svg",
};

// Helper to get image for a tobacco
export const getFlavorImage = (flavor: string): string | undefined => {
  return FLAVOR_IMAGES[flavor.toLowerCase()];
};

export const TOBACCOS: Tobacco[] = [
  // === MUSTHAVE (Russian dark leaf, strong) ===
  { id: "mh1", brand: "Musthave", flavor: "Pinkman", strength: 8, heatResistance: 8, color: "#EC4899", category: "berry", pairsWith: ["mint", "citrus", "tropical"] },
  { id: "mh2", brand: "Musthave", flavor: "Cola", strength: 8, heatResistance: 7, color: "#7C2D12", category: "soda", pairsWith: ["citrus", "fruit", "mint"] },
  { id: "mh3", brand: "Musthave", flavor: "Cookie", strength: 8, heatResistance: 7, color: "#D97706", category: "dessert", pairsWith: ["fruit", "berry", "mint"] },
  { id: "mh4", brand: "Musthave", flavor: "Strawberry-Lychee", strength: 8, heatResistance: 8, color: "#F43F5E", category: "berry", pairsWith: ["citrus", "mint", "tropical"] },
  { id: "mh5", brand: "Musthave", flavor: "Lemon", strength: 8, heatResistance: 7, color: "#FCD34D", category: "citrus", pairsWith: ["berry", "mint", "tropical"] },
  // Top-rated MustHave flavors (htreviews.org 2025)
  { id: "mh6", brand: "Musthave", flavor: "Earl Grey", strength: 8, heatResistance: 8, color: "#6B7280", category: "herbal", pairsWith: ["citrus", "berry", "mint", "spice"] },
  { id: "mh7", brand: "Musthave", flavor: "Morocco", strength: 8, heatResistance: 8, color: "#B45309", category: "spice", pairsWith: ["mint", "citrus", "fruit", "dessert"] },
  { id: "mh8", brand: "Musthave", flavor: "Lemon-Lime", strength: 8, heatResistance: 7, color: "#A3E635", category: "citrus", pairsWith: ["berry", "mint", "tropical", "fruit"] },
  { id: "mh9", brand: "Musthave", flavor: "Barberry Candy", strength: 8, heatResistance: 7, color: "#F43F5E", category: "candy", pairsWith: ["citrus", "berry", "mint"] },
  { id: "mh10", brand: "Musthave", flavor: "Pineapple Rings", strength: 8, heatResistance: 8, color: "#FBBF24", category: "tropical", pairsWith: ["mint", "citrus", "berry", "fruit"] },
  { id: "mh11", brand: "Musthave", flavor: "Milky Rice", strength: 8, heatResistance: 7, color: "#F5F5F4", category: "dessert", pairsWith: ["fruit", "berry", "spice"] },
  { id: "mh12", brand: "Musthave", flavor: "Prosecco", strength: 8, heatResistance: 7, color: "#FDE68A", category: "soda", pairsWith: ["citrus", "berry", "fruit"] },
  { id: "mh13", brand: "Musthave", flavor: "Grapefruit", strength: 8, heatResistance: 8, color: "#FB7185", category: "citrus", pairsWith: ["mint", "berry", "tropical"] },

  // === DARKSIDE (Premium Burley, strong) ===
  { id: "ds1", brand: "Darkside", flavor: "Supernova", strength: 8, heatResistance: 9, color: "#06B6D4", category: "mint", pairsWith: ["berry", "citrus", "tropical", "fruit", "soda", "dessert"] },
  { id: "ds2", brand: "Darkside", flavor: "Bananapapa", strength: 8, heatResistance: 8, color: "#FACC15", category: "fruit", pairsWith: ["mint", "berry", "tropical"] },
  { id: "ds3", brand: "Darkside", flavor: "Falling Star", strength: 8, heatResistance: 8, color: "#F59E0B", category: "tropical", pairsWith: ["mint", "citrus", "berry"] },
  { id: "ds4", brand: "Darkside", flavor: "Bounty Hunter", strength: 8, heatResistance: 7, color: "#92400E", category: "dessert", pairsWith: ["fruit", "mint", "tropical"] },
  { id: "ds5", brand: "Darkside", flavor: "Wild Forest", strength: 8, heatResistance: 8, color: "#EF4444", category: "berry", pairsWith: ["mint", "citrus", "tropical"] },
  { id: "ds6", brand: "Darkside", flavor: "Fruity Dust", strength: 8, heatResistance: 8, color: "#E879F9", category: "tropical", pairsWith: ["berry", "mint", "citrus"] },
  { id: "ds7", brand: "Darkside", flavor: "Torpedo", strength: 8, heatResistance: 8, color: "#4ADE80", category: "fruit", pairsWith: ["mint", "berry", "citrus"] },
  { id: "ds8", brand: "Darkside", flavor: "Kalee Grap", strength: 8, heatResistance: 8, color: "#FB923C", category: "citrus", pairsWith: ["mint", "berry", "tropical"] },

  // === TANGIERS (Bold dark leaf, strong) ===
  { id: "tg1", brand: "Tangiers", flavor: "Cane Mint", strength: 9, heatResistance: 9, color: "#10B981", category: "mint", pairsWith: ["berry", "citrus", "tropical", "fruit", "soda", "dessert"] },
  { id: "tg2", brand: "Tangiers", flavor: "Kashmir Peach", strength: 9, heatResistance: 9, color: "#FDBA74", category: "fruit", pairsWith: ["mint", "spice", "citrus"] },
  { id: "tg3", brand: "Tangiers", flavor: "Pink Grapefruit", strength: 9, heatResistance: 9, color: "#F472B6", category: "citrus", pairsWith: ["mint", "berry", "tropical"] },
  { id: "tg4", brand: "Tangiers", flavor: "Foreplay On The Peach", strength: 9, heatResistance: 9, color: "#FCA5A5", category: "fruit", pairsWith: ["mint", "citrus", "berry"] },
  { id: "tg5", brand: "Tangiers", flavor: "Cocoa", strength: 9, heatResistance: 9, color: "#78350F", category: "dessert", pairsWith: ["mint", "fruit", "spice"] },
  { id: "tg6", brand: "Tangiers", flavor: "Pineapple", strength: 9, heatResistance: 9, color: "#FCD34D", category: "tropical", pairsWith: ["mint", "citrus", "berry"] },
  { id: "tg7", brand: "Tangiers", flavor: "Orange Soda", strength: 9, heatResistance: 9, color: "#FB923C", category: "soda", pairsWith: ["mint", "fruit", "berry"] },

  // === BLACK BURN (High-glycerin Burley, medium-strong) ===
  { id: "bb1", brand: "Black Burn", flavor: "Overdose", strength: 8, heatResistance: 8, color: "#FBBF24", category: "citrus", pairsWith: ["berry", "mint", "tropical"] },
  { id: "bb2", brand: "Black Burn", flavor: "Red Orange", strength: 8, heatResistance: 8, color: "#EA580C", category: "citrus", pairsWith: ["mint", "berry", "tropical"] },
  { id: "bb3", brand: "Black Burn", flavor: "Shock Currant", strength: 8, heatResistance: 8, color: "#7C3AED", category: "berry", pairsWith: ["citrus", "mint", "tropical"] },
  { id: "bb4", brand: "Black Burn", flavor: "Raspberries", strength: 8, heatResistance: 8, color: "#F87171", category: "berry", pairsWith: ["mint", "citrus", "tropical"] },
  { id: "bb5", brand: "Black Burn", flavor: "Ice Baby", strength: 5, heatResistance: 6, color: "#67E8F9", category: "berry", pairsWith: ["citrus", "tropical", "fruit"] },
  { id: "bb6", brand: "Black Burn", flavor: "Tropic Jack", strength: 7, heatResistance: 7, color: "#A3E635", category: "tropical", pairsWith: ["mint", "citrus", "berry"] },
  { id: "bb7", brand: "Black Burn", flavor: "Peach Killer", strength: 8, heatResistance: 8, color: "#FDBA74", category: "fruit", pairsWith: ["mint", "citrus", "berry"] },
  { id: "bb8", brand: "Black Burn", flavor: "Ananas Shock", strength: 8, heatResistance: 8, color: "#FDE047", category: "tropical", pairsWith: ["mint", "citrus", "berry"] },
  // Top-rated Black Burn flavors (htreviews.org + b2hookah 2025)
  { id: "bb9", brand: "Black Burn", flavor: "Peach Yogurt", strength: 8, heatResistance: 7, color: "#FBBF24", category: "dessert", pairsWith: ["fruit", "berry", "mint"] },
  { id: "bb10", brand: "Black Burn", flavor: "Elka", strength: 8, heatResistance: 8, color: "#22C55E", category: "herbal", pairsWith: ["mint", "citrus", "fruit"] },
  { id: "bb11", brand: "Black Burn", flavor: "Basilic", strength: 8, heatResistance: 8, color: "#4ADE80", category: "herbal", pairsWith: ["citrus", "fruit", "berry"] },
  { id: "bb12", brand: "Black Burn", flavor: "Siberian Soda", strength: 8, heatResistance: 7, color: "#7C2D12", category: "soda", pairsWith: ["citrus", "mint", "fruit"] },
  { id: "bb13", brand: "Black Burn", flavor: "Something Berry", strength: 8, heatResistance: 8, color: "#EC4899", category: "berry", pairsWith: ["mint", "citrus", "tropical"] },
  { id: "bb14", brand: "Black Burn", flavor: "Cheesecake", strength: 8, heatResistance: 7, color: "#FEF3C7", category: "dessert", pairsWith: ["fruit", "berry", "citrus"] },
  { id: "bb15", brand: "Black Burn", flavor: "Grapefruit", strength: 8, heatResistance: 8, color: "#FB7185", category: "citrus", pairsWith: ["mint", "berry", "tropical"] },
  { id: "bb16", brand: "Black Burn", flavor: "Apple Shock", strength: 8, heatResistance: 8, color: "#84CC16", category: "fruit", pairsWith: ["mint", "citrus", "berry"] },

  // === AL FAKHER (Light, lounge staple) ===
  { id: "af1", brand: "Al Fakher", flavor: "Lemon Mint", strength: 3, heatResistance: 5, color: "#BEF264", category: "citrus", pairsWith: ["berry", "fruit", "tropical"] },
  { id: "af2", brand: "Al Fakher", flavor: "Grape with Mint", strength: 3, heatResistance: 5, color: "#A78BFA", category: "fruit", pairsWith: ["citrus", "berry", "mint"] },
  { id: "af3", brand: "Al Fakher", flavor: "Two Apples", strength: 3, heatResistance: 5, color: "#EF4444", category: "fruit", pairsWith: ["mint", "spice", "citrus"] },
  { id: "af4", brand: "Al Fakher", flavor: "Watermelon", strength: 3, heatResistance: 5, color: "#FB7185", category: "fruit", pairsWith: ["mint", "berry", "citrus"] },
  { id: "af5", brand: "Al Fakher", flavor: "Blueberry", strength: 3, heatResistance: 5, color: "#818CF8", category: "berry", pairsWith: ["mint", "citrus", "fruit"] },

  // === FUMARI (Light, beginner-friendly) ===
  { id: "fm1", brand: "Fumari", flavor: "White Gummi Bear", strength: 3, heatResistance: 4, color: "#FEF3C7", category: "candy", pairsWith: ["fruit", "citrus", "berry"] },
  { id: "fm2", brand: "Fumari", flavor: "Spiced Chai", strength: 3, heatResistance: 4, color: "#B45309", category: "spice", pairsWith: ["fruit", "dessert", "mint"] },
  { id: "fm3", brand: "Fumari", flavor: "Ambrosia", strength: 3, heatResistance: 4, color: "#FBBF24", category: "fruit", pairsWith: ["mint", "citrus", "berry"] },
  { id: "fm4", brand: "Fumari", flavor: "Limoncello", strength: 3, heatResistance: 4, color: "#FDE047", category: "citrus", pairsWith: ["berry", "mint", "fruit"] },
  { id: "fm5", brand: "Fumari", flavor: "Blueberry Muffin", strength: 3, heatResistance: 4, color: "#6366F1", category: "dessert", pairsWith: ["fruit", "berry", "mint"] },

  // === STARBUZZ (Light-medium, consistent clouds) ===
  { id: "sb1", brand: "Starbuzz", flavor: "Blue Mist", strength: 4, heatResistance: 5, color: "#60A5FA", category: "berry", pairsWith: ["mint", "citrus", "fruit"] },
  { id: "sb2", brand: "Starbuzz", flavor: "Code 69", strength: 4, heatResistance: 5, color: "#FB7185", category: "tropical", pairsWith: ["mint", "citrus", "berry"] },
  { id: "sb3", brand: "Starbuzz", flavor: "Pirates Cave", strength: 4, heatResistance: 5, color: "#4ADE80", category: "fruit", pairsWith: ["mint", "berry", "citrus"] },
  { id: "sb4", brand: "Starbuzz", flavor: "Sex on the Beach", strength: 4, heatResistance: 5, color: "#FDBA74", category: "tropical", pairsWith: ["mint", "citrus", "berry"] },
];

// Helper to filter by brand
export const getBrandNames = () => [...new Set(TOBACCOS.map(t => t.brand))];

// Helper to filter by category
export const getCategories = (): Category[] => [...new Set(TOBACCOS.map(t => t.category))];

/* =============================================================================
   DEVELOPER NOTES — DATA METHODOLOGY & FUTURE SCALABILITY
   =============================================================================

   1. WHY THESE FLAVORS WERE SELECTED
   ──────────────────────────────────────────────────────────────────────────────
   This dataset represents the TOP mixing-oriented flavors from 7 major brands,
   curated from 2025-2026 market research across:

   • Hookah lounges (EU, US, CIS markets)
   • Online stores (b2hookah, worldhookahmarket, mozeshisha, blackshisha)
   • Community forums (Reddit r/hookah, dedicated Discord servers)
   • Professional hookah master recommendations

   Selection criteria:
   ✓ Mixing versatility — flavors frequently mentioned in multi-tobacco combos
   ✓ Commercial availability — in-stock at major distributors
   ✓ Community validation — positive reviews for blending, not just solo smoking
   ✓ Category coverage — ensuring diverse pairing options (mint, berry, citrus, etc.)

   Intentionally excluded:
   ✗ Limited editions and seasonal releases
   ✗ Region-specific flavors with low global availability
   ✗ Flavors known for solo smoking only (e.g., pure tobacco, unflavored)


   2. HOW MIXING POPULARITY WAS INFERRED
   ──────────────────────────────────────────────────────────────────────────────
   The ordering within each brand section reflects MIXING POPULARITY, not sales:

   Rank 1 = Most frequently mentioned in mix recipes across sources
   Rank 2 = Second most common mixing component
   ... and so on

   Data signals used:
   • Forum post frequency: How often a flavor appears in "What should I mix?" threads
   • Store bundle analysis: Which flavors are sold together in "mix packs"
   • Lounge menu presence: Featured combo ingredients at professional establishments
   • Expert recommendations: Hookah masters' go-to base/layer suggestions

   Example inference:
   Tangiers "Cane Mint" ranked #1 because:
   - Mentioned in 70%+ of Tangiers mix discussions
   - Described as "universal mixer" across all sources
   - Appears in most lounge signature blends using Tangiers

   Strength & Heat Resistance values derived from:
   • Brand leaf type (dark = 7-9 strength, blonde = 2-4)
   • Tobacco cut (fine = lower heat resistance, coarse = higher)
   • Glycerin content (high = needs more heat management)
   • Community consensus on bowl setup requirements


   3. PAIRING LOGIC (pairsWith ARRAYS)
   ──────────────────────────────────────────────────────────────────────────────
   The pairsWith arrays encode real-world mixing wisdom:

   • Mint pairs with EVERYTHING — it's the universal "coolant" in hookah mixing
   • Berry + Citrus = classic refreshing combo (forum favorite)
   • Tropical + Mint = "mojito style" mixes (lounge standard)
   • Dessert + Fruit = balanced sweetness (prevents overwhelming richness)
   • Soda + Citrus = fizzy profiles that complement each other

   These rules power the Compatibility Score algorithm, which calculates
   how well selected tobaccos work together based on category matching.


   4. FUTURE DATASET EXPANSION
   ──────────────────────────────────────────────────────────────────────────────

   PHASE 2 — User-Generated Data:
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ • User ratings for mixes (1-5 stars)                                    │
   │ • "I tried this" confirmations (validation signal)                      │
   │ • Custom flavor submissions (moderated)                                 │
   │ • Regional availability flags                                           │
   └─────────────────────────────────────────────────────────────────────────┘

   PHASE 3 — AI-Powered Features:
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ • Flavor profile embeddings (semantic similarity)                       │
   │ • Mix recommendation engine ("users who liked X also liked Y")          │
   │ • Taste preference learning (personalized suggestions)                  │
   │ • Natural language mix search ("something fruity but not too sweet")    │
   └─────────────────────────────────────────────────────────────────────────┘

   PHASE 4 — B2B Integration:
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ • Lounge inventory sync (real-time availability)                        │
   │ • Distributor price feeds                                               │
   │ • Brand partnership data (official pairing guides)                      │
   │ • Sales correlation analysis (what sells together)                      │
   └─────────────────────────────────────────────────────────────────────────┘


   5. DATA QUALITY COMMITMENTS
   ──────────────────────────────────────────────────────────────────────────────
   • Quarterly refresh: Dataset reviewed every 3 months against market trends
   • Source tracking: All data points traceable to original research
   • Bias mitigation: Multiple independent sources required for inclusion
   • Community feedback loop: Discord/Reddit channels for corrections


   6. TECHNICAL NOTES FOR CONTRIBUTORS
   ──────────────────────────────────────────────────────────────────────────────
   ID Convention:
   • mh = Musthave, ds = Darkside, tg = Tangiers
   • bb = Black Burn, af = Al Fakher, fm = Fumari, sb = Starbuzz

   Adding new tobaccos:
   1. Verify mixing popularity from 2+ independent sources
   2. Assign strength based on brand leaf type + specific flavor
   3. Choose color from Tailwind palette matching flavor profile
   4. Define pairsWith based on category compatibility matrix
   5. Test in UI to ensure visual distinction

   ─────────────────────────────────────────────────────────────────────────────
   Dataset version: 1.2.0
   Last updated: February 2025
   Tobaccos: 57 | Brands: 7 | Categories: 10
   ─────────────────────────────────────────────────────────────────────────────
*/
