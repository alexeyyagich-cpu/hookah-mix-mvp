"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Theme, ThemeId, THEMES, THEME_ORDER } from "./themes";

type ThemeContextType = {
  theme: Theme;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>("dark");

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    localStorage.setItem("hookah-theme", id);
  }, []);

  const cycleTheme = useCallback(() => {
    const currentIndex = THEME_ORDER.indexOf(themeId);
    const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
    setTheme(THEME_ORDER[nextIndex]);
  }, [themeId, setTheme]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hookah-theme") as ThemeId | null;
    if (saved && THEMES[saved]) {
      setThemeId(saved);
    }
  }, []);

  // Keyboard shortcuts (1, 2, 3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "1") setTheme("dark");
      if (e.key === "2") setTheme("light");
      if (e.key === "3") setTheme("neon");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setTheme]);

  // Apply CSS variables
  useEffect(() => {
    const theme = THEMES[themeId];
    const root = document.documentElement;

    Object.entries(theme.colors).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(`--color-${key}`, value);
      }
    });

    // Set body class for potential Tailwind usage
    document.body.className = `theme-${themeId}`;
  }, [themeId]);

  const theme = THEMES[themeId];

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
