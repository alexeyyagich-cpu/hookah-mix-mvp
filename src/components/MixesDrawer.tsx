"use client";

import React, { useState } from "react";
import { useTranslation, useLocale } from "@/lib/i18n";
import { MIX_RECIPES, MIX_CATEGORY_INFO, getMixCategories, type MixRecipe } from "@/data/mixes";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectMix: (mix: MixRecipe) => void;
};

export default function MixesDrawer({ isOpen, onClose, onSelectMix }: Props) {
  const t = useTranslation("hookah");
  const { locale } = useLocale();
  const useEn = locale === "en" || locale === "de";
  const [selectedCategory, setSelectedCategory] = useState<MixRecipe["category"] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = getMixCategories();

  const filteredMixes = MIX_RECIPES.filter(mix => {
    const matchesCategory = !selectedCategory || mix.category === selectedCategory;
    const desc = useEn ? mix.description_en : mix.description;
    const tags = useEn ? mix.tags_en : mix.tags;
    const matchesSearch = !searchQuery ||
      mix.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSelectMix = (mix: MixRecipe) => {
    onSelectMix(mix);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          width: "min(420px, 90vw)",
          background: "var(--color-bgCard)",
          borderLeft: "1px solid var(--color-border)",
          boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-5 py-4 border-b flex items-center justify-between"
          style={{ background: "var(--color-bgCard)", borderColor: "var(--color-border)" }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
              {t.mixDrawerTitle}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-textMuted)" }}>
              {t.mixDrawerRecipeCount(MIX_RECIPES.length)}
            </p>
          </div>
          <button type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--color-bgHover)]"
            style={{ color: "var(--color-textMuted)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: "var(--color-bgHover)" }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-textMuted)"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder={t.mixDrawerSearchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--color-text)" }}
            />
            {searchQuery && (
              <button type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs px-2 py-1 rounded-lg hover:bg-[var(--color-bgAccent)] transition-colors"
                style={{ color: "var(--color-textMuted)" }}
              >
                {t.mixDrawerClear}
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-5 py-3 border-b overflow-x-auto" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex gap-2">
            <button type="button"
              onClick={() => setSelectedCategory(null)}
              className={`pill whitespace-nowrap ${!selectedCategory ? "pill-active" : ""}`}
            >
              {t.mixDrawerAll}
            </button>
            {categories.map(cat => (
              <button type="button"
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`pill whitespace-nowrap ${selectedCategory === cat ? "pill-active" : ""}`}
              >
                <span className="mr-1">{MIX_CATEGORY_INFO[cat].emoji}</span>
                {MIX_CATEGORY_INFO[cat].label}
              </button>
            ))}
          </div>
        </div>

        {/* Mixes list */}
        <div className="overflow-y-auto" style={{ height: "calc(100vh - 200px)" }}>
          <div className="p-5 space-y-3">
            {filteredMixes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🔍</p>
                <p style={{ color: "var(--color-textMuted)" }}>{t.mixDrawerNotFound}</p>
              </div>
            ) : (
              filteredMixes.map(mix => (
                <MixCard key={mix.id} mix={mix} onSelect={() => handleSelectMix(mix)} />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function MixCard({ mix, onSelect }: { mix: MixRecipe; onSelect: () => void }) {
  const t = useTranslation("hookah");
  const { locale } = useLocale();
  const useEn = locale === "en" || locale === "de";
  const [isExpanded, setIsExpanded] = useState(false);

  const difficultyColors = {
    easy: "var(--color-success)",
    medium: "var(--color-warning)",
    advanced: "var(--color-danger)",
  };

  const difficultyLabels = {
    easy: t.mixDifficultyEasy,
    medium: t.mixDifficultyMedium,
    advanced: t.mixDifficultyAdvanced,
  };

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "var(--color-bgHover)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* Card header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{MIX_CATEGORY_INFO[mix.category].emoji}</span>
              <h3 className="font-semibold truncate" style={{ color: "var(--color-text)" }}>
                {mix.name}
              </h3>
            </div>
            <p className="text-xs line-clamp-2" style={{ color: "var(--color-textMuted)" }}>
              {useEn ? mix.description_en : mix.description}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {/* Popularity stars */}
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="text-xs"
                  style={{ opacity: i < mix.popularity ? 1 : 0.3 }}
                >
                  ★
                </span>
              ))}
            </div>
            {/* Difficulty badge */}
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background: `color-mix(in srgb, ${difficultyColors[mix.difficulty]} 20%, transparent)`,
                color: difficultyColors[mix.difficulty],
              }}
            >
              {difficultyLabels[mix.difficulty]}
            </span>
          </div>
        </div>

        {/* Ingredients preview */}
        <div className="flex items-center gap-2 mt-3">
          {mix.ingredients.map((ing, i) => (
            <div
              key={`${ing.brand ?? ''}-${ing.flavor}`}
              className="h-2 rounded-full"
              style={{
                width: `${ing.percent}%`,
                background: "var(--color-primary)",
                opacity: 0.5 + (i * 0.2),
              }}
            />
          ))}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div
          className="px-4 pb-4 pt-2 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          {/* Ingredients list */}
          <div className="space-y-2 mb-4">
            {mix.ingredients.map((ing, i) => (
              <div key={`${ing.brand ?? ''}-${ing.flavor}`} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: "var(--color-primary)",
                      opacity: 0.5 + (i * 0.2),
                    }}
                  />
                  <span style={{ color: "var(--color-text)" }}>{ing.flavor}</span>
                  {ing.brand && (
                    <span className="text-xs" style={{ color: "var(--color-textMuted)" }}>
                      ({ing.brand})
                    </span>
                  )}
                </div>
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: "var(--color-primary)" }}
                >
                  {ing.percent}%
                </span>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(useEn ? mix.tags_en : mix.tags).map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="text-[10px] px-2 py-1 rounded-lg"
                style={{
                  background: "var(--color-bgAccent)",
                  color: "var(--color-textMuted)",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Apply button */}
          <button type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="w-full py-2.5 rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-bg)",
            }}
          >
            {t.mixDrawerApply}
          </button>
        </div>
      )}
    </div>
  );
}
