'use client'

import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { useTranslation } from '@/lib/i18n'

interface LocationSelectorProps {
  value: string | null
  onChange: (locationId: string | null) => void
}

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const { locations } = useOrganizationContext()
  const tm = useTranslation('manage')

  // Don't render if single location
  if (locations.length <= 1) return null

  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-bgHover)] text-[var(--color-text)] border border-[var(--color-border)] transition-colors"
    >
      <option value="">{tm.allLocations}</option>
      {locations.map(loc => (
        <option key={loc.id} value={loc.id}>
          {loc.name}
        </option>
      ))}
    </select>
  )
}
