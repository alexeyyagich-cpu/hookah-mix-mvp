'use client'

import { IconShop } from '@/components/Icons'
import { useTranslation } from '@/lib/i18n'

export default function MarketplacePage() {
  const t = useTranslation('manage')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <IconShop size={28} className="text-[var(--color-primary)]" />
        <h1 className="text-2xl font-bold">{t.marketplaceComingSoon}</h1>
      </div>

      <div className="card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
          <IconShop size={32} className="text-[var(--color-primary)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{t.marketplaceComingSoon}</h2>
        <p className="text-[var(--color-textMuted)] max-w-md mx-auto">
          {t.marketplaceComingSoonDesc}
        </p>
      </div>
    </div>
  )
}
