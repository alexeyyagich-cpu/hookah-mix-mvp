'use client'

interface PricingFeature {
  name: string
  included: boolean
  value?: string
}

interface PricingCardProps {
  name: string
  price: string
  period?: string
  description: string
  features: PricingFeature[]
  isPopular?: boolean
  isCurrent?: boolean
  onSelect: () => void
  buttonText?: string
}

export function PricingCard({
  name,
  price,
  period = '/мес',
  description,
  features,
  isPopular,
  isCurrent,
  onSelect,
  buttonText = 'Выбрать',
}: PricingCardProps) {
  return (
    <div
      className={`card relative p-6 flex flex-col ${
        isPopular ? 'border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/10' : ''
      }`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-full bg-[var(--color-primary)] text-[var(--color-bg)] text-xs font-semibold">
            Популярный
          </span>
        </div>
      )}

      {/* Current Badge */}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-full bg-[var(--color-success)] text-white text-xs font-semibold">
            Ваш тариф
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <p className="text-sm text-[var(--color-textMuted)] mb-4">{description}</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold">{price}</span>
          {price !== 'Бесплатно' && (
            <span className="text-[var(--color-textMuted)]">{period}</span>
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
      <button
        onClick={onSelect}
        disabled={isCurrent}
        className={`w-full py-3 rounded-xl font-semibold transition-all ${
          isPopular
            ? 'btn-primary'
            : isCurrent
            ? 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] cursor-not-allowed'
            : 'btn-ghost hover:bg-[var(--color-bgHover)]'
        }`}
      >
        {isCurrent ? 'Текущий тариф' : buttonText}
      </button>
    </div>
  )
}
