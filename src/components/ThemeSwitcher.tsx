"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { THEME_ORDER, THEMES } from "@/lib/themes";
import { useTranslation } from "@/lib/i18n";

export default function ThemeSwitcher() {
  const { themeId, setTheme } = useTheme();
  const tc = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  // Keyboard navigation inside dropdown
  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const currentIndex = items.findIndex((el) => el === document.activeElement);

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[next]?.focus();
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prev]?.focus();
        break;
      }
      case "Home":
        e.preventDefault();
        items[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        toggleRef.current?.focus();
        break;
    }
  }, []);

  // Focus first item when dropdown opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        const activeIndex = THEME_ORDER.indexOf(themeId);
        itemRefs.current[activeIndex >= 0 ? activeIndex : 0]?.focus();
      });
    }
  }, [isOpen, themeId]);

  const currentTheme = THEMES[themeId];

  return (
    <div className="relative" ref={dropdownRef}>
      <button type="button"
        ref={toggleRef}
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
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
          aria-hidden="true"
        />
        <span className="hidden sm:inline">{currentTheme.name}</span>
        <span className={`text-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true">▼</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full mt-1 py-1 rounded-xl shadow-lg z-50 min-w-[140px]"
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
          }}
        >
          {THEME_ORDER.map((id, i) => {
            const t = THEMES[id];
            const isActive = themeId === id;

            return (
              <button type="button"
                key={id}
                ref={(el) => { itemRefs.current[i] = el; }}
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  setTheme(id);
                  setIsOpen(false);
                  toggleRef.current?.focus();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--color-bgHover)]"
                style={{
                  color: isActive ? "var(--color-primary)" : "var(--color-text)",
                }}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: t.colors.primary }}
                  aria-hidden="true"
                />
                <span className="flex-1 text-left">{t.name}</span>
                <kbd
                  className="px-1 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: "var(--color-bgAccent)" }}
                >
                  {t.key}
                </kbd>
                {isActive && (
                  <span style={{ color: "var(--color-primary)" }} aria-hidden="true">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
