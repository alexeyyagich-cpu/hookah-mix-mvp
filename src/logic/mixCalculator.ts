import { Tobacco } from "@/data/tobaccos";

export type MixItem = { tobacco: Tobacco; percent: number };

export type OverheatingRisk = "low" | "medium" | "high";

export type CompatibilityLevel = "perfect" | "good" | "okay" | "poor";

export type MixResult = {
  finalStrength: number;
  finalHeatLoad: number;
  overheatingRisk: OverheatingRisk;
  compatibility: {
    score: number;           // 0-100
    level: CompatibilityLevel;
    details: string[];       // explanations
  };
  setup: {
    bowlType: "phunnel" | "turka";
    packing: "classic" | "overpack";
    coals: 3 | 4;
    heatUpMinutes: number;
  };
};

// Helpers
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function validateMix(items: MixItem[]): { ok: boolean; error?: string } {
  if (items.length < 2 || items.length > 3) return { ok: false, error: "Select 2–3 tobaccos." };
  const sum = items.reduce((acc, x) => acc + x.percent, 0);
  if (sum !== 100) return { ok: false, error: "Percents must sum to 100." };
  if (items.some(x => x.percent <= 0)) return { ok: false, error: "Each percent must be > 0." };
  return { ok: true };
}

/**
 * Calculate compatibility score based on pairsWith categories
 * Checks if each tobacco's category is in the pairsWith of other tobaccos
 */
export function calculateCompatibility(items: MixItem[]): {
  score: number;
  level: CompatibilityLevel;
  details: string[];
} {
  if (items.length < 2) {
    return { score: 0, level: "poor", details: ["Need at least 2 tobaccos"] };
  }

  const details: string[] = [];
  let totalMatches = 0;
  let totalPossible = 0;

  // For each pair of tobaccos, check if they complement each other
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;

      const tobaccoA = items[i].tobacco;
      const tobaccoB = items[j].tobacco;

      totalPossible++;

      // Check if tobaccoB's category is in tobaccoA's pairsWith
      // OR if they are the same category (same flavors often work together)
      if (tobaccoA.pairsWith.includes(tobaccoB.category) || tobaccoA.category === tobaccoB.category) {
        totalMatches++;
      }
    }
  }

  // Calculate base score from pairing matches
  const pairingScore = totalPossible > 0 ? (totalMatches / totalPossible) * 100 : 0;

  // Bonus for mint (universal mixer)
  const hasMint = items.some(it => it.tobacco.category === "mint");
  const mintBonus = hasMint ? 10 : 0;

  // Check for category diversity (not all same category)
  const categories = new Set(items.map(it => it.tobacco.category));
  const diversityBonus = categories.size >= 2 ? 10 : -10;

  // Penalty for extreme strength difference
  const strengths = items.map(it => it.tobacco.strength);
  const strengthDiff = Math.max(...strengths) - Math.min(...strengths);
  const strengthPenalty = strengthDiff > 5 ? -15 : strengthDiff > 3 ? -5 : 0;

  // Final score (minimum 30% to respect user preferences)
  const rawScore = pairingScore + mintBonus + diversityBonus + strengthPenalty;
  const score = Math.round(clamp(rawScore, 30, 100));

  // Determine level (adjusted thresholds with 30% minimum)
  let level: CompatibilityLevel;
  if (score >= 80) level = "perfect";
  else if (score >= 60) level = "good";
  else if (score >= 40) level = "okay";
  else level = "poor";

  // Generate details
  if (hasMint) {
    const mintTobacco = items.find(it => it.tobacco.category === "mint")!.tobacco;
    details.push(`${mintTobacco.flavor} adds freshness to any mix`);
  }

  // Find good pairings
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i].tobacco;
      const b = items[j].tobacco;

      const aMatchesB = a.pairsWith.includes(b.category);
      const bMatchesA = b.pairsWith.includes(a.category);

      if (aMatchesB && bMatchesA) {
        details.push(`${a.flavor} + ${b.flavor} — excellent pairing`);
      } else if (aMatchesB || bMatchesA) {
        details.push(`${a.flavor} + ${b.flavor} — good combination`);
      }
    }
  }

  if (strengthDiff > 5) {
    details.push(`Large strength gap (${strengthDiff}) may cause uneven burn`);
  }

  if (categories.size === 1) {
    details.push(`All tobaccos are ${items[0].tobacco.category} — consider adding variety`);
  }

  return { score, level, details: details.slice(0, 4) }; // max 4 details
}

export function calculateMix(items: MixItem[]): MixResult {
  // Weighted averages
  const finalStrengthRaw =
    items.reduce((acc, x) => acc + x.tobacco.strength * (x.percent / 100), 0);

  const avgHeatResistance =
    items.reduce((acc, x) => acc + x.tobacco.heatResistance * (x.percent / 100), 0);

  // Heat load concept: stronger tobaccos + lower heatResistance => higher load
  const finalHeatLoadRaw = (finalStrengthRaw * 0.6) + ((10 - avgHeatResistance) * 0.4);

  const finalStrength = Math.round(clamp(finalStrengthRaw, 1, 10) * 10) / 10;
  const finalHeatLoad = Math.round(clamp(finalHeatLoadRaw, 1, 10) * 10) / 10;

  // Risk bands
  let overheatingRisk: OverheatingRisk = "low";
  if (finalHeatLoad >= 6) overheatingRisk = "medium";
  if (finalHeatLoad >= 8) overheatingRisk = "high";

  // Compatibility
  const compatibility = calculateCompatibility(items);

  // Setup rules
  const bowlType: "phunnel" | "turka" = finalStrength >= 7 ? "phunnel" : "turka";
  const packing: "classic" | "overpack" = finalStrength > 7 ? "classic" : "overpack";
  const coals: 3 | 4 = avgHeatResistance < 5 ? 3 : 4;

  let heatUpMinutes = bowlType === "phunnel" && finalStrength >= 7 ? 7 : 5;
  if (avgHeatResistance < 5) heatUpMinutes += 1;

  return {
    finalStrength,
    finalHeatLoad,
    overheatingRisk,
    compatibility,
    setup: { bowlType, packing, coals, heatUpMinutes },
  };
}
