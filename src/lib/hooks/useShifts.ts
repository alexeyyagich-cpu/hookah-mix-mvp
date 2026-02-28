'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type { Shift, ShiftReconciliation } from '@/types/database'
import { translateError } from '@/lib/utils/translateError'
// Demo shifts — realistic week of data
const H = 60 * 60 * 1000
const D = 24 * H
const DEMO_SHIFTS: Shift[] = [
  {
    id: 'demo-shift-1',
    profile_id: 'demo',
    organization_id: null,
    location_id: null,
    opened_by: 'demo-staff-1',
    opened_by_name: 'Marek Zielinski',
    opened_at: new Date(Date.now() - 6 * D - 6 * H).toISOString(),
    closed_at: new Date(Date.now() - 6 * D + 2 * H).toISOString(),
    starting_cash: 150,
    closing_cash: 420,
    open_notes: null,
    close_notes: 'Quiet evening, 2 VIP tables',
    status: 'closed',
    created_at: new Date(Date.now() - 6 * D - 6 * H).toISOString(),
    updated_at: new Date(Date.now() - 6 * D + 2 * H).toISOString(),
  },
  {
    id: 'demo-shift-2',
    profile_id: 'demo',
    organization_id: null,
    location_id: null,
    opened_by: 'demo-staff-2',
    opened_by_name: 'Laura Fischer',
    opened_at: new Date(Date.now() - 5 * D - 6 * H).toISOString(),
    closed_at: new Date(Date.now() - 5 * D + 3 * H).toISOString(),
    starting_cash: 200,
    closing_cash: 685,
    open_notes: 'Friday, expecting busy night',
    close_notes: 'Full seating from 21:00, extra chairs needed',
    status: 'closed',
    created_at: new Date(Date.now() - 5 * D - 6 * H).toISOString(),
    updated_at: new Date(Date.now() - 5 * D + 3 * H).toISOString(),
  },
  {
    id: 'demo-shift-3',
    profile_id: 'demo',
    organization_id: null,
    location_id: null,
    opened_by: 'demo-staff-1',
    opened_by_name: 'Marek Zielinski',
    opened_at: new Date(Date.now() - 4 * D - 8 * H).toISOString(),
    closed_at: new Date(Date.now() - 4 * D + 1 * H).toISOString(),
    starting_cash: 200,
    closing_cash: 740,
    open_notes: 'Saturday, live DJ from 22:00',
    close_notes: 'Record revenue, ran out of Tangiers Cane Mint',
    status: 'closed',
    created_at: new Date(Date.now() - 4 * D - 8 * H).toISOString(),
    updated_at: new Date(Date.now() - 4 * D + 1 * H).toISOString(),
  },
  {
    id: 'demo-shift-4',
    profile_id: 'demo',
    organization_id: null,
    location_id: null,
    opened_by: 'demo-staff-3',
    opened_by_name: 'Oksana Koval',
    opened_at: new Date(Date.now() - 3 * D - 6 * H).toISOString(),
    closed_at: new Date(Date.now() - 3 * D + 1 * H).toISOString(),
    starting_cash: 150,
    closing_cash: 355,
    open_notes: null,
    close_notes: 'Sunday, quiet evening',
    status: 'closed',
    created_at: new Date(Date.now() - 3 * D - 6 * H).toISOString(),
    updated_at: new Date(Date.now() - 3 * D + 1 * H).toISOString(),
  },
  {
    id: 'demo-shift-5',
    profile_id: 'demo',
    organization_id: null,
    location_id: null,
    opened_by: 'demo-staff-2',
    opened_by_name: 'Laura Fischer',
    opened_at: new Date(Date.now() - 1 * D - 6 * H).toISOString(),
    closed_at: new Date(Date.now() - 1 * D + 2 * H).toISOString(),
    starting_cash: 200,
    closing_cash: 530,
    open_notes: null,
    close_notes: 'Two corporate events, good tips',
    status: 'closed',
    created_at: new Date(Date.now() - 1 * D - 6 * H).toISOString(),
    updated_at: new Date(Date.now() - 1 * D + 2 * H).toISOString(),
  },
  {
    id: 'demo-shift-6',
    profile_id: 'demo',
    organization_id: null,
    location_id: null,
    opened_by: 'demo-staff-1',
    opened_by_name: 'Marek Zielinski',
    opened_at: new Date(Date.now() - 3 * H).toISOString(),
    closed_at: null,
    starting_cash: 200,
    closing_cash: null,
    open_notes: 'Wednesday, expecting 3 reservations',
    close_notes: null,
    status: 'open',
    created_at: new Date(Date.now() - 3 * H).toISOString(),
    updated_at: new Date(Date.now() - 3 * H).toISOString(),
  },
]

