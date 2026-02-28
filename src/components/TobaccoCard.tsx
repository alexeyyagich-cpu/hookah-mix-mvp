"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { type Tobacco, getFlavorImage } from "@/data/tobaccos";
import { IconStrength, IconHeat } from "@/components/Icons";

// =============================================================================
// OVERLAY CONFIGURATION — Controls readability over background images
// =============================================================================

const OVERLAY_CONFIG = {
  // Gradient overlay for text readability
  gradient: {
    // Dark vignette from edges + bottom gradient for text area
    default: `
      linear-gradient(180deg,
        rgba(0,0,0,0.3) 0%,
        rgba(0,0,0,0.1) 30%,
        rgba(0,0,0,0.4) 70%,
        rgba(0,0,0,0.75) 100%
      )
    `,
    // Stronger overlay on hover to maintain readability during zoom
    hover: `
      linear-gradient(180deg,
        rgba(0,0,0,0.35) 0%,
        rgba(0,0,0,0.15) 30%,
        rgba(0,0,0,0.45) 70%,
        rgba(0,0,0,0.8) 100%
      )
    `,
  },
  // Vignette for cinematic depth
  vignette: `radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)`,
} as const;

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  tobacco: Tobacco;
  isActive: boolean;
  isDisabled: boolean;
  onClick: () => void;
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function TobaccoCard({ tobacco, isActive, isDisabled, onClick }: Props) {
  const tc = useTranslation('common');
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const imagePath = getFlavorImage(tobacco.flavor);
  const hasImage = imagePath && !imageError;

  return (
    <button type="button"
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`${tobacco.brand} ${tobacco.flavor}, ${tc.tobaccoCard.strength} ${tobacco.strength}, ${tc.tobaccoCard.heatResistance} ${tobacco.heatResistance}${isActive ? `, ${tc.tobaccoCard.selected}` : ''}`}
      aria-pressed={isActive}
      className={`
        tobacco-card group relative overflow-hidden
        ${isActive ? "active" : ""}
        ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}
      `}
      style={{ ["--card-color" as string]: tobacco.color }}
    >
      {/* ════════════════════════════════════════════════════════════════════════
          LAYER 1: Background Image (if available)
          ════════════════════════════════════════════════════════════════════════ */}
      {hasImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={imagePath}
            alt={`${tobacco.brand} ${tobacco.flavor}`}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className={`
              object-cover transition-transform duration-500 ease-out
              ${isHovered && !isDisabled ? "scale-105" : "scale-100"}
            `}
            onError={() => setImageError(true)}
            priority={false}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          LAYER 2: Dark Gradient Overlay (ensures text readability)
          ════════════════════════════════════════════════════════════════════════ */}
      {hasImage && (
        <>
          {/* Main gradient overlay */}
          <div
            className="absolute inset-0 z-[1] transition-opacity duration-300"
            style={{
              background: isHovered ? OVERLAY_CONFIG.gradient.hover : OVERLAY_CONFIG.gradient.default,
            }}
          />
          {/* Vignette for depth */}
          <div
            className="absolute inset-0 z-[1]"
            style={{ background: OVERLAY_CONFIG.vignette }}
          />
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          LAYER 3: Color Accent Glow (matches flavor color)
          ════════════════════════════════════════════════════════════════════════ */}
      <div
        className={`
          absolute inset-0 z-[2] opacity-0 transition-opacity duration-300
          ${isActive ? "opacity-30" : "group-hover:opacity-20"}
        `}
        style={{
          background: `radial-gradient(ellipse at bottom, ${tobacco.color}40 0%, transparent 70%)`,
        }}
      />

      {/* ════════════════════════════════════════════════════════════════════════
          LAYER 4: Content
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Color indicator / checkmark */}
        {isActive ? (
          <div
            className="absolute top-0 right-0 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: tobacco.color,
              boxShadow: `0 0 14px ${tobacco.color}`,
            }}
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div
            className={`
              absolute top-0 right-0 w-4 h-4 rounded-full transition-all duration-300
              ${isHovered && !isDisabled ? "scale-110" : ""}
            `}
            style={{ background: tobacco.color }}
          />
        )}

        {/* Brand label */}
        <p
          className={`
            text-[11px] mb-1 transition-colors duration-300
            ${hasImage ? "text-white/70" : ""}
          `}
          style={{ color: hasImage ? undefined : "var(--color-textMuted)" }}
        >
          {tobacco.brand}
        </p>

        {/* Flavor name */}
        <p
          className={`
            font-semibold text-sm mb-auto pr-5 transition-colors duration-300
            ${hasImage ? "text-white drop-shadow-md" : ""}
          `}
          style={{ color: hasImage ? undefined : "var(--color-text)" }}
        >
          {tobacco.flavor}
        </p>

        {/* Stats badges */}
        <div className="flex gap-1.5 mt-2">
          <span
            className={`
              badge flex items-center gap-1 backdrop-blur-sm
              ${hasImage ? "bg-black/40 border border-white/10" : ""}
            `}
            style={hasImage ? {
              color: tobacco.strength >= 7 ? "var(--color-danger)" :
                     tobacco.strength >= 4 ? "var(--color-warning)" : "var(--color-success)",
            } : {
              background: tobacco.strength >= 7 ? "color-mix(in srgb, var(--color-danger) 20%, transparent)" :
                          tobacco.strength >= 4 ? "color-mix(in srgb, var(--color-warning) 20%, transparent)" :
                          "color-mix(in srgb, var(--color-success) 20%, transparent)",
              color: tobacco.strength >= 7 ? "var(--color-danger)" :
                     tobacco.strength >= 4 ? "var(--color-warning)" : "var(--color-success)",
            }}
          >
            <IconStrength size={12} /> {tobacco.strength}
          </span>
          <span
            className={`
              badge flex items-center gap-1 backdrop-blur-sm
              ${hasImage ? "bg-black/40 border border-white/10 text-white/80" : ""}
            `}
            style={hasImage ? undefined : {
              background: "var(--color-bgAccent)",
              color: "var(--color-textMuted)",
            }}
          >
            <IconHeat size={12} /> {tobacco.heatResistance}
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          LAYER 5: Selection ring (when active)
          ════════════════════════════════════════════════════════════════════════ */}
      {isActive && (
        <div
          className="absolute inset-0 z-[3] rounded-xl pointer-events-none"
          style={{
            boxShadow: `inset 0 0 0 2px ${tobacco.color}, 0 0 20px ${tobacco.color}40`,
          }}
        />
      )}
    </button>
  );
}
