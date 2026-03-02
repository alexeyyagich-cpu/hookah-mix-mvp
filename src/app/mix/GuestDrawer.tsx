"use client";

import { useTranslation } from "@/lib/i18n";
import { IconClose } from "@/components/Icons";
import { RecentGuests } from "@/components/guests/RecentGuests";
import type { TOBACCOS } from "@/data/tobaccos";
import type { MixSnapshot } from "@/types/database";

interface GuestDrawerProps {
  onClose: () => void;
  onRepeatMix: (snapshot: MixSnapshot, tobaccos: { tobacco: typeof TOBACCOS[0]; percent: number }[]) => void;
  isPro: boolean;
}

export function GuestDrawer({ onClose, onRepeatMix, isPro }: GuestDrawerProps) {
  const t = useTranslation('hookah');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-drawer-title"
        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-[70] overflow-y-auto animate-slideInRight"
        style={{
          background: "var(--color-bg)",
          borderLeft: "1px solid var(--color-border)",
        }}
      >
        <div className="sticky top-0 z-10 p-4 flex items-center justify-between border-b" style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}>
          <div>
            <h2 id="guest-drawer-title" className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              {t.mixQuickRepeat}
            </h2>
            <p className="text-xs" style={{ color: "var(--color-textMuted)" }}>
              {t.mixQuickRepeatHint}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.mixCloseQuickRepeat}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "var(--color-bgHover)", color: "var(--color-textMuted)" }}
          >
            <IconClose size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="p-4">
          <RecentGuests
            onRepeatMix={onRepeatMix}
            isPro={isPro}
          />
        </div>
      </div>
    </>
  );
}
