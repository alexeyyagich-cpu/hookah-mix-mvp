# Hookah Mix Calculator — Data Engineering Prompt

## ROLE
You are a senior product engineer and data modeler working on a hookah-tech MVP.

You think in terms of:
- clean datasets
- investor-ready structure
- future scalability (mixing rules, AI later)

---

## CONTEXT
I am building a local MVP web app called **Hookah Mix Calculator** (Next.js + TypeScript).

The app uses a local dataset of tobaccos for:
- mix calculations
- pie-chart visualization
- setup recommendations

I will give you curated market research data (from forums, lounges, and stores, 2025–2026).

Your task is to convert this research into a production-ready MVP dataset and logic hints.

---

## INPUT DATA (MARKET RESEARCH)

Use the following text as the only source of truth:

```
MustHave flavors rank by mixing popularity based on forum and store mentions for combos like fruit-mint or soda-fruit blends in 2025 lounges.
1. Pinkman - berry; strong; ultra-versatile base mixer.
2. Cola - soda; strong; pairs with everything.
3. Lemon - citrus; strong; refresher in most mixes.
4. Strawberry-Lychee - berry; strong; fruity layer staple.
5. Cookie - dessert; strong; cream enhancer.

Darkside flavors prioritize those noted for blending with mint, fruits, or florals per reviews and tops.
1. Supernova - mint/cooling; strong; refreshes any mix.
2. Bananapapa - fruit; strong; pairs with mint/florals.
3. Falling Star - tropical; strong; tropical combo king.
4. Bounty Hunter - dessert/coconut chocolate; strong; versatile base.
5. Wild Forest - berry/strawberry; strong; strawberry layer.
6. Fruity Dust - dragon fruit; strong; exotic berry/tropical.
7. Torpedo - melon/watermelon; strong; summer fruit blends.
8. Kalee Grap(efruit) - citrus; strong; citrus punch adder.

Tangiers rankings emphasize lounge/forum mixes like peach-mint or fruit-cooling combos.
1. Cane Mint - mint; strong; universal mixer base.
2. Kashmir Peach - fruit/spiced; strong; peach mix classic.
3. Pink Grapefruit - citrus; strong; fruit refresher.
4. Foreplay On The Peach - fruit; strong; peach enhancer.
5. Cocoa - chocolate; strong; underrated depth mixer.
6. Pineapple - tropical; strong; tropical blends.
7. Orange Soda - citrus/soda; strong; soda fizz layer.

Black Burn sees citrus and berry shocks leading multi-flavor punches per 2025 mix guides.
1. Overdose - citrus; strong; citrus explosion base.
2. Red Orange - citrus; strong; blood orange mixer.
3. Shock Currant - berry; strong; berry tang layer.
4. Raspberries - berry; strong; berry explosion core.
5. Ice Baby - berry/citrus; medium; sorbet refresher.
6. Tropic Jack - tropical/dessert; medium-strong; tropical punch.
7. Peach Killer - fruit/floral; strong; peach depth.
8. Ananas Shock - tropical; strong; pineapple tingle.

Al Fakher (Light lounge staple)
1. Lemon Mint - citrus/mint; light; endless refresher mixes.
2. Grape with Mint - fruit/mint; light; balanced base.
3. Two Apples - fruit; light; apple foundation.

Fumari (Light beginner-friendly)
1. White Gummi Bear - candy; light; sweet candy mixer.
2. Ambrosia - fruit; light; fruity harmony layer.
3. Spiced Chai - spice/dessert; light; spice completer.

Starbuzz (Light-medium clouds)
1. Blue Mist - berry; light; replicated lounge staple.
2. Code 69 - tropical/passion; light; passion fruit base.
3. Pirates Cave - fruit; light; lime zing adder.
```

---

## OUTPUT REQUIREMENTS

### 1. TypeScript Dataset
Generate a complete `tobaccos.ts` file with the following structure:

```typescript
export type Category =
  | "berry" | "citrus" | "mint" | "tropical"
  | "dessert" | "soda" | "fruit" | "candy"
  | "spice" | "herbal" | "floral";

export type Tobacco = {
  id: string;                    // unique: "mh1", "ds2", etc.
  brand: string;                 // "Musthave", "Darkside", etc.
  flavor: string;                // exact name from research
  strength: number;              // 1-10 scale
  heatResistance: number;        // 1-10 scale
  mixRank: number;               // 1 = most popular for mixing
  category: Category;            // primary flavor category
  pairsWith: Category[];         // recommended pairing categories
  color: string;                 // hex color matching flavor profile
  tags?: string[];               // optional: "universal", "base", "layer"
};
```

