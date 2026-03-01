'use client'

import { useTranslation } from '@/lib/i18n'
import type { BusinessType } from '@/lib/hooks/useOnboarding'

interface BusinessTypeStepProps {
  businessTypes: { type: BusinessType; icon: string; title: string; description: string; badge?: string }[]
  selectedType: BusinessType | null
  onSelectType: (type: BusinessType) => void
  onPrevStep: () => void
  onContinue: () => void
  saving: boolean
}

export function BusinessTypeStep({ businessTypes, selectedType, onSelectType, onPrevStep, onContinue, saving }: BusinessTypeStepProps) {
  const tc = useTranslation('common')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {businessTypes.map(bt => (
          <button type="button"
            key={bt.type}
            onClick={() => onSelectType(bt.type)}
            disabled={bt.type === 'restaurant'}
            className={`relative p-5 rounded-xl border-2 text-left transition-all ${
              selectedType === bt.type
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : bt.type === 'restaurant'
                  ? 'border-[var(--color-border)] opacity-50 cursor-not-allowed'
                  : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
            }`}
          >
            {bt.badge && (
              <span className="absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-bgHover)] text-[var(--color-textMuted)]">
                {bt.badge}
              </span>
            )}
            <div className="text-2xl mb-2">{bt.icon}</div>
            <div className="font-semibold">{bt.title}</div>
            <div className="text-xs text-[var(--color-textMuted)] mt-0.5">{bt.description}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onPrevStep} className="btn btn-ghost flex-1">
          {tc.back}
        </button>
        <button type="button"
          onClick={onContinue}
          disabled={!selectedType || saving}
          className="btn btn-primary flex-1 disabled:opacity-50"
        >
          {saving ? tc.saving : tc.next}
        </button>
      </div>
    </div>
  )
}
