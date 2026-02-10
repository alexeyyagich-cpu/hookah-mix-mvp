# Hookah Mix Calculator — Claude Prompt

## Project Overview

Build a **Hookah Mix Calculator MVP** — a web app that helps users create tobacco mixes with calculated strength, heat management recommendations, and setup suggestions.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS

---

## Core Features

### 1. Tobacco Database
Store tobacco data with mixing popularity rankings based on 2025 lounge/forum data.

**Data Structure:**
```typescript
type Tobacco = {
  id: string;
  brand: string;
  flavor: string;
  strength: number;        // 1-10 (light=1-3, medium=4-6, strong=7-9)
  heatResistance: number;  // 1-10 (low=1-4, medium=5-6, high=7-9)
  mixRank: number;         // popularity for mixing (1=most popular)
  category: string;        // berry, citrus, mint, tropical, dessert, soda, fruit, candy, spice, herbal
  color: string;           // hex for UI
  pairsWith?: string[];    // recommended pairing categories
};
```

### 2. Tobacco Catalog (by brand, ranked by mixing popularity)

#### MustHave (Russian dark leaf, strength: 8)
| Rank | Flavor | Category | Heat | Color | Pairs With |
|------|--------|----------|------|-------|------------|
| 1 | Pinkman | berry | 8 | #EC4899 | mint, citrus, tropical |
| 2 | Cola | soda | 7 | #7C2D12 | citrus, fruit, mint |
| 3 | Lemon | citrus | 7 | #FCD34D | berry, mint, tropical |
| 4 | Strawberry-Lychee | berry | 8 | #F43F5E | citrus, mint, tropical |
| 5 | Cookie | dessert | 7 | #D97706 | fruit, berry, mint |

#### Darkside (Premium Burley, strength: 8)
| Rank | Flavor | Category | Heat | Color | Pairs With |
|------|--------|----------|------|-------|------------|
| 1 | Supernova | mint | 9 | #06B6D4 | everything (universal) |
| 2 | Bananapapa | fruit | 8 | #FACC15 | mint, floral, berry |
| 3 | Falling Star | tropical | 8 | #F59E0B | mint, citrus, berry |
| 4 | Bounty Hunter | dessert | 7 | #92400E | fruit, mint, tropical |
| 5 | Wild Forest | berry | 8 | #EF4444 | mint, citrus, tropical |
| 6 | Fruity Dust | tropical | 8 | #E879F9 | berry, mint, citrus |
| 7 | Torpedo | fruit | 8 | #4ADE80 | mint, berry, citrus |
| 8 | Kalee Grap | citrus | 8 | #FB923C | mint, berry, tropical |

#### Tangiers (Bold dark leaf, strength: 9)
| Rank | Flavor | Category | Heat | Color | Pairs With |
|------|--------|----------|------|-------|------------|
| 1 | Cane Mint | mint | 9 | #10B981 | everything (universal) |
| 2 | Kashmir Peach | fruit | 9 | #FDBA74 | mint, spice, floral |
| 3 | Pink Grapefruit | citrus | 9 | #F472B6 | mint, berry, tropical |
| 4 | Foreplay On The Peach | fruit | 9 | #FCA5A5 | mint, citrus, berry |
| 5 | Cocoa | dessert | 9 | #78350F | mint, fruit, spice |
| 6 | Pineapple | tropical | 9 | #FCD34D | mint, citrus, berry |
| 7 | Orange Soda | soda | 9 | #FB923C | mint, fruit, berry |

#### Black Burn (High-glycerin Burley, strength: 7-8)
| Rank | Flavor | Category | Strength | Heat | Color | Pairs With |
|------|--------|----------|----------|------|-------|------------|
| 1 | Overdose | citrus | 8 | 8 | #FBBF24 | berry, mint, tropical |
| 2 | Red Orange | citrus | 8 | 8 | #EA580C | mint, berry, tropical |
| 3 | Shock Currant | berry | 8 | 8 | #7C3AED | citrus, mint, tropical |
| 4 | Raspberries | berry | 8 | 8 | #F87171 | mint, citrus, tropical |
| 5 | Ice Baby | berry | 5 | 6 | #67E8F9 | citrus, tropical, fruit |
| 6 | Tropic Jack | tropical | 7 | 7 | #A3E635 | mint, citrus, berry |
| 7 | Peach Killer | fruit | 8 | 8 | #FDBA74 | mint, floral, citrus |
| 8 | Ananas Shock | tropical | 8 | 8 | #FDE047 | mint, citrus, berry |

#### Al Fakher (Light lounge staple, strength: 3)
| Rank | Flavor | Category | Heat | Color | Pairs With |
|------|--------|----------|------|-------|------------|
| 1 | Lemon Mint | citrus | 5 | #BEF264 | berry, fruit, tropical |
| 2 | Grape with Mint | fruit | 5 | #A78BFA | citrus, berry, mint |
| 3 | Two Apples | fruit | 5 | #EF4444 | mint, spice, citrus |

