"use client";

import { useTheme } from "@/lib/ThemeContext";
import { THEME_ORDER, THEMES } from "@/lib/themes";

export default function ThemeSwitcher() {
  const { themeId, setTheme, theme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {THEME_ORDER.map((id) => {
        const t = THEMES[id];
        const isActive = themeId === id;

        return (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: isActive ? "var(--color-primary)" : "var(--color-bgHover)",
              color: isActive ? "var(--color-bg)" : "var(--color-textMuted)",
              border: `1px solid ${isActive ? "var(--color-primary)" : "var(--color-border)"}`,
            }}
            title={`Press ${t.key} to switch`}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: t.colors.primary }}
            />
            <span className="hidden sm:inline">{t.name}</span>
            <kbd
              className="ml-1 px-1 py-0.5 rounded text-[10px] font-mono"
              style={{
                background: isActive ? "rgba(0,0,0,0.2)" : "var(--color-bgAccent)",
              }}
            >
              {t.key}
            </kbd>
          </button>
        );
      })}
    </div>
  );
}
