'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { useSessions } from '@/lib/hooks/useSessions'
import { useBarSales } from '@/lib/hooks/useBarSales'
import { useKDS } from '@/lib/hooks/useKDS'
import { useInventory } from '@/lib/hooks/useInventory'
import { useTeam } from '@/lib/hooks/useTeam'
import type { Shift, ShiftReconciliation } from '@/types/database'

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
  getReconciliation: (shift: Shift) => ShiftReconciliation
  refresh: () => Promise<void>
}

export function useShifts(): UseShiftsReturn {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile, isDemoMode } = useAuth()
  const { organizationId, locationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  const { sessions } = useSessions()
  const { sales } = useBarSales()
  const { orders: kdsOrders } = useKDS()
  const { inventory: tobaccoInventory } = useInventory()
  const { members: teamMembers } = useTeam()

  // Effective profile ID: staff uses owner's ID
  const effectiveProfileId = useMemo(() => {
    if (profile?.role === 'staff' && profile.owner_profile_id) {
      return profile.owner_profile_id
    }
    return user?.id || null
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

    setError(null)

    const { data, error: fetchError } = await supabase
      .from('shifts')
      .select('*')
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || effectiveProfileId)
      .order('opened_at', { ascending: false })
      .limit(50)

    if (fetchError) {
      setError(fetchError.message)
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
        setError(insertError.message)
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
      setError(updateError.message)
      return false
    }

    setShifts(prev => prev.map(s =>
      s.id === shiftId ? { ...s, ...updates } : s
    ))
    return true
  }, [isDemoMode, supabase])

  const getReconciliation = useCallback((shift: Shift): ShiftReconciliation => {
    const start = new Date(shift.opened_at)
    const end = shift.closed_at ? new Date(shift.closed_at) : new Date()

    // --- HOOKAH ---
    const shiftSessions = sessions.filter(s => {
      const d = new Date(s.session_date)
      return d >= start && d <= end
    })

    let totalGrams = 0
    let totalTobaccoCost = 0
    let hookahRevenue = 0
    const tobaccoUsage: Record<string, { brand: string; flavor: string; grams: number }> = {}
    const compatScores: number[] = []

    for (const session of shiftSessions) {
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
        const inv = tobaccoInventory.find(i => i.tobacco_id === item.tobacco_id)
        if (inv?.purchase_price && inv?.package_grams && inv.package_grams > 0) {
          totalTobaccoCost += item.grams_used * (inv.purchase_price / inv.package_grams)
        }
      }
    }

    const topTobaccos = Object.values(tobaccoUsage)
      .sort((a, b) => b.grams - a.grams)
      .slice(0, 5)

    // --- BAR ---
    const shiftSales = sales.filter(s => {
      const d = new Date(s.sold_at)
      return d >= start && d <= end
    })

    const barRevenue = shiftSales.reduce((sum, s) => sum + s.total_revenue, 0)
    const barCost = shiftSales.reduce((sum, s) => sum + s.total_cost, 0)
    const barSalesCount = shiftSales.reduce((sum, s) => sum + s.quantity, 0)
    const barProfit = barRevenue - barCost
    const margins = shiftSales.map(s => s.margin_percent).filter((m): m is number => m !== null)
    const barAvgMargin = margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : null

    const cocktailMap = new Map<string, { count: number; revenue: number }>()
    for (const s of shiftSales) {
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

    // --- KDS ---
    const shiftKdsOrders = kdsOrders.filter(o => {
      const d = new Date(o.created_at)
      return d >= start && d <= end
    })

    const kdsByStatus: Record<string, number> = {}
    let totalCompletionMs = 0
    let completedCount = 0
    for (const o of shiftKdsOrders) {
      kdsByStatus[o.status] = (kdsByStatus[o.status] || 0) + 1
      if (o.completed_at) {
        totalCompletionMs += new Date(o.completed_at).getTime() - new Date(o.created_at).getTime()
        completedCount++
      }
    }

    // --- PAYROLL ---
    const staffMember = teamMembers.find(m => m.user_id === shift.opened_by)
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
        sessionsCount: shiftSessions.length,
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
        totalOrders: shiftKdsOrders.length,
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
  }, [sessions, sales, kdsOrders, tobaccoInventory, teamMembers])

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
