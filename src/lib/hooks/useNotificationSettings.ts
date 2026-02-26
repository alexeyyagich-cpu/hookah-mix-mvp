'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import type { NotificationSettings } from '@/types/database'

// Demo settings
const DEMO_SETTINGS: NotificationSettings = {
  id: 'demo',
  profile_id: 'demo',
  low_stock_enabled: true,
  low_stock_threshold: 50,
  created_at: new Date().toISOString(),
}

interface UseNotificationSettingsReturn {
  settings: NotificationSettings | null
  loading: boolean
  error: string | null
  updateSettings: (updates: Partial<Pick<NotificationSettings, 'low_stock_enabled' | 'low_stock_threshold'>>) => Promise<void>
  refresh: () => Promise<void>
}

export function useNotificationSettings(): UseNotificationSettingsReturn {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user, isDemoMode } = useAuth()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setSettings(DEMO_SETTINGS)
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchSettings = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('notification_settings')
        .select('id, profile_id, low_stock_enabled, low_stock_threshold, created_at')
        .eq('profile_id', user.id)
        .single()

      if (fetchError) {
        // If no settings exist, create default ones
        if (fetchError.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('notification_settings')
            .insert({
              profile_id: user.id,
              low_stock_enabled: true,
              low_stock_threshold: 50,
            })
            .select()
            .single()

          if (insertError) throw insertError
          setSettings(newData)
        } else {
          throw fetchError
        }
      } else {
        setSettings(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (!isDemoMode) {
      fetchSettings()
    }
  }, [fetchSettings, isDemoMode])

  const updateSettings = useCallback(async (
    updates: Partial<Pick<NotificationSettings, 'low_stock_enabled' | 'low_stock_threshold'>>
  ) => {
    if (isDemoMode) {
      // Update local state for demo mode
      setSettings(prev => prev ? { ...prev, ...updates } : null)
      return
    }

    if (!user || !supabase || !settings) return

    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('notification_settings')
        .update(updates)
        .eq('profile_id', user.id)

      if (updateError) throw updateError

      // Update local state
      setSettings(prev => prev ? { ...prev, ...updates } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
      throw err
    }
  }, [user, supabase, settings, isDemoMode])

  return {
    settings,
    loading,
    error,
    updateSettings,
    refresh: fetchSettings,
  }
}
