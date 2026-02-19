/**
 * Returns the locale-appropriate name for an item that has name (ru) and name_en fields.
 * For non-ru locales, returns name_en if available, otherwise falls back to name.
 */
export function getLocaleName(
  item: { name: string; name_en?: string | null },
  locale: string
): string {
  if (locale !== 'ru' && item.name_en) return item.name_en
  return item.name
}
