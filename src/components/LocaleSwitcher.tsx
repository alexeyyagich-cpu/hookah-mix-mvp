'use client'

import { useLocale } from '@/lib/i18n'
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/types'

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="flex items-center gap-1 text-lg">
      {LOCALES.map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          className={`transition-opacity ${locale === loc ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
          aria-label={LOCALE_LABELS[loc].name}
        >
          {LOCALE_LABELS[loc].flag}
        </button>
      ))}
    </div>
  )
}