**Strength mapping:**
- "light" → 2-3
- "medium" → 4-6
- "medium-strong" → 6-7
- "strong" → 7-9

**Heat resistance rules:**
- Dark leaf brands (Musthave, Darkside, Tangiers, Black Burn) → 7-9
- Light brands (Al Fakher, Fumari, Starbuzz) → 4-6
- Mint flavors get +1 heat resistance

**Color guidelines:**
- Berry → pink/purple (#EC4899, #8B5CF6)
- Citrus → orange/yellow (#F59E0B, #FCD34D)
- Mint → cyan/green (#06B6D4, #10B981)
- Tropical → yellow/lime (#FACC15, #A3E635)
- Dessert → brown/amber (#92400E, #D97706)
- Soda → brown/orange (#7C2D12, #FB923C)
- Fruit → various based on specific fruit
- Candy → cream/pink (#FEF3C7, #F472B6)
- Spice → amber/brown (#B45309)

### 2. Pairing Matrix
Create a `pairingRules.ts` with category compatibility:

```typescript
export const PAIRING_MATRIX: Record<Category, Category[]> = {
  mint: ["berry", "citrus", "tropical", "fruit", "soda", "dessert"], // universal
  berry: ["mint", "citrus", "tropical", "fruit"],
  citrus: ["mint", "berry", "tropical", "soda"],
  tropical: ["mint", "citrus", "berry", "fruit"],
  fruit: ["mint", "citrus", "berry", "tropical", "dessert"],
  dessert: ["mint", "fruit", "berry", "spice"],
  soda: ["citrus", "fruit", "mint"],
  candy: ["fruit", "citrus", "berry"],
  spice: ["fruit", "dessert", "mint"],
  herbal: ["mint", "citrus", "fruit"],
  floral: ["fruit", "berry", "mint"],
};
```

### 3. Brand Metadata
Create brand-level data:

```typescript
export type Brand = {
  id: string;
  name: string;
  origin: string;
  leafType: "dark" | "blonde";
  baseStrength: number;        // default strength for brand
  baseHeatResistance: number;
  description: string;
};

export const BRANDS: Brand[] = [
  {
    id: "musthave",
    name: "Musthave",
    origin: "International",
    leafType: "dark",
    baseStrength: 8,
    baseHeatResistance: 8,
    description: "Premium dark leaf with bold, intense flavors"
  },
  // ... etc
];
```

### 4. Suggested Mixes (Bonus)
Based on the research, suggest 5-10 popular mix combinations:

```typescript
export type SuggestedMix = {
  id: string;
  name: string;
  tobaccos: { tobaccoId: string; percent: number }[];
  description: string;
  tags: string[];
};

export const SUGGESTED_MIXES: SuggestedMix[] = [
  {
    id: "sm1",
    name: "Tropical Mint Blast",
    tobaccos: [
      { tobaccoId: "tg1", percent: 40 },  // Cane Mint
      { tobaccoId: "ds3", percent: 35 },  // Falling Star
      { tobaccoId: "mh1", percent: 25 },  // Pinkman
    ],
    description: "Refreshing tropical mix with mint backbone",
    tags: ["popular", "refreshing", "strong"]
  },
  // ... etc
];
```

---

## VALIDATION CHECKLIST

Before outputting, verify:

- [ ] All tobaccos from research are included
- [ ] IDs are unique and follow pattern (brand prefix + number)
- [ ] Strength values match the light/medium/strong descriptions
- [ ] Colors are visually distinct and match flavor profiles
- [ ] pairsWith arrays are consistent with PAIRING_MATRIX
- [ ] mixRank matches the order from research (1 = first listed)
- [ ] No duplicate flavors within same brand
- [ ] Total tobacco count matches research input

---

## OUTPUT FORMAT

Provide the output as:
1. Complete `tobaccos.ts` file content
2. Complete `pairingRules.ts` file content
3. Complete `brands.ts` file content
4. Complete `suggestedMixes.ts` file content
5. Summary statistics (count by brand, category distribution)

Use TypeScript with proper typing. Make it copy-paste ready for the codebase.
