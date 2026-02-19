'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { Locale } from './types'
import { DEFAULT_LOCALE, LOCALES } from './types'
import { dictionaries, type Dictionary } from './dictionaries'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  dictionary: Dictionary
}

const LocaleContext = createContext<LocaleContextType | null>(null)

function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const lang = navigator.language.slice(0, 2)
  if (LOCALES.includes(lang as Locale)) return lang as Locale
  return DEFAULT_LOCALE
}

export function LocaleProvider({
  children,
  profileLocale,
}: {
  children: React.ReactNode
  profileLocale?: string | null
}) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // Initialize: profile > localStorage > browser > default
  useEffect(() => {
    if (profileLocale && LOCALES.includes(profileLocale as Locale)) {
      setLocaleState(profileLocale as Locale)
      localStorage.setItem('hookah-locale', profileLocale)
    } else {
      const saved = localStorage.getItem('hookah-locale') as Locale | null
      if (saved && LOCALES.includes(saved)) {
        setLocaleState(saved)
      } else {
        setLocaleState(detectBrowserLocale())
      }
    }
  }, [profileLocale])

  // Update html lang attribute
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('hookah-locale', newLocale)
  }, [])

  const dictionary = useMemo(() => dictionaries[locale], [locale])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, dictionary }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used within LocaleProvider')
  return context
}