#### Fumari (Light beginner-friendly, strength: 3)
| Rank | Flavor | Category | Heat | Color | Pairs With |
|------|--------|----------|------|-------|------------|
| 1 | White Gummi Bear | candy | 4 | #FEF3C7 | fruit, citrus, berry |
| 2 | Ambrosia | fruit | 4 | #FBBF24 | mint, citrus, berry |
| 3 | Spiced Chai | spice | 4 | #B45309 | fruit, dessert, mint |

#### Starbuzz (Light-medium clouds, strength: 4)
| Rank | Flavor | Category | Heat | Color | Pairs With |
|------|--------|----------|------|-------|------------|
| 1 | Blue Mist | berry | 5 | #60A5FA | mint, citrus, fruit |
| 2 | Code 69 | tropical | 5 | #FB7185 | mint, citrus, berry |
| 3 | Pirates Cave | fruit | 5 | #4ADE80 | mint, berry, citrus |

---

### 3. Mix Calculator Logic

```typescript
type MixItem = { tobacco: Tobacco; percent: number };

type MixResult = {
  finalStrength: number;      // weighted average
  finalHeatLoad: number;      // strength*0.6 + (10-heatResistance)*0.4
  overheatingRisk: "low" | "medium" | "high";
  compatibility: number;      // 0-100% based on pairsWith matching
  setup: {
    bowlType: "phunnel" | "turka";
    packing: "classic" | "overpack";
    coals: 3 | 4;
    heatUpMinutes: number;
  };
};

// Validation: 2-3 tobaccos, sum = 100%
// Risk: low (<6), medium (6-8), high (>8)
// Bowl: phunnel for strength >= 7
// Packing: classic for strength > 7
// Coals: 3 if avgHeatResistance < 5
// Heat-up: 5-8 min based on bowl + strength
```

### 4. Compatibility Score Algorithm
```typescript
function calculateCompatibility(items: MixItem[]): number {
  // Check if tobacco categories match pairsWith of other tobaccos
  // Higher score = better pairing based on forum recommendations
  // Example: Cane Mint (mint) + Pinkman (berry) = high compatibility
  // because Pinkman.pairsWith includes "mint"
}
```

---

### 5. UI Pages

#### `/mix` — Main Calculator
- Brand filter pills (All, MustHave, Darkside, Tangiers, etc.)
- Tobacco grid with color indicators, strength/heat badges
- Selected tobaccos shown as removable chips
- Percentage sliders (auto-normalize to 100%)
- Pie chart visualization
- Results card: strength, heat load, risk, compatibility score
- Setup recommendations grid

#### `/setup` — Detailed Recommendations
- Mix summary with color chips
- Risk warning banner (green/yellow/red)
- Setup cards: Bowl, Packing, Coals, Heat-up time
- Dynamic tips based on mix parameters
- "Save Mix" / "Share" buttons (future)

---

### 6. Smart Mix Suggestions (Future Feature)
```typescript
function suggestMixes(selectedTobacco: Tobacco): Tobacco[] {
  // Return top 3 tobaccos that pair well based on:
  // 1. Category matching (pairsWith)
  // 2. Strength balance (mix strong + light)
  // 3. Mix popularity ranking
}
```

---

## File Structure
```
src/
├── app/
│   ├── page.tsx          # redirect to /mix
│   ├── mix/page.tsx      # calculator
│   └── setup/page.tsx    # recommendations
├── components/
│   └── MixPieChart.tsx   # SVG pie chart
├── data/
│   └── tobaccos.ts       # tobacco database
└── logic/
    └── mixCalculator.ts  # calculation functions
```

---

## Key UX Requirements
1. Mobile-first responsive design
2. Instant calculations (no loading states)
3. Visual feedback: colors match tobacco flavors
4. Clear risk indicators with actionable advice
5. Brand filtering for easy navigation (45+ tobaccos)
6. Percentage sliders auto-balance to 100%

---

## Example Mix Scenarios

**Scenario 1: Strong Tropical**
- Tangiers Cane Mint (40%) + Darkside Falling Star (35%) + MustHave Pinkman (25%)
- Result: Strength 8.5, Heat Load 7.2, Risk: MEDIUM
- Setup: Phunnel, Classic pack, 4 coals, 7 min

**Scenario 2: Light Refresher**
- Al Fakher Lemon Mint (50%) + Fumari White Gummi Bear (30%) + Starbuzz Blue Mist (20%)
- Result: Strength 3.2, Heat Load 4.8, Risk: LOW
- Setup: Turka, Overpack, 3 coals, 5 min

**Scenario 3: Citrus Explosion**
- Black Burn Overdose (45%) + Darkside Kalee Grap (35%) + Tangiers Pink Grapefruit (20%)
- Result: Strength 8.2, Heat Load 7.5, Risk: MEDIUM
- Setup: Phunnel, Classic pack, 4 coals, 7 min

---

## Implementation Notes
- Use `localStorage` to persist mix state between pages
- Colors should be vibrant and match flavor profiles
- Strength indicators: green (1-3), yellow (4-6), red (7-10)
- Heat resistance: snowflake icon for low, flame for high
- All calculations are deterministic, no randomness
