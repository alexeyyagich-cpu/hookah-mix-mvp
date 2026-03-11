'use client'

import { useTranslation } from '@/lib/i18n'

interface PricingFeature {
  name: string
  included: boolean
  value?: string
}

interface PricingCardProps {
  name: string
  price: string
  monthlyPrice?: string | null
  description: string
  features: PricingFeature[]
  isPopular?: boolean
  isCurrent?: boolean
  isLoading?: boolean
  onSelect: () => void
  buttonText?: string
  savingsBadge?: string | null
  highlight?: boolean
  accentMint?: boolean
}

const MINT = '#00E6B4'
const MINT_BG = 'rgba(0, 230, 180, 0.1)'

export function PricingCard({
  name,
  price,
  monthlyPrice,
  description,
  features,
  isPopular,
  isCurrent,
  isLoading,
  onSelect,
  buttonText,
  savingsBadge,
  highlight,
  accentMint,
}: PricingCardProps) {
  const tc = useTranslation('common')
  const resolvedButtonText = buttonText ?? tc.pricing.select
  const isHighlighted = isPopular || highlight

  const borderClass = isHighlighted
    ? accentMint
      ? 'border-[#00E6B4] shadow-lg shadow-[#00E6B4]/15'
      : 'border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/10'
    : ''

  const scaleClass = highlight ? 'scale-[1.10] z-10' : ''

  return (
    <div className={`card relative p-6 flex flex-col transition-transform ${borderClass} ${scaleClass}`}>
      {/* Popular Badge */}
      {isPopular && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          {accentMint ? (
            <span
              className="px-4 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ backgroundColor: MINT, color: '#0E0F11' }}
            >
              {tc.pricing.popular}
            </span>
          ) : (
            <span className="px-4 py-1 rounded-full bg-[var(--color-primary)] text-[var(--color-bg)] text-xs font-semibold whitespace-nowrap">
              {tc.pricing.popular}
            </span>
          )}
        </div>
      )}

      {/* Current Badge */}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-full bg-[var(--color-success)] text-[var(--color-bg)] text-xs font-semibold">
            {tc.pricing.currentPlan}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <p className="text-sm text-[var(--color-textMuted)] mb-4">{description}</p>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold">{price}</span>
          {monthlyPrice && (
            <span className="text-sm text-[var(--color-textMuted)] mt-1">
              {monthlyPrice}
            </span>
          )}
        </div>
        {savingsBadge && (
          <div className="mt-3">
            {accentMint ? (
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: MINT_BG, color: MINT }}
              >
                {savingsBadge}
              </span>
            ) : (
              <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] text-xs font-semibold">
                {savingsBadge}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 flex-1 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            {feature.included ? (
              <span className="mt-0.5" style={accentMint ? { color: MINT } : { color: 'var(--color-success)' }}>
                ✓
              </span>
            ) : (
              <span className="text-[var(--color-textMuted)] mt-0.5">✕</span>
            )}
            <span className={feature.included ? '' : 'text-[var(--color-textMuted)]'}>
              {feature.name}
              {feature.value && (
                <span className="ml-1 font-medium">{feature.value}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* Button */}
      <button
        type="button"
        onClick={onSelect}
        disabled={isCurrent || isLoading}
        className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
          isCurrent
            ? 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] cursor-not-allowed'
            : isHighlighted && !accentMint
              ? 'btn-primary'
              : !isHighlighted
                ? 'btn-ghost hover:bg-[var(--color-bgHover)]'
                : ''
        } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
        style={isHighlighted && accentMint && !isCurrent ? { backgroundColor: MINT, color: '#0E0F11' } : undefined}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {tc.loading}
          </>
        ) : (
          resolvedButtonText
        )}
      </button>
    </div>
  )
}
