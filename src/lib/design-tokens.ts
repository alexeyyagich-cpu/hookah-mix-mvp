/**
 * Design Tokens for Hookah Torus
 *
 * Centralized design system values for consistency across the app.
 * Use these constants instead of hardcoded values.
 */

// =============================================================================
// SPACING
// =============================================================================

export const SPACING = {
  /** 4px - Micro spacing for tight layouts */
  xs: 4,
  /** 8px - Small spacing between related elements */
  sm: 8,
  /** 12px - Medium-small spacing */
  md: 12,
  /** 16px - Standard component padding */
  lg: 16,
  /** 20px - Card padding */
  xl: 20,
  /** 24px - Section gaps */
  '2xl': 24,
  /** 32px - Large section gaps */
  '3xl': 32,
  /** 48px - Page section spacing */
  '4xl': 48,
} as const

// Tailwind class mappings
export const SPACING_CLASSES = {
  xs: 'gap-1',      // 4px
  sm: 'gap-2',      // 8px
  md: 'gap-3',      // 12px
  lg: 'gap-4',      // 16px
  xl: 'gap-5',      // 20px
  '2xl': 'gap-6',   // 24px
  '3xl': 'gap-8',   // 32px
  '4xl': 'gap-12',  // 48px
} as const

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const RADIUS = {
  /** 8px - Small elements, tooltips */
  sm: 8,
  /** 12px - Buttons, inputs */
  md: 12,
  /** 16px - Cards, tobacco cards */
  lg: 16,
  /** 20px - Large cards */
  xl: 20,
  /** 100px - Pills, badges, fully rounded */
  full: 100,
} as const

export const RADIUS_CLASSES = {
  sm: 'rounded-lg',     // 8px
  md: 'rounded-xl',     // 12px
  lg: 'rounded-2xl',    // 16px
  xl: 'rounded-[20px]', // 20px
  full: 'rounded-full', // 100px
} as const

// =============================================================================
// COLORS (CSS variable references)
// =============================================================================

export const COLORS = {
  // Backgrounds
  bg: 'var(--color-bg)',
  bgCard: 'var(--color-bgCard)',
  bgHover: 'var(--color-bgHover)',
  bgAccent: 'var(--color-bgAccent)',

  // Text
  text: 'var(--color-text)',
  textMuted: 'var(--color-textMuted)',
  textAccent: 'var(--color-textAccent)',

  // Borders
  border: 'var(--color-border)',
  borderAccent: 'var(--color-borderAccent)',

  // Semantic
  primary: 'var(--color-primary)',
  primaryHover: 'var(--color-primaryHover)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
} as const

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const FONT_SIZE = {
  /** 11px - Micro labels */
  xs: 11,
  /** 12px - Small labels, badges */
  sm: 12,
  /** 13px - Pills, small text */
  md: 13,
  /** 14px - Body text, buttons */
  base: 14,
  /** 16px - Large body */
  lg: 16,
  /** 18px - h3, card titles */
  xl: 18,
  /** 20px - h2 small */
  '2xl': 20,
  /** 24px - h2 */
  '3xl': 24,
  /** 30px - h1 small */
  '4xl': 30,
  /** 36px - h1 */
  '5xl': 36,
} as const

export const FONT_WEIGHT = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const

// =============================================================================
// ANIMATION
// =============================================================================

export const DURATION = {
  /** 150ms - Fast micro-interactions */
  fast: 150,
  /** 200ms - Button hovers, small transitions */
  normal: 200,
  /** 300ms - Modal opens, larger transitions */
  slow: 300,
  /** 400ms - Page transitions, complex animations */
  slower: 400,
} as const

export const EASING = {
  default: 'ease',
  in: 'ease-in',
  out: 'ease-out',
  inOut: 'ease-in-out',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// =============================================================================
// Z-INDEX
// =============================================================================

export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const

// =============================================================================
// COMPONENT SIZES
// =============================================================================

export const BUTTON_HEIGHT = {
  sm: 32,  // h-8
  md: 40,  // h-10
  lg: 44,  // h-11 (touch-friendly)
  xl: 48,  // h-12
} as const

export const ICON_SIZE = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const

export const TOUCH_TARGET_MIN = 44 // Minimum touch target size in px

// =============================================================================
// CARD PADDING
// =============================================================================

export const CARD_PADDING = {
  /** p-4 - Compact cards */
  compact: 16,
  /** p-5 - Standard cards */
  default: 20,
  /** p-6 - Spacious cards */
  spacious: 24,
} as const

export const CARD_PADDING_CLASSES = {
  compact: 'p-4',
  default: 'p-5',
  spacious: 'p-6',
} as const
