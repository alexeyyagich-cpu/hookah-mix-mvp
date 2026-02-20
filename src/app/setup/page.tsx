"use client";

import { useEffect, useState } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import ProgressRing from "@/components/ProgressRing";
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
  IconPalette,
  IconLightbulb,
  IconCheck,
} from "@/components/Icons";
import { useTheme } from "@/lib/ThemeContext";
import { useTranslation } from "@/lib/i18n";
import type { MixResult } from "@/logic/mixCalculator";

type MixItemData = {
  flavor: string;
  brand: string;
  percent: number;
  color: string;
};

type StoredMixData = {
  items: MixItemData[];
  result: MixResult;
};

export default function SetupPage() {
  const t = useTranslation('hookah');
  const { theme } = useTheme();
  const [data, setData] = useState<StoredMixData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("hookah-mix-data");
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        setData(null);
      }
    }
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen transition-theme" style={{ background: "var(--color-bg)" }}>
        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}
              >
                HM
              </div>
              <h1 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                {t.setupPageTitle}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <a href="/mix" className="btn btn-ghost text-sm">
                {t.setupBackBtn}
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="card card-elevated text-center py-16">
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--color-bgHover)" }}
            >
              <IconBowl size={40} color="var(--color-textMuted)" />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
              {t.setupEmptyTitle}
            </h2>
            <p className="mb-6" style={{ color: "var(--color-textMuted)" }}>
              {t.setupEmptyHint}
            </p>
            <a href="/mix" className="btn btn-primary">
              {t.setupCreateMix}
            </a>
          </div>
        </main>
      </div>
    );
  }

  const { items, result } = data;
  const { setup, finalStrength, finalHeatLoad, overheatingRisk, compatibility } = result;

  const compatColor = compatibility.level === "perfect" ? theme.colors.success :
                      compatibility.level === "good" ? theme.colors.primary :
                      compatibility.level === "okay" ? theme.colors.warning : theme.colors.danger;

  const riskColor = overheatingRisk === "low" ? "var(--color-success)" :
                    overheatingRisk === "medium" ? "var(--color-warning)" : "var(--color-danger)";

  const riskBg = overheatingRisk === "low" ? "color-mix(in srgb, var(--color-success) 15%, transparent)" :
                 overheatingRisk === "medium" ? "color-mix(in srgb, var(--color-warning) 15%, transparent)" :
                 "color-mix(in srgb, var(--color-danger) 15%, transparent)";

  const riskMessages = {
    low: t.setupRiskLow,
    medium: t.setupRiskMedium,
    high: t.setupRiskHigh,
  };

  return (
    <div className="min-h-screen transition-theme" style={{ background: "var(--color-bg)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}
            >
              HM
            </div>
            <div>
              <h1 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                {t.setupPageTitle}
              </h1>
              <p className="text-xs" style={{ color: "var(--color-textMuted)" }}>
                {t.setupPageSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <a href="/mix" className="btn btn-ghost text-sm">
              {t.setupBackBtn}
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <div className="grid lg:grid-cols-[1fr,320px] gap-6">
          {/* Left Column */}
          <div className="space-y-6 stagger-children">
            {/* Mix Summary */}
            <section className="card card-elevated p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                <IconTarget size={20} color="var(--color-primary)" />
                {t.setupYourMix}
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="pill animate-scaleIn"
                    style={{
                      borderColor: it.color,
                      borderWidth: "2px",
                      animationDelay: `${idx * 50}ms`,
                    }}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: it.color, boxShadow: `0 0 8px ${it.color}` }}
                    />
                    <span style={{ color: "var(--color-text)" }}>{it.flavor}</span>
                    <span style={{ color: it.color }} className="font-semibold">{it.percent}%</span>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="stat-card">
                  <div className="mb-2" style={{ color: "var(--color-primary)" }}>
                    <IconStrength size={24} />
                  </div>
                  <div className="label">{t.setupStrength}</div>
                  <div className="value" style={{ color: "var(--color-text)" }}>{finalStrength}</div>
                </div>
                <div className="stat-card">
                  <div className="mb-2" style={{ color: "var(--color-warning)" }}>
                    <IconHeat size={24} />
                  </div>
                  <div className="label">{t.setupHeatResistance}</div>
                  <div className="value" style={{ color: "var(--color-text)" }}>{finalHeatLoad}</div>
                </div>
              </div>
            </section>

            {/* Risk Warning */}
            <section
              className="card card-elevated p-5"
              style={{ background: riskBg, borderColor: riskColor }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--color-bgCard)" }}
                >
                  {overheatingRisk === "low" ? (
                    <IconCheck size={28} color={riskColor} />
                  ) : (
                    <IconWarning size={28} color={riskColor} />
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-textMuted)" }}>
                    {t.setupOverheatRisk}
                  </p>
                  <p className="text-xl font-bold uppercase" style={{ color: riskColor }}>
                    {overheatingRisk}
                  </p>
                </div>
              </div>
              <p className="text-sm" style={{ color: "var(--color-text)" }}>
                {riskMessages[overheatingRisk]}
              </p>
            </section>

            {/* Setup Recommendations */}
            <section className="card card-elevated p-5">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                <IconSettings size={20} color="var(--color-primary)" />
                {t.setupRecommendedTitle}
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Bowl */}
                <div className="p-4 rounded-xl" style={{ background: "var(--color-bgHover)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--color-bgAccent)" }}
                    >
                      <IconBowl size={24} color="var(--color-primary)" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-textMuted)" }}>
                        {t.setupBowlType}
                      </p>
                      <p className="text-lg font-bold capitalize" style={{ color: "var(--color-text)" }}>
                        {setup.bowlType}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-textMuted)" }}>
                    {setup.bowlType === "phunnel"
                      ? t.setupBowlPhunnel
                      : t.setupBowlClassic}
                  </p>
                </div>

                {/* Packing */}
                <div className="p-4 rounded-xl" style={{ background: "var(--color-bgHover)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--color-bgAccent)" }}
                    >
                      <IconPacking size={24} color="var(--color-primary)" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-textMuted)" }}>
                        {t.setupPackType}
                      </p>
                      <p className="text-lg font-bold capitalize" style={{ color: "var(--color-text)" }}>
                        {setup.packing}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-textMuted)" }}>
                    {setup.packing === "classic"
                      ? t.setupPackClassic
                      : t.setupPackOverpack}
                  </p>
                </div>

                {/* Coals */}
                <div className="p-4 rounded-xl" style={{ background: "var(--color-bgHover)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--color-bgAccent)" }}
                    >
                      <IconCoals size={24} color="var(--color-warning)" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-textMuted)" }}>
                        {t.setupCoals}
                      </p>
                      <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                        {t.setupCoalsPcs(setup.coals)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-textMuted)" }}>
                    {setup.coals === 3
                      ? t.setupCoals3Tip
                      : t.setupCoals4Tip}
                  </p>
                </div>

                {/* Heat-up */}
                <div className="p-4 rounded-xl" style={{ background: "var(--color-bgHover)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--color-bgAccent)" }}
                    >
                      <IconTimer size={24} color="var(--color-primary)" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-textMuted)" }}>
                        {t.setupWarmup}
                      </p>
                      <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                        {t.setupWarmupMin(setup.heatUpMinutes)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-textMuted)" }}>
                    {t.setupWarmupTip}
                  </p>
                </div>
              </div>
            </section>

            {/* Pro Tips */}
            <section className="card card-elevated p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                <IconLightbulb size={20} color="var(--color-warning)" />
                {t.setupTipsTitle}
              </h2>
              <ul className="space-y-3">
                {finalStrength >= 7 && (
                  <li className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--color-bgHover)" }}>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "color-mix(in srgb, var(--color-danger) 20%, transparent)" }}
                    >
                      <IconStrength size={16} color="var(--color-danger)" />
                    </div>
                    <span className="text-sm" style={{ color: "var(--color-text)" }}>
                      {t.setupTipStrong}
                    </span>
                  </li>
                )}
                {overheatingRisk !== "low" && (
                  <li className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--color-bgHover)" }}>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "color-mix(in srgb, var(--color-warning) 20%, transparent)" }}
                    >
                      <IconHeat size={16} color="var(--color-warning)" />
                    </div>
                    <span className="text-sm" style={{ color: "var(--color-text)" }}>
                      {t.setupTipHeatMgmt}
                    </span>
                  </li>
                )}
                {setup.bowlType === "phunnel" && (
                  <li className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--color-bgHover)" }}>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "color-mix(in srgb, var(--color-primary) 20%, transparent)" }}
                    >
                      <IconBowl size={16} color="var(--color-primary)" />
                    </div>
                    <span className="text-sm" style={{ color: "var(--color-text)" }}>
                      {t.setupTipPhunnel}
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--color-bgHover)" }}>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "color-mix(in srgb, var(--color-success) 20%, transparent)" }}
                  >
                    <IconCoals size={16} color="var(--color-success)" />
                  </div>
                  <span className="text-sm" style={{ color: "var(--color-text)" }}>
                    {t.setupTipCoalRotation}
                  </span>
                </li>
              </ul>
            </section>
          </div>

          {/* Right Column - Compatibility */}
          <div className="space-y-6">
            <section className="card card-elevated lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                <IconPalette size={20} color="var(--color-primary)" />
                {t.setupCompatTitle}
              </h2>

              {/* Compatibility Ring */}
              <div className="flex justify-center mb-6">
                <ProgressRing
                  value={compatibility.score}
                  color={compatColor}
                  size={180}
                  strokeWidth={14}
                  label={t.setupCompatLabel}
                  sublabel={compatibility.level}
                />
              </div>

              {/* Details */}
              {compatibility.details.length > 0 && (
                <div className="space-y-2">
                  {compatibility.details.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-3 rounded-xl text-xs"
                      style={{ background: "var(--color-bgHover)" }}
                    >
                      <span style={{ color: compatColor }}>•</span>
                      <span style={{ color: "var(--color-text)" }}>{d}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Legend */}
              <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-xs mb-3" style={{ color: "var(--color-textMuted)" }}>
                  {t.setupCompatLevels}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: "var(--color-success)" }} />
                    <span style={{ color: "var(--color-textMuted)" }}>{t.setupCompatPerfect}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: "var(--color-primary)" }} />
                    <span style={{ color: "var(--color-textMuted)" }}>{t.setupCompatGood}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: "var(--color-warning)" }} />
                    <span style={{ color: "var(--color-textMuted)" }}>{t.setupCompatOkay}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: "var(--color-danger)" }} />
                    <span style={{ color: "var(--color-textMuted)" }}>{t.setupCompatBad}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Keyboard hint - hidden on mobile */}
      <div className="hidden lg:block fixed bottom-6 left-1/2 -translate-x-1/2 z-40 opacity-50 hover:opacity-100 transition-opacity">
        <div className="glass px-4 py-2 rounded-full text-xs flex items-center gap-3 border" style={{ borderColor: "var(--color-border)" }}>
          <span style={{ color: "var(--color-textMuted)" }}>{t.mixThemeLabel}</span>
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
    </div>
  );
}
