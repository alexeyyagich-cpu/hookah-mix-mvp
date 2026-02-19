'use client'

import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import type { Organization, Location, OrgMember, OrgRole } from '@/types/database'

// Demo data for testing
const DEMO_ORGANIZATION: Organization = {
  id: 'demo-org-id',
  name: 'Demo Lounge',
  slug: 'demo-lounge',
  logo_url: null,
  subscription_tier: 'pro',
  subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  stripe_customer_id: null,
  stripe_subscription_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const DEMO_LOCATION: Location = {
  id: 'demo-location-id',
  organization_id: 'demo-org-id',
  name: 'Demo Lounge',
  slug: 'main',
  address: 'ul. Nowy Swiat 42, Warsaw',
  phone: '+48 22 345 6789',
  locale: 'ru',
  timezone: 'Europe/Warsaw',
  active_modules: ['hookah', 'bar'],
  business_type: 'hookah_bar',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const DEMO_MEMBERSHIP: OrgMember = {
  id: 'demo-member-id',
  organization_id: 'demo-org-id',
  location_id: null,
  user_id: 'demo-user-id',
  role: 'owner',
  display_name: 'Demo User',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export interface UseOrganizationReturn {
  organization: Organization | null
  location: Location | null
  membership: OrgMember | null
  organizationId: string | null
  locationId: string | null
  orgRole: OrgRole | null
  loading: boolean
  error: string | null
  /** All locations for current org (for location switcher) */
  locations: Location[]
  /** Switch active location */
  switchLocation: (locationId: string) => void
  refresh: () => Promise<void>
}

// Context so child hooks can access org data without re-fetching
const OrganizationContext = createContext<UseOrganizationReturn | null>(null)

// Default value when used outside OrganizationProvider (e.g. /mix, /recommend pages)
// All hooks fall back to profile_id queries when organizationId is null
const NO_ORG: UseOrganizationReturn = {
  organization: null,
  location: null,
  membership: null,
  organizationId: null,
  locationId: null,
  orgRole: null,
  loading: false,
  error: null,
  locations: [],
  switchLocation: () => {},
  refresh: async () => {},
}

export function useOrganizationContext(): UseOrganizationReturn {
  const ctx = useContext(OrganizationContext)
  // Gracefully return defaults when outside OrganizationProvider
  return ctx || NO_ORG
}

export { OrganizationContext }

export function useOrganization(): UseOrganizationReturn {
  const { user, profile, isDemoMode } = useAuth()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null)
  const [membership, setMembership] = useState<OrgMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOrgData = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false)
      return
    }

    // Demo mode
    if (isDemoMode) {
      setOrganization(DEMO_ORGANIZATION)
      setLocations([DEMO_LOCATION])
      setActiveLocationId(DEMO_LOCATION.id)
      setMembership(DEMO_MEMBERSHIP)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Get user's org membership (active only)
      const { data: memberData, error: memberErr } = await supabase
        .from('org_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single()

      if (memberErr) {
        // No membership found or table doesn't exist yet (pre-migration)
        // Gracefully fall back to legacy profile-based data
        setOrganization(null)
        setMembership(null)
        setLocations([])
        setActiveLocationId(null)
        setLoading(false)
        return
      }

      setMembership(memberData as OrgMember)

      // 2. Load organization
      const { data: orgData, error: orgErr } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', memberData.organization_id)
        .single()

      if (orgErr) throw orgErr
      setOrganization(orgData as Organization)

      // 3. Load all locations for this org
      const { data: locData, error: locErr } = await supabase
        .from('locations')
        .select('*')
        .eq('organization_id', memberData.organization_id)
        .order('created_at', { ascending: true })

      if (locErr) throw locErr
      setLocations((locData || []) as Location[])

      // Set active location: member's assigned location, or first location
      const defaultLocId = memberData.location_id || (locData && locData.length > 0 ? locData[0].id : null)
      setActiveLocationId(prev => prev || defaultLocId)
    } catch (err) {
      console.error('Error loading organization:', err)
      setError(err instanceof Error ? err.message : 'Failed to load organization')
    } finally {
      setLoading(false)
    }
  }, [user, isDemoMode, supabase])

  useEffect(() => {
    loadOrgData()
  }, [loadOrgData])

  const activeLocation = useMemo(() => {
    return locations.find(l => l.id === activeLocationId) || locations[0] || null
  }, [locations, activeLocationId])

  const switchLocation = useCallback((locId: string) => {
    setActiveLocationId(locId)
  }, [])

  return {
    organization,
    location: activeLocation,
    membership,
    organizationId: organization?.id || null,
    locationId: activeLocation?.id || null,
    orgRole: membership?.role as OrgRole || null,
    loading,
    error,
    locations,
    switchLocation,
    refresh: loadOrgData,
  }
}
