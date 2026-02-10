"use client";

import React, { useMemo, useState, useCallback } from "react";
import { TOBACCOS, getBrandNames, getCategories, type Category } from "@/data/tobaccos";
import MixPieChart from "@/components/MixPieChart";
import ProgressRing from "@/components/ProgressRing";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { SmokeCanvasBackground } from "@/components/SmokeCanvasBackground";
import TobaccoCard from "@/components/TobaccoCard";
import MixesDrawer from "@/components/MixesDrawer";
import SlotMachine from "@/components/SlotMachine";
import {
  IconStrength,
  IconHeat,
  IconWarning,
  IconSettings,
  IconBowl,
  IconPacking,
  IconCoals,
  IconTimer,
  IconTarget,
  IconStar,
  IconMix,
} from "@/components/Icons";
import { MIX_RECIPES, type MixRecipe } from "@/data/mixes";
import { calculateMix, validateMix, type MixItem } from "@/logic/mixCalculator";
import { useTheme } from "@/lib/ThemeContext";
import { useAuth } from "@/lib/AuthContext";
import { QuickSession } from "@/components/dashboard/QuickSession";
import { useSessions } from "@/lib/hooks/useSessions";
import { useSavedMixes } from "@/lib/hooks/useSavedMixes";
import { useGuests } from "@/lib/hooks/useGuests";
import { SaveMixModal } from "@/components/mix/SaveMixModal";
import { SavedMixesDrawer } from "@/components/mix/SavedMixesDrawer";
import { MixCostBreakdown } from "@/components/mix/MixCostBreakdown";
import { RecentGuests } from "@/components/guests/RecentGuests";
import { useInventory } from "@/lib/hooks/useInventory";
import type { MixSnapshot } from "@/types/database";
import Link from "next/link";

const BRANDS = getBrandNames();

// Ordered categories for consistent display
const CATEGORIES: Category[] = [
  "fruit",    // Фрукты
  "berry",    // Ягоды
  "citrus",   // Цитрус
  "tropical", // Тропики
  "mint",     // Свежесть
  "dessert",  // Десерты
  "soda",     // Напитки
  "candy",    // Сладости
  "spice",    // Специи
  "herbal",   // Травы
];

// Category labels and icons for better UX
const CATEGORY_INFO: Record<Category, { label: string; emoji: string }> = {
  fruit: { label: "Фрукты", emoji: "🍎" },
  berry: { label: "Ягоды", emoji: "🫐" },
  citrus: { label: "Цитрус", emoji: "🍋" },
  tropical: { label: "Тропики", emoji: "🥭" },
  mint: { label: "Свежесть", emoji: "❄️" },
  dessert: { label: "Десерты", emoji: "🍰" },
  soda: { label: "Напитки", emoji: "🥤" },
  candy: { label: "Сладости", emoji: "🍬" },
  spice: { label: "Специи", emoji: "🌶️" },
  herbal: { label: "Травы", emoji: "🌿" },
};

