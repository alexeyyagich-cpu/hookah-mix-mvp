'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Locale } from './types'
import { DEFAULT_LOCALE, LOCALES } from './types'
import { getDictionary, setCachedDictionary, type Dictionary } from './dictionaries'

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

function resolveInitialLocale(profileLocale?: string | null): Locale {
  if (profileLocale && LOCALES.includes(profileLocale as Locale)) {
    return profileLocale as Locale
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('hookah-locale') as Locale | null
      if (saved && LOCALES.includes(saved)) return saved
    } catch { /* SSR or blocked storage */ }
  }
  return detectBrowserLocale()
}

export function LocaleProvider({
  children,
  profileLocale,
}: {
  children: React.ReactNode
  profileLocale?: string | null
}) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveInitialLocale(profileLocale))
  const [dictionary, setDictionary] = useState<Dictionary | null>(null)

  // Re-resolve when profile locale arrives (async auth)
  useEffect(() => {
    if (profileLocale && LOCALES.includes(profileLocale as Locale)) {
      setLocaleState(profileLocale as Locale)
      localStorage.setItem('hookah-locale', profileLocale)
    }
  }, [profileLocale])

  // Load dictionary when locale changes
  useEffect(() => {
    let cancelled = false
    getDictionary(locale).then(dict => {
      if (!cancelled) {
        setDictionary(dict)
        setCachedDictionary(dict)
      }
    })
    return () => { cancelled = true }
  }, [locale])

  // Update html lang attribute
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('hookah-locale', newLocale)
  }, [])

  // Don't render children until dictionary is loaded
  if (!dictionary) return null

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
