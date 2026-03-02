"use client";

import { useRef } from "react";
import { useTranslation } from "@/lib/i18n";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import type { MixItem, MixResult } from "@/logic/mixCalculator";


interface MasterCardProps {
  items: MixItem[];
  result: MixResult;
  onClose: () => void;
}

export function MasterCard({ items, result, onClose }: MasterCardProps) {
  const t = useTranslation('hookah');
  const tc = useTranslation('common');
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true, onClose);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="master-card-title"
        className="w-full max-w-sm rounded-3xl p-6 animate-fadeInUp"
        style={{ background: 'var(--color-bgCard)', border: '1px solid var(--color-border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <p id="master-card-title" className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {t.guestMixSummary}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-textMuted)' }}>
            {t.guestCompatibilityShare}: <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>{result.compatibility.score}%</span>
          </p>
        </div>

        {/* Tobaccos */}
        <div className="space-y-3 mb-5">
          {items.map(it => (
            <div key={it.tobacco.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-bgHover)' }}>
              <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: it.tobacco.color }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{it.tobacco.flavor}</p>
                <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>{it.tobacco.brand}</p>
              </div>
              <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{it.percent}%</span>
            </div>
          ))}
        </div>

        {/* Setup summary */}
        <div className="grid grid-cols-2 gap-2 mb-5 text-xs">
          <div className="p-2 rounded-lg text-center" style={{ background: 'var(--color-bgHover)' }}>
            <p style={{ color: 'var(--color-textMuted)' }}>{t.mixBowlLabel}</p>
            <p className="font-semibold capitalize" style={{ color: 'var(--color-text)' }}>{result.setup.bowlType}</p>
          </div>
          <div className="p-2 rounded-lg text-center" style={{ background: 'var(--color-bgHover)' }}>
            <p style={{ color: 'var(--color-textMuted)' }}>{t.mixPackLabel}</p>
            <p className="font-semibold capitalize" style={{ color: 'var(--color-text)' }}>{result.setup.packing}</p>
          </div>
          <div className="p-2 rounded-lg text-center" style={{ background: 'var(--color-bgHover)' }}>
            <p style={{ color: 'var(--color-textMuted)' }}>{t.mixCoalsLabel}</p>
            <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{result.setup.coals} {t.mixCoalsPcs}</p>
          </div>
          <div className="p-2 rounded-lg text-center" style={{ background: 'var(--color-bgHover)' }}>
            <p style={{ color: 'var(--color-textMuted)' }}>{t.mixHeatUpLabel}</p>
            <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{result.setup.heatUpMinutes} {t.mixHeatUpMin}</p>
          </div>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
        >
          {tc.ok}
        </button>
      </div>
    </div>
  );
}