function roundToInt(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export default function MixPage() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const { createSession } = useSessions();
  const { saveMix, incrementUsage } = useSavedMixes();
  const { recordVisit } = useGuests();
  const { inventory, loading: inventoryLoading } = useInventory();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([TOBACCOS[0].id, TOBACCOS[1].id]);
  const [percents, setPercents] = useState<Record<string, number>>({
    [TOBACCOS[0].id]: 60,
    [TOBACCOS[1].id]: 40,
  });
  const [isMixesDrawerOpen, setIsMixesDrawerOpen] = useState(false);
  const [isSavedMixesDrawerOpen, setIsSavedMixesDrawerOpen] = useState(false);
  const [isSaveMixModalOpen, setIsSaveMixModalOpen] = useState(false);
  const [isGuestsDrawerOpen, setIsGuestsDrawerOpen] = useState(false);
  const [isMixesMenuOpen, setIsMixesMenuOpen] = useState(false);
  const [targetCompatibility, setTargetCompatibility] = useState<number | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [isSlotMachineOpen, setIsSlotMachineOpen] = useState(false);
  const [isQuickSessionOpen, setIsQuickSessionOpen] = useState(false);
  const skipNormalizationRef = React.useRef(false);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const mixRatioRef = React.useRef<HTMLDivElement>(null);
  const hasInitializedRef = React.useRef(false);

  // Apply a preset mix recipe
  const applyMixRecipe = useCallback((mix: MixRecipe, scrollToResults = true) => {
    // Find matching tobaccos by flavor name
    const matchedIds: string[] = [];
    const newPercents: Record<string, number> = {};

    for (const ingredient of mix.ingredients) {
      // Try to find exact match first (brand + flavor)
      let tobacco = TOBACCOS.find(
        t => t.flavor.toLowerCase() === ingredient.flavor.toLowerCase() &&
             t.brand.toLowerCase() === ingredient.brand?.toLowerCase()
      );

      // If no exact match, find by flavor only
      if (!tobacco) {
        tobacco = TOBACCOS.find(
          t => t.flavor.toLowerCase() === ingredient.flavor.toLowerCase()
        );
      }

      // If still no match, try partial match on flavor
      if (!tobacco) {
        tobacco = TOBACCOS.find(
          t => t.flavor.toLowerCase().includes(ingredient.flavor.toLowerCase()) ||
               ingredient.flavor.toLowerCase().includes(t.flavor.toLowerCase())
        );
      }

      // Avoid duplicates
      if (tobacco && !matchedIds.includes(tobacco.id) && matchedIds.length < 3) {
        matchedIds.push(tobacco.id);
        newPercents[tobacco.id] = ingredient.percent;
      }
    }

    // Only apply if we found at least 2 ingredients
    if (matchedIds.length >= 2) {
      // Set flag to skip the normalization effect
      skipNormalizationRef.current = true;
      setSelectedIds(matchedIds);
      setPercents(newPercents);

      // Scroll to results section after a brief delay (skip on initial load)
      if (scrollToResults) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, []);

  // Handle slot machine result
  const handleSlotResult = useCallback((tobaccos: import("@/data/tobaccos").Tobacco[]) => {
    const ids = tobaccos.map(t => t.id);
    const newPercents: Record<string, number> = {};

    // Distribute percentages: 40%, 35%, 25%
    const percentages = [40, 35, 25];
    ids.forEach((id, i) => {
      newPercents[id] = percentages[i] || 25;
    });

    skipNormalizationRef.current = true;
    setSelectedIds(ids);
    setPercents(newPercents);

    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  // Apply first popular mix on initial load (without scrolling)
  React.useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const topMix = MIX_RECIPES.find(m => m.popularity >= 5);
    if (topMix) {
      applyMixRecipe(topMix, false); // Don't scroll on initial load
    }
  }, [applyMixRecipe]);

  const filteredTobaccos = useMemo(() => {
    let result = TOBACCOS;
    if (selectedBrand) {
      result = result.filter(t => t.brand === selectedBrand);
    }
    if (selectedCategory) {
      result = result.filter(t => t.category === selectedCategory);
    }
    return result;
  }, [selectedBrand, selectedCategory]);

  const selectedTobaccos = useMemo(
    () => TOBACCOS.filter(t => selectedIds.includes(t.id)),
    [selectedIds]
  );

  const items: MixItem[] = useMemo(() => {
    return selectedTobaccos.map(t => ({
      tobacco: t,
      percent: percents[t.id] ?? 0,
    }));
  }, [selectedTobaccos, percents]);

  const validation = useMemo(() => validateMix(items), [items]);
  const result = useMemo(() => validation.ok ? calculateMix(items) : null, [items, validation.ok]);

  // Get recommended mixes based on target compatibility
  const recommendedMixes = useMemo(() => {
    if (targetCompatibility === null || targetCompatibility <= (result?.compatibility.score ?? 0)) {
      return [];
    }
    return MIX_RECIPES
      .filter(mix => mix.popularity >= 4)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 3);
  }, [targetCompatibility, result?.compatibility.score]);

  // Handle target change from ProgressRing (only show recommendations when significantly higher)
  const handleTargetChange = useCallback((target: number | null) => {
    setTargetCompatibility(target);
    // Only show recommendations when target is 20%+ higher than current
    if (target !== null && target > (result?.compatibility.score ?? 0) + 20) {
      setShowRecommendations(true);
    } else {
      setShowRecommendations(false);
    }
  }, [result?.compatibility.score]);

  // Save to localStorage
  React.useEffect(() => {
    if (result) {
      localStorage.setItem("hookah-mix-data", JSON.stringify({
        items: items.map(it => ({
          flavor: it.tobacco.flavor,
          brand: it.tobacco.brand,
          percent: it.percent,
          color: it.tobacco.color,
        })),
        result,
      }));
    }
  }, [result, items]);

  const toggleTobacco = useCallback((id: string) => {
    setSelectedIds(prev => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.length > 2 ? prev.filter(x => x !== id) : prev;
      }
      return prev.length < 3 ? [...prev, id] : prev;
    });
  }, []);

  const normalizePercents = useCallback((changedId: string, nextValue: number) => {
    const ids = selectedIds;
    const n = ids.length;
    const next: Record<string, number> = { ...percents, [changedId]: roundToInt(nextValue) };
    const others = ids.filter(id => id !== changedId);
    const remaining = 100 - next[changedId];

    if (n === 2) {
      next[others[0]] = remaining;
    } else {
      const a = others[0], b = others[1];
      const curA = percents[a] ?? 0;
      const curB = percents[b] ?? 0;
      const sum = curA + curB || 1;
      next[a] = roundToInt((curA / sum) * remaining);
      next[b] = remaining - next[a];
    }
    setPercents(next);
  }, [selectedIds, percents]);

  React.useEffect(() => {
    // Skip normalization if we just applied a mix recipe
    if (skipNormalizationRef.current) {
      skipNormalizationRef.current = false;
      return;
    }

    setPercents(prev => {
      const next = { ...prev };
      for (const id of selectedIds) if (next[id] == null) next[id] = 0;
      const sum = selectedIds.reduce((acc, id) => acc + (next[id] ?? 0), 0);
      const hasZeroPercent = selectedIds.some(id => (next[id] ?? 0) <= 0);

      // Redistribute if sum is not 100 OR if any tobacco has 0% (newly added)
      if ((sum !== 100 || hasZeroPercent) && selectedIds.length >= 2) {
        // Special caps for specific tobaccos
        const SUPERNOVA_ID = 'ds1'; // Darkside Supernova - max 2g per 20g bowl = 10%
        const supernovaCap = 10;
        const mintCap = 25; // General mint cap

        const tobaccoList = selectedIds.map(id => TOBACCOS.find(t => t.id === id)).filter(Boolean);

        // Separate Supernova, other mints, and non-mints
        const hasSupernova = selectedIds.includes(SUPERNOVA_ID);
        const mintIds = tobaccoList
          .filter(t => t?.category === 'mint' && t?.id !== SUPERNOVA_ID)
          .map(t => t!.id);
        const nonMintIds = selectedIds.filter(id => id !== SUPERNOVA_ID && !mintIds.includes(id));

        // Calculate totals with caps
        const supernovaTotal = hasSupernova ? supernovaCap : 0;
        const mintTotal = mintIds.length * mintCap;
        const nonMintTotal = 100 - supernovaTotal - mintTotal;

        // Distribute percentages
        if (hasSupernova) { next[SUPERNOVA_ID] = supernovaCap; }
        mintIds.forEach(id => { next[id] = mintCap; });

        // Distribute remaining to non-mint tobaccos
        const nonMintBase = nonMintIds.length > 0 ? Math.floor(nonMintTotal / nonMintIds.length) : 0;
        const remainder = nonMintIds.length > 0 ? nonMintTotal - nonMintBase * nonMintIds.length : 0;
        nonMintIds.forEach((id, idx) => { next[id] = nonMintBase + (idx === 0 ? remainder : 0); });
      }
      return next;
    });
  }, [selectedIds]);


  // Handle loading a saved mix
  const handleLoadSavedMix = useCallback((tobaccos: import("@/types/database").SavedMixTobacco[], mixId: string) => {
    const matchedIds: string[] = [];
    const newPercents: Record<string, number> = {};

    for (const t of tobaccos) {
      // Find tobacco by id first
      let tobacco = TOBACCOS.find(x => x.id === t.tobacco_id);
      // Fallback to brand + flavor match
      if (!tobacco) {
        tobacco = TOBACCOS.find(x =>
          x.brand.toLowerCase() === t.brand.toLowerCase() &&
          x.flavor.toLowerCase() === t.flavor.toLowerCase()
        );
      }

      if (tobacco && matchedIds.length < 3) {
        matchedIds.push(tobacco.id);
        newPercents[tobacco.id] = t.percent;
      }
    }

    if (matchedIds.length >= 2) {
      skipNormalizationRef.current = true;
      setSelectedIds(matchedIds);
      setPercents(newPercents);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, []);

  // Handle saving current mix
  const handleSaveMix = useCallback(async (name: string) => {
    if (!result) return;

    const tobaccos = items.map(it => ({
      tobacco_id: it.tobacco.id,
      brand: it.tobacco.brand,
      flavor: it.tobacco.flavor,
      percent: it.percent,
      color: it.tobacco.color,
    }));

    await saveMix(name, tobaccos, result.compatibility.score);
  }, [items, result, saveMix]);

  // Handle quick repeat from guest
  const handleRepeatGuestMix = useCallback((snapshot: MixSnapshot, tobaccos: { tobacco: typeof TOBACCOS[0]; percent: number }[]) => {
    const matchedIds: string[] = [];
    const newPercents: Record<string, number> = {};

    for (const t of tobaccos) {
      if (matchedIds.length < 3) {
        matchedIds.push(t.tobacco.id);
        newPercents[t.tobacco.id] = t.percent;
      }
    }

    if (matchedIds.length >= 2) {
      skipNormalizationRef.current = true;
      setSelectedIds(matchedIds);
      setPercents(newPercents);
      setIsGuestsDrawerOpen(false);

      // Scroll to Mix Ratio section (more useful than results)
      setTimeout(() => {
        mixRatioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, []);

  const compatColor = result?.compatibility.level === "perfect" ? theme.colors.success :
                      result?.compatibility.level === "good" ? theme.colors.primary :
                      result?.compatibility.level === "okay" ? theme.colors.warning : theme.colors.danger;

  const isAtLimit = selectedIds.length >= 3;

  return (
    <div className="min-h-screen transition-theme relative overflow-hidden">
      {/* Cinematic Smoke Background */}
      <SmokeCanvasBackground imageSrc="/images/hookah-hero.jpg" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="/images/logo-animated.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                Hookah Torus
              </h1>
              <p className="text-xs" style={{ color: "var(--color-textMuted)" }}>
                Mix Calculator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Main actions - always visible */}
            {/* Подбор */}
            <Link
              href="/recommend"
              className="btn text-sm flex items-center gap-1.5 px-2 sm:px-3"
              style={{
                background: "var(--color-bgHover)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              <IconTarget size={16} />
              <span className="hidden md:inline">Подбор</span>
            </Link>

            {/* Миксы dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMixesMenuOpen(!isMixesMenuOpen)}
                className="btn text-sm flex items-center gap-1.5 px-2 sm:px-3"
                style={{
                  background: "var(--color-bgHover)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                <IconMix size={16} />
                <span className="hidden md:inline">Миксы</span>
                <span className={`transition-transform text-xs ${isMixesMenuOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {isMixesMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMixesMenuOpen(false)} />
                  <div
                    className="absolute top-full left-0 mt-2 w-48 rounded-xl overflow-hidden z-50 shadow-xl"
                    style={{
                      background: "var(--color-bgCard)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <button
                      onClick={() => { setIsMixesDrawerOpen(true); setIsMixesMenuOpen(false); }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-[var(--color-bgHover)] transition-colors"
                      style={{ color: "var(--color-text)" }}
                    >
                      <IconMix size={16} />
                      <span>Рецепты миксов</span>
                    </button>
                    {user && (
                      <button
                        onClick={() => { setIsSavedMixesDrawerOpen(true); setIsMixesMenuOpen(false); }}
                        className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-[var(--color-bgHover)] transition-colors border-t"
                        style={{ color: "var(--color-text)", borderColor: "var(--color-border)" }}
                      >
                        <IconStar size={16} className="text-[var(--color-warning)]" />
                        <span>Мои сохранённые</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Гости (только для авторизованных) */}
            {user && (
              <button
                onClick={() => setIsGuestsDrawerOpen(true)}
                className="btn text-sm flex items-center gap-1.5 px-2 sm:px-3"
                style={{
                  background: "var(--color-success)",
                  color: "white",
                }}
              >
                <span>👥</span>
                <span className="hidden md:inline">Гости</span>
              </button>
            )}

            {/* Рандом */}
            <button
              onClick={() => setIsSlotMachineOpen(true)}
              className="btn btn-neon text-sm flex items-center gap-1.5 px-2 sm:px-3"
            >
              <span>🎰</span>
              <span className="hidden md:inline">Рандом</span>
            </button>

            {/* Divider */}
            <div className="hidden sm:block w-px h-6 mx-1" style={{ background: "var(--color-border)" }} />

            <ThemeSwitcher />
            {user ? (
              <Link href="/dashboard" className="btn btn-primary text-sm px-2 sm:px-3">
                <span className="sm:hidden">👤</span>
                <span className="hidden sm:inline">Кабинет</span>
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary text-sm px-2 sm:px-3">
                <span className="sm:hidden">👤</span>
                <span className="hidden sm:inline">Войти</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 relative z-10">
        {/* Selected chips */}
        <div className="flex flex-wrap items-center gap-2 mb-6 min-h-[44px]">
          {selectedTobaccos.map((t, i) => (
            <button
              key={t.id}
              onClick={() => toggleTobacco(t.id)}
              className="pill animate-scaleIn group"
              style={{
                borderColor: t.color,
                borderWidth: "2px",
                animationDelay: `${i * 50}ms`,
              }}
            >
              <span className="w-3 h-3 rounded-full" style={{ background: t.color }} />
              <span style={{ color: "var(--color-text)" }}>{t.flavor}</span>
              <span className="opacity-40 group-hover:opacity-100 transition-opacity ml-1">×</span>
            </button>
          ))}
          {isAtLimit && (
            <span className="badge badge-warning animate-fadeInUp">Max 3</span>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr,400px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Tobacco Selection */}
            <section className="card card-elevated">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    Select Tobaccos
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-textMuted)" }}>
                    Choose 2-3 flavors for your mix
                  </p>
                </div>
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: isAtLimit ? "var(--color-warning)" : "var(--color-textMuted)" }}
                >
                  {selectedIds.length}/3
                </span>
              </div>

              {/* Brand filter */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedBrand(null)}
                  className={`pill ${selectedBrand === null ? "pill-active" : ""}`}
                >
                  Все бренды
                </button>
                {BRANDS.map(brand => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(prev => prev === brand ? null : brand)}
                    className={`pill ${selectedBrand === brand ? "pill-active" : ""}`}
                  >
                    {brand}
                  </button>
                ))}
              </div>

              {/* Category filter toggle */}
              <div className="mb-5 pb-5 border-b" style={{ borderColor: "var(--color-border)" }}>
                <button
                  onClick={() => setShowCategoryFilter(prev => !prev)}
                  className="pill flex items-center gap-2"
                  style={{
                    background: selectedCategory || showCategoryFilter ? "var(--color-primary)" : "var(--color-bgHover)",
                    color: selectedCategory || showCategoryFilter ? "var(--color-bg)" : "var(--color-text)",
                  }}
                >
                  <span>🎨</span>
                  <span>Фильтр по вкусам</span>
                  {selectedCategory && (
                    <span className="text-xs opacity-80">({CATEGORY_INFO[selectedCategory].label})</span>
                  )}
                  <span className={`transition-transform ${showCategoryFilter ? "rotate-180" : ""}`}>▼</span>
                </button>

                {/* Expandable category list */}
                {showCategoryFilter && (
                  <div className="flex flex-wrap gap-2 mt-3 animate-fadeInUp">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`pill ${selectedCategory === null ? "pill-active" : ""}`}
                    >
                      Все вкусы
                    </button>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(prev => prev === cat ? null : cat)}
                        className={`pill ${selectedCategory === cat ? "pill-active" : ""}`}
                      >
                        <span className="mr-1">{CATEGORY_INFO[cat].emoji}</span>
                        {CATEGORY_INFO[cat].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tobacco grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredTobaccos.map((t) => {
                  const active = selectedIds.includes(t.id);
                  const disabled = isAtLimit && !active;

                  return (
                    <TobaccoCard
                      key={t.id}
                      tobacco={t}
                      isActive={active}
                      isDisabled={disabled}
                      onClick={() => !disabled && toggleTobacco(t.id)}
                    />
                  );
                })}
              </div>
            </section>

            {/* Mix Ratio */}
            <section ref={mixRatioRef} className="card card-elevated">
              <h2 className="text-lg font-semibold mb-5" style={{ color: "var(--color-text)" }}>
                Mix Ratio
              </h2>

              <div className="space-y-6">
                {items.map(it => (
                  <div key={it.tobacco.id}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-5 h-5 rounded-full shadow-lg"
                          style={{ background: it.tobacco.color, boxShadow: `0 0 12px ${it.tobacco.color}` }}
                        />
                        <div>
                          <p className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
                            {it.tobacco.flavor}
                          </p>
                          <p className="text-xs" style={{ color: "var(--color-textMuted)" }}>
                            {it.tobacco.brand}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-3xl font-bold tabular-nums"
                        style={{ color: it.tobacco.color }}
                      >
                        {it.percent}%
                      </span>
                    </div>

                    {/* Slider with gradient fill */}
                    <div className="relative">
                      <div
                        className="absolute top-1/2 -translate-y-1/2 left-0 h-2 rounded-full pointer-events-none"
                        style={{
                          width: `${it.percent}%`,
                          background: `linear-gradient(90deg, ${it.tobacco.color} 0%, color-mix(in srgb, ${it.tobacco.color} 60%, transparent) 100%)`,
                        }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={it.percent}
                        onChange={(e) => normalizePercents(it.tobacco.id, Number(e.target.value))}
                        style={{ ["--slider-color" as string]: it.tobacco.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {!validation.ok && (
                <div className="mt-5 p-4 rounded-xl badge-danger text-sm flex items-center gap-2">
                  <IconWarning size={18} /> {validation.error}
                </div>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Visualization */}
            <section className="card card-elevated">
              <MixPieChart items={items} />
            </section>

            {/* Results */}
            {result && (
              <section
                ref={resultsRef}
                className={`card card-elevated stagger-children ${result?.compatibility.level === "perfect" ? "animate-rainbow-border" : ""}`}
                style={{
                  overflow: "visible",
                  borderWidth: result?.compatibility.level === "perfect" ? "2px" : "1px",
                }}
              >
                {/* Compatibility Ring - Interactive */}
                <div className={`flex flex-col items-center mb-6 pb-8 ${result?.compatibility.level === "perfect" ? "perfect-celebration" : ""}`}>
                  <div
                    className={result.compatibility.level === "perfect" ? "animate-pulse-glow" : ""}
                    style={{ "--glow-color": compatColor } as React.CSSProperties}
                  >
                    <ProgressRing
                      value={result.compatibility.score}
                      color={compatColor}
                      size={160}
                      strokeWidth={12}
                      label="Compatibility"
                      sublabel={result.compatibility.level}
                      interactive={result.compatibility.score < 80}
                      onTargetChange={handleTargetChange}
                    />
                  </div>

                  {/* Interactive hint */}
                  {result.compatibility.score < 80 && (
                    <p
                      className="mt-4 text-xs tracking-wide text-center"
                      style={{ color: "var(--color-textMuted)" }}
                    >
                      Потяни кольцо для подбора микса
                    </p>
                  )}
                </div>

                {/* Compatibility details */}
                {result.compatibility.details.length > 0 && (
                  <div className="mb-6 p-4 rounded-xl" style={{ background: "var(--color-bgHover)" }}>
                    <ul className="space-y-1.5 text-xs" style={{ color: "var(--color-textMuted)" }}>
                      {result.compatibility.details.map((d, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span style={{ color: compatColor }}>•</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="stat-card">
                    <div className="mb-2" style={{ color: "var(--color-primary)" }}>
                      <IconStrength size={24} />
                    </div>
                    <div className="label">Strength</div>
                    <div className="value" style={{ color: "var(--color-text)" }}>
                      {result.finalStrength}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="mb-2" style={{ color: "var(--color-warning)" }}>
                      <IconHeat size={24} />
                    </div>
                    <div className="label">Heat</div>
                    <div className="value" style={{ color: "var(--color-text)" }}>
                      {result.finalHeatLoad}
                    </div>
                  </div>
                  <div
                    className="stat-card"
                    style={{
                      background: result.overheatingRisk === "low" ? "color-mix(in srgb, var(--color-success) 15%, transparent)" :
                                  result.overheatingRisk === "medium" ? "color-mix(in srgb, var(--color-warning) 15%, transparent)" :
                                  "color-mix(in srgb, var(--color-danger) 15%, transparent)",
                    }}
                  >
                    <div
                      className="mb-2"
                      style={{
                        color: result.overheatingRisk === "low" ? "var(--color-success)" :
                               result.overheatingRisk === "medium" ? "var(--color-warning)" : "var(--color-danger)",
                      }}
                    >
                      <IconWarning size={24} />
                    </div>
                    <div className="label">Risk</div>
                    <div
                      className="value text-xl uppercase"
                      style={{
                        color: result.overheatingRisk === "low" ? "var(--color-success)" :
                               result.overheatingRisk === "medium" ? "var(--color-warning)" : "var(--color-danger)",
                      }}
                    >
                      {result.overheatingRisk}
                    </div>
                  </div>
                </div>

                {/* Setup */}
                <div className="pt-5 border-t" style={{ borderColor: "var(--color-border)" }}>
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                    <IconSettings size={18} color="var(--color-primary)" />
                    Recommended Setup
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "var(--color-bgHover)" }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--color-bgAccent)" }}
                      >
                        <IconBowl size={20} color="var(--color-primary)" />
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--color-textMuted)" }}>
                          Bowl
                        </p>
                        <p className="font-semibold text-sm capitalize" style={{ color: "var(--color-text)" }}>
                          {result.setup.bowlType}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "var(--color-bgHover)" }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--color-bgAccent)" }}
                      >
                        <IconPacking size={20} color="var(--color-primary)" />
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--color-textMuted)" }}>
                          Pack
                        </p>
                        <p className="font-semibold text-sm capitalize" style={{ color: "var(--color-text)" }}>
                          {result.setup.packing}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "var(--color-bgHover)" }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--color-bgAccent)" }}
                      >
                        <IconCoals size={20} color="var(--color-warning)" />
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--color-textMuted)" }}>
                          Coals
                        </p>
                        <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                          {result.setup.coals} pcs
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "var(--color-bgHover)" }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--color-bgAccent)" }}
                      >
                        <IconTimer size={20} color="var(--color-primary)" />
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--color-textMuted)" }}>
                          Heat-up
                        </p>
                        <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                          {result.setup.heatUpMinutes} min
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown - only show if logged in and inventory loaded */}
                {user && !inventoryLoading && inventory.length > 0 && (
                  <div className="pt-5 border-t" style={{ borderColor: "var(--color-border)" }}>
                    <MixCostBreakdown
                      items={items}
                      totalGrams={20}
                      inventory={inventory}
                      currency="€"
                    />
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Keyboard hint */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="glass px-4 py-2 rounded-full text-xs flex items-center gap-3 border" style={{ borderColor: "var(--color-border)" }}>
          <span style={{ color: "var(--color-textMuted)" }}>Theme:</span>
          {["1", "2", "3"].map(k => (
            <kbd
              key={k}
              className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs"
              style={{ background: "var(--color-bgAccent)", color: "var(--color-text)" }}
            >
              {k}
            </kbd>
          ))}
        </div>
      </div>

      {/* Recommendations Popup - Fixed overlay */}
      {showRecommendations && recommendedMixes.length > 0 && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setShowRecommendations(false)}
          />
          {/* Popup */}
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 p-5 rounded-2xl z-[70] animate-fadeInUp"
            style={{
              background: "var(--color-bgCard)",
              border: "1px solid var(--color-border)",
              boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  Рекомендуемые миксы
                </h4>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-textMuted)" }}>
                  Для совместимости {targetCompatibility}%+
                </p>
              </div>
              <button
                onClick={() => setShowRecommendations(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-bgHover)] transition-colors"
                style={{ color: "var(--color-textMuted)" }}
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {recommendedMixes.map(mix => (
                <button
                  key={mix.id}
                  onClick={() => {
                    applyMixRecipe(mix);
                    setShowRecommendations(false);
                    setTargetCompatibility(null);
                  }}
                  className="w-full p-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "var(--color-bgHover)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
                      {mix.name}
                    </span>
                    <div className="flex gap-0.5">
                      {[...Array(mix.popularity)].map((_, i) => (
                        <span key={i} className="text-xs" style={{ color: "var(--color-warning)" }}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs line-clamp-1" style={{ color: "var(--color-textMuted)" }}>
                    {mix.ingredients.map(i => i.flavor).join(" + ")}
                  </p>
                </button>
              ))}
            </div>
            <p className="text-[10px] mt-4 text-center" style={{ color: "var(--color-textMuted)" }}>
              Нажми на микс для применения
            </p>
          </div>
        </>
      )}

      {/* Mixes Drawer */}
      <MixesDrawer
        isOpen={isMixesDrawerOpen}
        onClose={() => setIsMixesDrawerOpen(false)}
        onSelectMix={applyMixRecipe}
      />

      {/* Slot Machine */}
      <SlotMachine
        isOpen={isSlotMachineOpen}
        onClose={() => setIsSlotMachineOpen(false)}
        onResult={handleSlotResult}
      />

      {/* Quick Session Modal for authenticated users */}
      {user && (
        <QuickSession
          isOpen={isQuickSessionOpen}
          onClose={() => setIsQuickSessionOpen(false)}
          onSave={async (session, sessionItems, deductFromInventory) => {
            await createSession(session, sessionItems, deductFromInventory);
          }}
          initialMix={items.map(it => ({
            tobacco: it.tobacco,
            percent: it.percent,
          }))}
        />
      )}

      {/* Save Mix Modal for authenticated users */}
      {user && (
        <SaveMixModal
          isOpen={isSaveMixModalOpen}
          onClose={() => setIsSaveMixModalOpen(false)}
          onSave={handleSaveMix}
          defaultName={items.map(it => it.tobacco.flavor).join(" + ")}
        />
      )}

      {/* Saved Mixes Drawer for authenticated users */}
      {user && (
        <SavedMixesDrawer
          isOpen={isSavedMixesDrawerOpen}
          onClose={() => setIsSavedMixesDrawerOpen(false)}
          onSelectMix={handleLoadSavedMix}
        />
      )}

      {/* Guests Drawer for Quick Repeat */}
      {user && isGuestsDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={() => setIsGuestsDrawerOpen(false)}
          />
          {/* Drawer */}
          <div
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-[70] overflow-y-auto animate-slideInRight"
            style={{
              background: "var(--color-bg)",
              borderLeft: "1px solid var(--color-border)",
            }}
          >
            <div className="sticky top-0 z-10 p-4 flex items-center justify-between border-b" style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                  Быстрый повтор
                </h2>
                <p className="text-xs" style={{ color: "var(--color-textMuted)" }}>
                  Выберите гостя для повтора микса
                </p>
              </div>
              <button
                onClick={() => setIsGuestsDrawerOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-bgHover)", color: "var(--color-textMuted)" }}
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <RecentGuests
                onRepeatMix={handleRepeatGuestMix}
                isPro={profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'enterprise'}
              />
            </div>
          </div>
        </>
      )}

      {/* Floating action bar for save actions */}
      {user && result && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-full shadow-lg z-40"
          style={{
            background: "color-mix(in srgb, var(--color-bgCard) 90%, transparent)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--color-border)",
          }}
        >
          <button
            onClick={() => setIsSaveMixModalOpen(true)}
            className="h-11 px-4 rounded-full flex items-center justify-center gap-2 text-sm font-medium transition-transform active:scale-95"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-bg)",
            }}
            title="Сохранить микс"
          >
            <span>💾</span>
            <span className="hidden sm:inline">Сохранить</span>
          </button>
          <button
            onClick={() => setIsQuickSessionOpen(true)}
            className="h-11 px-4 rounded-full flex items-center justify-center gap-2 text-sm font-medium transition-transform active:scale-95"
            style={{
              background: "var(--color-success)",
              color: "white",
            }}
            title="Записать сессию"
          >
            <span>📝</span>
            <span className="hidden sm:inline">Сессия</span>
          </button>
        </div>
      )}
    </div>
  );
}
