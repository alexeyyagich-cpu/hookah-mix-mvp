"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "@/lib/i18n";
import { TOBACCOS, CATEGORY_EMOJI, type Tobacco } from "@/data/tobaccos";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onResult: (tobaccos: Tobacco[]) => void;
};

// Shuffle array helper
const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Single Reel Component
function Reel({
  finalItem,
  isSpinning,
  stopDelay,
}: {
  items: Tobacco[];
  finalItem: Tobacco | null;
  isSpinning: boolean;
  stopDelay: number;
}) {
  const t = useTranslation("hookah");
  const [displayItems, setDisplayItems] = useState<Tobacco[]>([]);
  const [offset, setOffset] = useState(0);
  const animationRef = useRef<number | null>(null);
  const speedRef = useRef(0);

  const ITEM_HEIGHT = 90;
  const VISIBLE_ITEMS = 5;

  // Start spinning when isSpinning becomes true
  useEffect(() => {
    if (!isSpinning) {
      // Stop animation when parent says stop
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Create random items for spinning
    const spinItems: Tobacco[] = [];
    for (let i = 0; i < 40; i++) {
      spinItems.push(TOBACCOS[Math.floor(Math.random() * TOBACCOS.length)]);
    }
    setDisplayItems(spinItems);
    setOffset(0);
    speedRef.current = 22;

    let isRunning = true;

    // Animation loop
    const animate = () => {
      if (!isRunning) return;

      setOffset((prev) => {
        const totalHeight = spinItems.length * ITEM_HEIGHT;
        let newOffset = prev + speedRef.current;
        if (newOffset >= totalHeight - VISIBLE_ITEMS * ITEM_HEIGHT) {
          newOffset = 0;
        }
        return newOffset;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Schedule slowdown
    let slowDownId: ReturnType<typeof setInterval>;
    const slowdownTimer = setTimeout(() => {
      slowDownId = setInterval(() => {
        speedRef.current *= 0.92;
        if (speedRef.current < 1) {
          clearInterval(slowDownId);
        }
      }, 40);
    }, stopDelay);

    return () => {
      isRunning = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(slowdownTimer);
      clearInterval(slowDownId);
    };
  }, [isSpinning, stopDelay]);

  // Calculate which items to show
  const getVisibleItems = () => {
    if (displayItems.length === 0) return [];

    const startIndex = Math.floor(offset / ITEM_HEIGHT) % displayItems.length;
    const items: Tobacco[] = [];

    for (let i = 0; i < VISIBLE_ITEMS; i++) {
      const index = (startIndex + i) % displayItems.length;
      items.push(displayItems[index]);
    }

    return items;
  };

  const visibleItems = getVisibleItems();
  const subOffset = offset % ITEM_HEIGHT;

  // Show final result when: finalItem is set AND not spinning
  const shouldShowFinal = finalItem !== null && !isSpinning;

  return (
    <div
      className="relative w-[110px] h-36 rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)",
        border: "2px solid #444",
        boxShadow: "inset 0 0 30px rgba(0,0,0,0.9), 0 4px 15px rgba(0,0,0,0.5)",
      }}
    >
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {shouldShowFinal ? (
          // Final result with animation
          <div className="flex flex-col items-center justify-center animate-bounce-in">
            <div
              className="w-16 h-16 rounded-2xl mb-2 shrink-0 flex items-center justify-center text-4xl"
              style={{
                background: `linear-gradient(135deg, ${finalItem.color}40 0%, ${finalItem.color}20 100%)`,
                border: `2px solid ${finalItem.color}`,
                boxShadow: `0 0 20px ${finalItem.color}60`,
              }}
            >
              {CATEGORY_EMOJI[finalItem.category]}
            </div>
            <span className="text-sm font-bold text-white text-center px-1 leading-tight line-clamp-2">
              {finalItem.flavor}
            </span>
            <span className="text-[11px] text-[var(--color-textMuted)] font-medium">
              {finalItem.brand}
            </span>
          </div>
        ) : isSpinning && visibleItems.length > 0 ? (
          // Spinning items
          <div
            className="absolute w-full"
            style={{
              transform: `translateY(-${subOffset}px)`,
              top: `-${ITEM_HEIGHT * 1.5}px`,
            }}
          >
            {visibleItems.map((tobacco, i) => (
              <div
                key={`spin-${i}`}
                className="flex flex-col items-center justify-center shrink-0"
                style={{ height: ITEM_HEIGHT }}
              >
                <div
                  className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${tobacco.color}30 0%, ${tobacco.color}10 100%)`,
                    border: `2px solid ${tobacco.color}80`,
                  }}
                >
                  {CATEGORY_EMOJI[tobacco.category]}
                </div>
                <span className="text-[10px] text-[var(--color-textMuted)] text-center mt-1 truncate w-full px-1 font-medium">
                  {tobacco.flavor}
                </span>
              </div>
            ))}
          </div>
        ) : (
          // Idle state - show placeholder
          <div className="flex flex-col items-center justify-center text-[var(--color-textMuted)]">
            <span className="text-4xl mb-2">❓</span>
            <span className="text-xs">{t.mixSlotIdle}</span>
          </div>
        )}
      </div>

      {/* Center highlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.9) 100%)",
        }}
      />

      {/* Highlight line */}
      {isSpinning && (
        <div
          className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-20 pointer-events-none rounded-xl"
          style={{
            border: "2px solid rgba(245,158,11,0.6)",
            background: "linear-gradient(180deg, transparent 0%, rgba(245,158,11,0.1) 50%, transparent 100%)",
          }}
        />
      )}
    </div>
  );
}

export default function SlotMachine({ isOpen, onClose, onResult }: Props) {
  const t = useTranslation("hookah");
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelItems, setReelItems] = useState<Tobacco[][]>([[], [], []]);
  const [results, setResults] = useState<(Tobacco | null)[]>([null, null, null]);
  const [showResult, setShowResult] = useState(false);
  const spinTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Initialize reels + cleanup timers
  useEffect(() => {
    if (isOpen) {
      setReelItems([
        shuffleArray(TOBACCOS).slice(0, 15),
        shuffleArray(TOBACCOS).slice(0, 15),
        shuffleArray(TOBACCOS).slice(0, 15),
      ]);
      setResults([null, null, null]);
      setShowResult(false);
    }
    return () => { spinTimersRef.current.forEach(clearTimeout) };
  }, [isOpen]);

  const spin = useCallback(() => {
    if (isSpinning) return;

    // Reset
    setShowResult(false);
    setResults([null, null, null]);

    // New random items for reels
    setReelItems([
      shuffleArray(TOBACCOS).slice(0, 15),
      shuffleArray(TOBACCOS).slice(0, 15),
      shuffleArray(TOBACCOS).slice(0, 15),
    ]);

    // Pick 3 random unique tobaccos for result
    const shuffled = shuffleArray(TOBACCOS);
    const finalResults = shuffled.slice(0, 3);

    setIsSpinning(true);

    // Clear any previous timers
    spinTimersRef.current.forEach(clearTimeout);
    // Set results with delays
    spinTimersRef.current = [
      setTimeout(() => setResults((prev) => [finalResults[0], prev[1], prev[2]]), 1500),
      setTimeout(() => setResults((prev) => [prev[0], finalResults[1], prev[2]]), 2300),
      setTimeout(() => {
        setResults([finalResults[0], finalResults[1], finalResults[2]]);
        setIsSpinning(false);
        setShowResult(true);
      }, 3100),
    ];
  }, [isSpinning]);

  const handleConfirm = () => {
    const validResults = results.filter((r): r is Tobacco => r !== null);
    if (validResults.length === 3) {
      onResult(validResults);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm"
        onClick={!isSpinning ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-3xl p-6 animate-bounce-in"
          style={{
            background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
            border: "3px solid #F59E0B",
            boxShadow: "0 0 60px rgba(245, 158, 11, 0.3), inset 0 0 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 flex items-center justify-center gap-3">
              <span className="text-3xl animate-bounce">🎰</span>
              {t.mixSlotTitle}
              <span className="text-3xl animate-bounce" style={{ animationDelay: "0.1s" }}>🎰</span>
            </h2>
            <p className="text-sm text-[var(--color-textMuted)] mt-2">{t.mixSlotSubtitle}</p>
          </div>

          {/* Slot Reels */}
          <div className="flex gap-3 justify-center mb-6">
            {[0, 1, 2].map((index) => (
              <Reel
                key={index}
                items={reelItems[index]}
                finalItem={results[index]}
                isSpinning={isSpinning || results[index] === null && results.some((r, i) => i < index && r !== null)}
                stopDelay={1200 + index * 800}
              />
            ))}
          </div>

          {/* Result message */}
          {showResult && (
            <div className="text-center mb-4 animate-bounce-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-success)]/20 border border-[var(--color-success)]/50">
                <span className="text-2xl">🎉</span>
                <span className="text-lg font-bold text-[var(--color-success)]">
                  {t.mixSlotReady}
                </span>
                <span className="text-2xl">🎉</span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            {!showResult ? (
              <button type="button"
                onClick={spin}
                disabled={isSpinning}
                className={`
                  w-full py-4 rounded-2xl font-bold text-lg uppercase tracking-wider
                  transition-all duration-200
                  ${isSpinning
                    ? "bg-[var(--color-surface)] text-[var(--color-textMuted)] cursor-not-allowed"
                    : "bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-orange-500/50 active:scale-95"
                  }
                `}
              >
                {isSpinning ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">🎲</span>
                    {t.mixSlotSpinning}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    🎲 {t.mixSlotSpin} 🎲
                  </span>
                )}
              </button>
            ) : (
              <>
                <button type="button"
                  onClick={handleConfirm}
                  className="w-full py-4 rounded-2xl font-bold text-lg bg-[var(--color-success)] text-white hover:brightness-110 active:scale-95 transition-all"
                >
                  ✅ {t.mixSlotApply}
                </button>
                <button type="button"
                  onClick={spin}
                  className="w-full py-3 rounded-xl font-medium text-sm bg-[var(--color-surface)] text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)] transition-colors"
                >
                  🔄 {t.mixSlotSpinAgain}
                </button>
              </>
            )}

            {!isSpinning && !showResult && (
              <button type="button"
                onClick={onClose}
                className="text-sm text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors mt-2"
              >
                {t.mixSlotCancel}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
