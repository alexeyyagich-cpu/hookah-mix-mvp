export type Locale = 'ru' | 'en' | 'de'

export const LOCALES: Locale[] = ['ru', 'en', 'de']

export const DEFAULT_LOCALE: Locale = 'ru'

export const LOCALE_LABELS: Record<Locale, { name: string; flag: string }> = {
  ru: { name: 'Русский', flag: '🇷🇺' },
  en: { name: 'English', flag: '🇬🇧' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
}
