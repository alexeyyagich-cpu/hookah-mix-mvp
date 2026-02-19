'use client'

import { useOrganization, OrganizationContext } from '@/lib/hooks/useOrganization'

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const orgData = useOrganization()

  return (
    <OrganizationContext.Provider value={orgData}>
      {children}
    </OrganizationContext.Provider>
  )
}
