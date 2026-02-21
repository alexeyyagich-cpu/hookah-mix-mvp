'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import type { LoyaltySettings, BonusTransaction, LoyaltyTier, Guest } from '@/types/database'

const DEFAULT_SETTINGS: LoyaltySettings = {
  id: 'demo',
  profile_id: 'demo',
  bonus_accrual_percent: 5,
  bonus_max_redemption_percent: 30,
  tier_silver_threshold: 500,
  tier_gold_threshold: 2000,
  tier_silver_discount: 5,
  tier_gold_discount: 10,
  is_enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const DEMO_TRANSACTIONS: BonusTransaction[] = [
  {
    id: 'bt1',
    guest_id: '1',
    profile_id: 'demo',
    type: 'accrual',
    amount: 1.25,
    balance_after: 25.50,
    related_session_id: null,
    description: 'Session bonus (5%)',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bt2',
    guest_id: '4',
    profile_id: 'demo',
    type: 'accrual',
    amount: 1.50,
    balance_after: 45,
    related_session_id: null,
    description: 'Session bonus (5%)',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bt3',
    guest_id: '2',
    profile_id: 'demo',
    type: 'redemption',
    amount: -5,
    balance_after: 12,
    related_session_id: null,
    description: 'Bonus redeemed',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

interface UseLoyaltyReturn {
  settings: LoyaltySettings
  loading: boolean
  updateSettings: (updates: Partial<LoyaltySettings>) => Promise<boolean>
  accrueBonus: (guestId: string, sessionAmount: number, sessionId?: string) => Promise<boolean>
  redeemBonus: (guestId: string, amount: number, sessionId?: string) => Promise<boolean>
  recalculateTier: (guest: Guest) => LoyaltyTier
  getBonusHistory: (guestId: string) => BonusTransaction[]
}

export function useLoyalty(): UseLoyaltyReturn {
  const [settings, setSettings] = useState<LoyaltySettings>(DEFAULT_SETTINGS)
  const [transactions, setTransactions] = useState<BonusTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const { user, isDemoMode } = useAuth()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  useEffect(() => {
    if (isDemoMode) {
      setSettings(DEFAULT_SETTINGS)
      setTransactions(DEMO_TRANSACTIONS)
      setLoading(false)
      return
    }

    if (!user || !supabase) {
      setLoading(false)
      return
    }

    const fetchSettings = async () => {
      const { data } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('profile_id', user.id)
        .single()

      if (data) {
        setSettings(data)
      }

      const { data: txData } = await supabase
        .from('bonus_transactions')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (txData) {
        setTransactions(txData)
      }

      setLoading(false)
    }

    fetchSettings()
  }, [user, isDemoMode, supabase])

  const updateSettings = useCallback(async (updates: Partial<LoyaltySettings>): Promise<boolean> => {
    if (isDemoMode) {
      setSettings(prev => ({ ...prev, ...updates, updated_at: new Date().toISOString() }))
      return true
    }

    if (!user || !supabase) return false

    const { error } = await supabase
      .from('loyalty_settings')
      .upsert({
        ...settings,
        ...updates,
        profile_id: user.id,
        updated_at: new Date().toISOString(),
      })

    if (error) return false

    setSettings(prev => ({ ...prev, ...updates, updated_at: new Date().toISOString() }))
    return true
  }, [user, isDemoMode, supabase, settings])

  const recalculateTier = useCallback((guest: Guest): LoyaltyTier => {
    if (guest.total_spent >= settings.tier_gold_threshold) return 'gold'
    if (guest.total_spent >= settings.tier_silver_threshold) return 'silver'
    return 'bronze'
  }, [settings])

  const accrueBonus = useCallback(async (guestId: string, sessionAmount: number, sessionId?: string): Promise<boolean> => {
    const bonusAmount = sessionAmount * (settings.bonus_accrual_percent / 100)

    if (isDemoMode) {
      const tx: BonusTransaction = {
        id: `demo-tx-${Date.now()}`,
        guest_id: guestId,
        profile_id: 'demo',
        type: 'accrual',
        amount: bonusAmount,
        balance_after: 0,
        related_session_id: sessionId || null,
        description: `Session bonus (${settings.bonus_accrual_percent}%)`,
        created_at: new Date().toISOString(),
      }
      setTransactions(prev => [tx, ...prev])
      return true
    }

    if (!user || !supabase) return false

    const { data: guest } = await supabase
      .from('guests')
      .select('bonus_balance, total_spent')
      .eq('id', guestId)
      .single()

    if (!guest) return false

    const newBalance = (guest.bonus_balance || 0) + bonusAmount
    const newTotalSpent = (guest.total_spent || 0) + sessionAmount

    await supabase
      .from('guests')
      .update({
        bonus_balance: newBalance,
        total_spent: newTotalSpent,
        loyalty_tier: newTotalSpent >= settings.tier_gold_threshold ? 'gold'
          : newTotalSpent >= settings.tier_silver_threshold ? 'silver'
          : 'bronze',
      })
      .eq('id', guestId)

    await supabase.from('bonus_transactions').insert({
      guest_id: guestId,
      profile_id: user.id,
      type: 'accrual',
      amount: bonusAmount,
      balance_after: newBalance,
      related_session_id: sessionId || null,
      description: `Session bonus (${settings.bonus_accrual_percent}%)`,
    })

    return true
  }, [user, isDemoMode, supabase, settings])

  const redeemBonus = useCallback(async (guestId: string, amount: number, sessionId?: string): Promise<boolean> => {
    if (isDemoMode) {
      const tx: BonusTransaction = {
        id: `demo-tx-${Date.now()}`,
        guest_id: guestId,
        profile_id: 'demo',
        type: 'redemption',
        amount: -amount,
        balance_after: 0,
        related_session_id: sessionId || null,
        description: 'Bonus redeemed',
        created_at: new Date().toISOString(),
      }
      setTransactions(prev => [tx, ...prev])
      return true
    }

    if (!user || !supabase) return false

    const { data: guest } = await supabase
      .from('guests')
      .select('bonus_balance')
      .eq('id', guestId)
      .single()

    if (!guest || guest.bonus_balance < amount) return false

    const newBalance = guest.bonus_balance - amount

    await supabase
      .from('guests')
      .update({ bonus_balance: newBalance })
      .eq('id', guestId)

    await supabase.from('bonus_transactions').insert({
      guest_id: guestId,
      profile_id: user.id,
      type: 'redemption',
      amount: -amount,
      balance_after: newBalance,
      related_session_id: sessionId || null,
      description: 'Bonus redeemed',
    })

    return true
  }, [user, isDemoMode, supabase, settings])

  const getBonusHistory = useCallback((guestId: string): BonusTransaction[] => {
    return transactions.filter(t => t.guest_id === guestId)
  }, [transactions])

  return {
    settings,
    loading,
    updateSettings,
    accrueBonus,
    redeemBonus,
    recalculateTier,
    getBonusHistory,
  }
}
