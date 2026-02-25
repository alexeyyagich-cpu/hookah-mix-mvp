"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { THEME_ORDER, THEMES } from "@/lib/themes";
import { useTranslation } from "@/lib/i18n";

export default function ThemeSwitcher() {
  const { themeId, setTheme, theme } = useTheme();
  const tc = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentTheme = THEMES[themeId];

  return (
    <div className="relative" ref={dropdownRef}>
      <button type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{
          background: "var(--color-bgHover)",
          color: "var(--color-text)",
          border: "1px solid var(--color-border)",
        }}
        title={tc.changeTheme}
      >
        <span
          className="w-3 h-3 rounded-full"
          style={{ background: currentTheme.colors.primary }}
        />
        <span className="hidden sm:inline">{currentTheme.name}</span>
        <span className={`text-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 py-1 rounded-xl shadow-lg z-50 min-w-[140px]"
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
          }}
        >
          {THEME_ORDER.map((id) => {
            const t = THEMES[id];
            const isActive = themeId === id;

            return (
              <button type="button"
                key={id}
                onClick={() => {
                  setTheme(id);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--color-bgHover)]"
                style={{
                  color: isActive ? "var(--color-primary)" : "var(--color-text)",
                }}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: t.colors.primary }}
                />
                <span className="flex-1 text-left">{t.name}</span>
                <kbd
                  className="px-1 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: "var(--color-bgAccent)" }}
                >
                  {t.key}
                </kbd>
                {isActive && (
                  <span style={{ color: "var(--color-primary)" }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