interface OpenShiftInput {
  starting_cash?: number | null
  open_notes?: string | null
}

interface CloseShiftInput {
  closing_cash?: number | null
  close_notes?: string | null
}

interface UseShiftsReturn {
  shifts: Shift[]
  activeShift: Shift | null
  loading: boolean
  error: string | null
  openShift: (input?: OpenShiftInput) => Promise<Shift | null>
  closeShift: (shiftId: string, input?: CloseShiftInput) => Promise<boolean>
  getReconciliation: (shift: Shift) => Promise<ShiftReconciliation>
  refresh: () => Promise<void>
}

export function useShifts(): UseShiftsReturn {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile, isDemoMode } = useAuth()
  const { organizationId, locationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])
  const fetchIdRef = useRef(0)

  // Effective profile ID: staff uses owner's ID (legacy fallback)
  const effectiveProfileId = useMemo(() => {
    return profile?.owner_profile_id || user?.id || null
  }, [user, profile])

  // Demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setShifts(DEMO_SHIFTS)
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchShifts = useCallback(async () => {
    if (!effectiveProfileId || !supabase) {
      setShifts([])
      setLoading(false)
      return
    }

    const fetchId = ++fetchIdRef.current
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('shifts')
      .select('id, profile_id, organization_id, location_id, opened_by, opened_by_name, opened_at, closed_at, starting_cash, closing_cash, open_notes, close_notes, status, created_at, updated_at')
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || effectiveProfileId)
      .order('opened_at', { ascending: false })
      .limit(50)

    if (fetchId !== fetchIdRef.current) return // stale

    if (fetchError) {
      setError(translateError(fetchError))
      setShifts([])
      setLoading(false)
      return
    }

    setShifts(data || [])
    setLoading(false)
  }, [effectiveProfileId, supabase, organizationId])

  useEffect(() => {
    if (isDemoMode) return
    fetchShifts()
  }, [fetchShifts, isDemoMode])

  const activeShift = useMemo(
    () => shifts.find(s => s.status === 'open') || null,
    [shifts]
  )

  const openShift = useCallback(async (input?: OpenShiftInput): Promise<Shift | null> => {
    if (!effectiveProfileId || !user) return null

    const shiftData = {
      profile_id: effectiveProfileId,
      opened_by: user.id,
      ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
      starting_cash: input?.starting_cash ?? null,
      open_notes: input?.open_notes ?? null,
    }

    if (isDemoMode || !supabase) {
      // Check for existing open shift
      if (shifts.some(s => s.status === 'open')) {
        setError('shiftAlreadyOpen')
        return null
      }
      const newShift: Shift = {
        ...shiftData,
        id: `demo-shift-${Date.now()}`,
        organization_id: null,
        location_id: null,
        opened_at: new Date().toISOString(),
        closed_at: null,
        closing_cash: null,
        close_notes: null,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setShifts(prev => [newShift, ...prev])
      setError(null)
      return newShift
    }

    const { data, error: insertError } = await supabase
      .from('shifts')
      .insert(shiftData)
      .select()
      .single()

    if (insertError) {
      // Unique constraint violation = shift already open
      if (insertError.code === '23505') {
        setError('shiftAlreadyOpen')
      } else {
        setError(translateError(insertError))
      }
      return null
    }

    setShifts(prev => [data, ...prev])
    setError(null)
    return data
  }, [effectiveProfileId, user, isDemoMode, supabase, organizationId, locationId, shifts])

  const closeShift = useCallback(async (shiftId: string, input?: CloseShiftInput): Promise<boolean> => {
    const now = new Date().toISOString()
    const updates = {
      closed_at: now,
      closing_cash: input?.closing_cash ?? null,
      close_notes: input?.close_notes ?? null,
      status: 'closed' as const,
      updated_at: now,
    }

    if (isDemoMode || !supabase) {
      setShifts(prev => prev.map(s =>
        s.id === shiftId ? { ...s, ...updates } : s
      ))
      return true
    }

    const { error: updateError } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', shiftId)

    if (updateError) {
      setError(translateError(updateError))
      return false
    }

    setError(null)
    setShifts(prev => prev.map(s =>
      s.id === shiftId ? { ...s, ...updates } : s
    ))
    return true
  }, [isDemoMode, supabase])

  // Fetch reconciliation data on-demand instead of via heavy hooks
  // This avoids mounting useSessions/useBarSales/useKDS/useInventory/useTeam unconditionally,
  // and correctly queries ALL KDS orders (including served/cancelled) for the shift period.
  const getReconciliation = useCallback(async (shift: Shift): Promise<ShiftReconciliation> => {
    const start = shift.opened_at
    const end = shift.closed_at || new Date().toISOString()
    const ownerFilter = organizationId
      ? { key: 'organization_id', value: organizationId }
      : { key: 'profile_id', value: effectiveProfileId! }

    const emptyResult: ShiftReconciliation = {
      hookah: { sessionsCount: 0, totalGrams: 0, avgCompatibility: null, topTobaccos: [], tobaccoCost: 0, revenue: 0, profit: 0 },
      bar: { salesCount: 0, totalRevenue: 0, totalCost: 0, profit: 0, marginPercent: null, topCocktails: [] },
      kds: { totalOrders: 0, byStatus: {}, avgCompletionMinutes: null },
      cash: { startingCash: shift.starting_cash || 0, barRevenue: 0, hookahRevenue: 0, expectedCash: shift.starting_cash || 0, actualCash: shift.closing_cash, difference: shift.closing_cash !== null ? shift.closing_cash - (shift.starting_cash || 0) : null },
      payroll: null,
      tips: { count: 0, total: 0 },
    }

    if (isDemoMode || !supabase || !effectiveProfileId) {
      // Return realistic demo reconciliation for closed shifts
      if (shift.status === 'closed' && shift.closing_cash !== null) {
        const shiftDurationMs = new Date(end).getTime() - new Date(start).getTime()
        const hoursWorked = Math.round((shiftDurationMs / 3600000) * 100) / 100
        const hookahRevenue = Math.round((shift.closing_cash - (shift.starting_cash || 0)) * 0.55)
        const barRevenue = Math.round((shift.closing_cash - (shift.starting_cash || 0)) * 0.35)
        const tobaccoCost = Math.round(hookahRevenue * 0.25)
        const barCost = Math.round(barRevenue * 0.3)
        return {
          hookah: {
            sessionsCount: Math.round(hoursWorked * 1.2),
            totalGrams: Math.round(hoursWorked * 1.2) * 18,
            avgCompatibility: 86,
            topTobaccos: [
              { brand: 'Musthave', flavor: 'Pinkman', grams: 45 },
              { brand: 'Darkside', flavor: 'Supernova', grams: 32 },
              { brand: 'Tangiers', flavor: 'Cane Mint', grams: 28 },
            ],
            tobaccoCost,
            revenue: hookahRevenue,
            profit: hookahRevenue - tobaccoCost,
          },
          bar: {
            salesCount: Math.round(hoursWorked * 3),
            totalRevenue: barRevenue,
            totalCost: barCost,
            profit: barRevenue - barCost,
            marginPercent: 70,
            topCocktails: [
              { name: 'Mojito', count: 5, revenue: 45 },
              { name: 'Aperol Spritz', count: 4, revenue: 36 },
              { name: 'Gin & Tonic', count: 3, revenue: 24 },
            ],
          },
          kds: {
            totalOrders: Math.round(hoursWorked * 2.5),
            byStatus: { served: Math.round(hoursWorked * 2), cancelled: 1 },
            avgCompletionMinutes: 4.2,
          },
          cash: {
            startingCash: shift.starting_cash || 0,
            barRevenue,
            hookahRevenue,
            expectedCash: (shift.starting_cash || 0) + barRevenue + hookahRevenue,
            actualCash: shift.closing_cash,
            difference: shift.closing_cash - ((shift.starting_cash || 0) + barRevenue + hookahRevenue),
          },
          payroll: {
            staffName: shift.opened_by_name || 'Staff',
            hoursWorked,
            hourlyRate: 12,
            basePay: Math.round(hoursWorked * 12 * 100) / 100,
            commissionPercent: 5,
            commissionPay: Math.round((barRevenue + hookahRevenue) * 0.05 * 100) / 100,
            totalPay: Math.round((hoursWorked * 12 + (barRevenue + hookahRevenue) * 0.05) * 100) / 100,
          },
          tips: { count: 3, total: 18 },
        }
      }
      return emptyResult
    }

    // Fetch all needed data in parallel — includes ALL statuses for KDS
    const [sessionsRes, salesRes, kdsRes, inventoryRes, teamRes] = await Promise.all([
      supabase.from('sessions').select('id, profile_id, selling_price, total_grams, compatibility_score, session_date, session_items(tobacco_id, brand, flavor, grams_used)').eq(ownerFilter.key, ownerFilter.value).gte('session_date', start).lte('session_date', end),
      supabase.from('bar_sales').select('id, profile_id, recipe_name, quantity, total_revenue, total_cost, margin_percent, sold_at').eq(ownerFilter.key, ownerFilter.value).gte('sold_at', start).lte('sold_at', end),
      supabase.from('kds_orders').select('id, status, created_at, completed_at').eq(ownerFilter.key, ownerFilter.value).gte('created_at', start).lte('created_at', end),
      supabase.from('tobacco_inventory').select('tobacco_id, purchase_price, package_grams').eq(ownerFilter.key, ownerFilter.value),
      supabase.from('org_members').select('user_id, display_name, hourly_rate, sales_commission_percent').eq('organization_id', organizationId || ''),
    ])

    const sessions = sessionsRes.data || []
    const sales = salesRes.data || []
    const kdsOrders = kdsRes.data || []
    const tobaccoInventory = inventoryRes.data || []
    const teamMembers = teamRes.data || []

    // --- HOOKAH ---
    let totalGrams = 0
    let totalTobaccoCost = 0
    let hookahRevenue = 0
    const tobaccoUsage: Record<string, { brand: string; flavor: string; grams: number }> = {}
    const compatScores: number[] = []

    for (const session of sessions) {
      if (session.compatibility_score !== null) {
        compatScores.push(session.compatibility_score)
      }
      if (session.selling_price) {
        hookahRevenue += session.selling_price
      }
      totalGrams += session.total_grams
      for (const item of session.session_items || []) {
        const key = `${item.brand}:${item.flavor}`
        if (!tobaccoUsage[key]) {
          tobaccoUsage[key] = { brand: item.brand, flavor: item.flavor, grams: 0 }
        }
        tobaccoUsage[key].grams += item.grams_used
        const inv = tobaccoInventory.find((i: { tobacco_id: string; purchase_price: number | null; package_grams: number | null }) => i.tobacco_id === item.tobacco_id)
        if (inv?.purchase_price && inv?.package_grams && inv.package_grams > 0) {
          totalTobaccoCost += item.grams_used * (inv.purchase_price / inv.package_grams)
        }
      }
    }

    const topTobaccos = Object.values(tobaccoUsage)
      .sort((a, b) => b.grams - a.grams)
      .slice(0, 5)

    // --- BAR ---
    const barRevenue = sales.reduce((sum: number, s: { total_revenue: number }) => sum + s.total_revenue, 0)
    const barCost = sales.reduce((sum: number, s: { total_cost: number }) => sum + s.total_cost, 0)
    const barSalesCount = sales.reduce((sum: number, s: { quantity: number }) => sum + s.quantity, 0)
    const barProfit = barRevenue - barCost
    const margins = sales.map((s: { margin_percent: number | null }) => s.margin_percent).filter((m: number | null): m is number => m !== null)
    const barAvgMargin = margins.length > 0 ? margins.reduce((a: number, b: number) => a + b, 0) / margins.length : null

    const cocktailMap = new Map<string, { count: number; revenue: number }>()
    for (const s of sales) {
      const existing = cocktailMap.get(s.recipe_name) || { count: 0, revenue: 0 }
      cocktailMap.set(s.recipe_name, {
        count: existing.count + s.quantity,
        revenue: existing.revenue + s.total_revenue,
      })
    }
    const topCocktails = Array.from(cocktailMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // --- KDS (all statuses including served/cancelled) ---
    const kdsByStatus: Record<string, number> = {}
    let totalCompletionMs = 0
    let completedCount = 0
    for (const o of kdsOrders) {
      kdsByStatus[o.status] = (kdsByStatus[o.status] || 0) + 1
      if (o.completed_at) {
        totalCompletionMs += new Date(o.completed_at).getTime() - new Date(o.created_at).getTime()
        completedCount++
      }
    }

    // --- PAYROLL ---
    const staffMember = teamMembers.find((m: { user_id: string }) => m.user_id === shift.opened_by)
    let payrollData: ShiftReconciliation['payroll'] = null
    if (staffMember && (staffMember.hourly_rate > 0 || staffMember.sales_commission_percent > 0)) {
      const shiftDurationMs = (shift.closed_at ? new Date(shift.closed_at).getTime() : Date.now()) - new Date(shift.opened_at).getTime()
      const hoursWorked = Math.round((shiftDurationMs / 3600000) * 100) / 100
      const basePay = Math.round(hoursWorked * staffMember.hourly_rate * 100) / 100
      const totalShiftRevenue = barRevenue + hookahRevenue
      const commissionPay = Math.round(totalShiftRevenue * staffMember.sales_commission_percent / 100 * 100) / 100
      payrollData = {
        staffName: staffMember.display_name,
        hoursWorked,
        hourlyRate: staffMember.hourly_rate,
        basePay,
        commissionPercent: staffMember.sales_commission_percent,
        commissionPay,
        totalPay: Math.round((basePay + commissionPay) * 100) / 100,
      }
    }

    // --- CASH ---
    const startingCash = shift.starting_cash || 0
    const hookahRevenueRounded = Math.round(hookahRevenue * 100) / 100
    const expectedCash = startingCash + barRevenue + hookahRevenueRounded

    return {
      hookah: {
        sessionsCount: sessions.length,
        totalGrams,
        avgCompatibility: compatScores.length > 0
          ? Math.round(compatScores.reduce((a, b) => a + b, 0) / compatScores.length)
          : null,
        topTobaccos,
        tobaccoCost: Math.round(totalTobaccoCost * 100) / 100,
        revenue: hookahRevenueRounded,
        profit: Math.round((hookahRevenue - totalTobaccoCost) * 100) / 100,
      },
      bar: {
        salesCount: barSalesCount,
        totalRevenue: Math.round(barRevenue * 100) / 100,
        totalCost: Math.round(barCost * 100) / 100,
        profit: Math.round(barProfit * 100) / 100,
        marginPercent: barAvgMargin !== null ? Math.round(barAvgMargin * 10) / 10 : null,
        topCocktails,
      },
      kds: {
        totalOrders: kdsOrders.length,
        byStatus: kdsByStatus,
        avgCompletionMinutes: completedCount > 0
          ? Math.round((totalCompletionMs / completedCount) / 60000 * 10) / 10
          : null,
      },
      cash: {
        startingCash,
        barRevenue: Math.round(barRevenue * 100) / 100,
        hookahRevenue: hookahRevenueRounded,
        expectedCash: Math.round(expectedCash * 100) / 100,
        actualCash: shift.closing_cash,
        difference: shift.closing_cash !== null
          ? Math.round((shift.closing_cash - expectedCash) * 100) / 100
          : null,
      },
      payroll: payrollData,
      tips: { count: 0, total: 0 },
    }
  }, [isDemoMode, supabase, effectiveProfileId, organizationId])

  return {
    shifts,
    activeShift,
    loading,
    error,
    openShift,
    closeShift,
    getReconciliation,
    refresh: fetchShifts,
  }
}
