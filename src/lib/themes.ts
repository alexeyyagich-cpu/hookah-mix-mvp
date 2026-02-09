export type ThemeId = "dark" | "light" | "neon";

export type Theme = {
  id: ThemeId;
  name: string;
  key: string; // keyboard shortcut
  colors: {
    // Backgrounds
    bg: string;
    bgCard: string;
    bgHover: string;
    bgAccent: string;

    // Text
    text: string;
    textMuted: string;
    textAccent: string;

    // Borders
    border: string;
    borderAccent: string;

    // Brand
    primary: string;
    primaryHover: string;

    // Status
    success: string;
    warning: string;
    danger: string;

    // Special
    glow?: string;
    gradient?: string;
  };
};

export const THEMES: Record<ThemeId, Theme> = {
  dark: {
    id: "dark",
    name: "Lounge Dark",
    key: "1",
    colors: {
      bg: "#0A0A0B",
      bgCard: "#18181B",
      bgHover: "#27272A",
      bgAccent: "#3F3F46",
      text: "#FAFAFA",
      textMuted: "#A1A1AA",
      textAccent: "#F4F4F5",
      border: "#27272A",
      borderAccent: "#52525B",
      primary: "#F59E0B",
      primaryHover: "#D97706",
      success: "#22C55E",
      warning: "#EAB308",
      danger: "#EF4444",
      gradient: "linear-gradient(135deg, #F59E0B 0%, #DC2626 100%)",
    },
  },
  light: {
    id: "light",
    name: "Clean White",
    key: "2",
    colors: {
      bg: "#F8FAFC",
      bgCard: "#FFFFFF",
      bgHover: "#F1F5F9",
      bgAccent: "#E2E8F0",
      text: "#0F172A",
      textMuted: "#64748B",
      textAccent: "#1E293B",
      border: "#E2E8F0",
      borderAccent: "#CBD5E1",
      primary: "#7C3AED",
      primaryHover: "#6D28D9",
      success: "#16A34A",
      warning: "#CA8A04",
      danger: "#DC2626",
      gradient: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
    },
  },
  neon: {
    id: "neon",
    name: "Neon Smoke",
    key: "3",
    colors: {
      bg: "#030712",
      bgCard: "#111827",
      bgHover: "#1F2937",
      bgAccent: "#374151",
      text: "#F9FAFB",
      textMuted: "#9CA3AF",
      textAccent: "#E5E7EB",
      border: "#1F2937",
      borderAccent: "#4B5563",
      primary: "#06B6D4",
      primaryHover: "#0891B2",
      success: "#10B981",
      warning: "#F59E0B",
      danger: "#F43F5E",
      glow: "0 0 20px rgba(6, 182, 212, 0.5)",
      gradient: "linear-gradient(135deg, #06B6D4 0%, #8B5CF6 50%, #EC4899 100%)",
    },
  },
};

export const THEME_ORDER: ThemeId[] = ["dark", "light", "neon"];
