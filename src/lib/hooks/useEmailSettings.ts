'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useTranslation } from '@/lib/i18n'
import { isEmailConfigured } from '@/lib/email/config'
import type { EmailSettings } from '@/lib/email/types'

// Demo email settings
const DEMO_EMAIL_SETTINGS: EmailSettings = {
  id: 'demo-email-1',
  profile_id: 'demo',
  email_notifications_enabled: true,
  low_stock_email: true,
  order_updates_email: true,
  daily_summary_email: false,
  marketing_email: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

interface UseEmailSettingsReturn {
  settings: EmailSettings | null
  loading: boolean
  error: string | null
  isConfigured: boolean
  updateSettings: (updates: Partial<EmailSettings>) => Promise<void>
  refresh: () => Promise<void>
}

export function useEmailSettings(): UseEmailSettingsReturn {
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user, isDemoMode } = useAuth()
  const tc = useTranslation('common')
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setSettings(DEMO_EMAIL_SETTINGS)
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

    const timeout = setTimeout(() => setLoading(false), 8000)

    try {
      const { data, error: fetchError } = await supabase
        .from('email_settings')
        .select('id, profile_id, email_notifications_enabled, low_stock_email, order_updates_email, daily_summary_email, marketing_email, created_at, updated_at')
        .eq('profile_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      // Create default settings if none exist
      if (!data) {
        const defaultSettings = {
          profile_id: user.id,
          email_notifications_enabled: true,
          low_stock_email: true,
          order_updates_email: true,
          daily_summary_email: false,
          marketing_email: false,
        }

        const { data: newSettings, error: insertError } = await supabase
          .from('email_settings')
          .insert(defaultSettings)
          .select()
          .single()

        if (insertError) throw insertError
        setSettings(newSettings)
      } else {
        setSettings(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tc.errorLoading)
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (!isDemoMode) {
      fetchSettings()
    }
  }, [fetchSettings, isDemoMode])

  const updateSettings = useCallback(async (updates: Partial<EmailSettings>) => {
    if (isDemoMode) {
      setSettings(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null)
      return
    }

    if (!user || !supabase || !settings) return

    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('email_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', settings.id)
        .eq('profile_id', user.id)

      if (updateError) throw updateError
      setSettings(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : tc.errorSaving)
    }
  }, [user, supabase, settings, isDemoMode])

  return {
    settings,
    loading,
    error,
    isConfigured: isEmailConfigured,
    updateSettings,
    refresh: fetchSettings,
  }
}
