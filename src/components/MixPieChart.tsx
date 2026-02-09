"use client";

import React from "react";
import type { MixItem } from "@/logic/mixCalculator";

type Props = {
  items: MixItem[];
  size?: number;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

export default function MixPieChart({ items, size = 200 }: Props) {
  const r = size / 2;
  const cx = r;
  const cy = r;

  const slices = items.filter(i => i.percent > 0);

  let currentAngle = 0;
  const paths = slices.map((it) => {
    const sliceAngle = (it.percent / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    return {
      id: it.tobacco.id,
      d: describeArc(cx, cy, r, startAngle, endAngle),
      color: it.tobacco.color,
      label: it.tobacco.flavor,
      percent: it.percent,
      brand: it.tobacco.brand,
    };
  });

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* SVG Chart */}
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-label="Mix pie chart"
          className="drop-shadow-lg"
        >
          {/* Glow filter */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background circle */}
          <circle
            cx={cx}
            cy={cy}
            r={r - 2}
            fill="var(--color-bgCard)"
            stroke="var(--color-border)"
            strokeWidth="2"
          />

          {/* Pie slices */}
          {paths.map((p, i) => (
            <path
              key={p.id}
              d={p.d}
              fill={p.color}
              stroke="var(--color-bgCard)"
              strokeWidth="3"
              className="transition-all duration-300 hover:opacity-80"
              style={{
                filter: "url(#glow)",
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}

          {/* Center hole (donut effect) */}
          <circle
            cx={cx}
            cy={cy}
            r={size * 0.28}
            fill="var(--color-bgCard)"
            stroke="var(--color-border)"
            strokeWidth="2"
          />

          {/* Center text */}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--color-textMuted)"
            style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            MIX
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--color-text)"
            style={{ fontSize: 18, fontWeight: 700 }}
          >
            {items.length}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="w-full space-y-2">
        {paths.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-2 rounded-lg transition-all hover:scale-[1.02]"
            style={{ background: `color-mix(in srgb, ${p.color} 10%, var(--color-bgHover))` }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full shadow-lg"
                style={{
                  backgroundColor: p.color,
                  boxShadow: `0 0 8px ${p.color}`,
                }}
              />
              <div>
                <div className="text-sm font-medium" style={{ color: `var(--color-text)` }}>
                  {p.label}
                </div>
                <div className="text-xs" style={{ color: `var(--color-textMuted)` }}>
                  {p.brand}
                </div>
              </div>
            </div>
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: p.color }}
            >
              {p.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
