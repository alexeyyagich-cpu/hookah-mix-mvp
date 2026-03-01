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
}

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
}: PricingCardProps) {
  const tc = useTranslation('common')
  const resolvedButtonText = buttonText ?? tc.pricing.select
  return (
    <div
      className={`card relative p-6 flex flex-col ${
        isPopular ? 'border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/10' : ''
      }`}
    >
      {/* Popular Badge */}
      {isPopular && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-full bg-[var(--color-primary)] text-[var(--color-bg)] text-xs font-semibold">
            {tc.pricing.popular}
          </span>
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
      </div>

      {/* Features */}
      <ul className="space-y-3 flex-1 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            {feature.included ? (
              <span className="text-[var(--color-success)] mt-0.5">✓</span>
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
      <button type="button"
        onClick={onSelect}
        disabled={isCurrent || isLoading}
        className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
          isPopular && !isCurrent
            ? 'btn-primary'
            : isCurrent
            ? 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] cursor-not-allowed'
            : 'btn-ghost hover:bg-[var(--color-bgHover)]'
        } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
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
