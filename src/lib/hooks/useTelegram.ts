'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import type { TelegramConnection } from '@/lib/telegram/types'

// Demo Telegram connection
const DEMO_CONNECTION: TelegramConnection = {
  id: 'demo-tg-1',
  profile_id: 'demo',
  telegram_user_id: 123456789,
  telegram_username: 'demo_user',
  chat_id: 123456789,
  is_active: true,
  notifications_enabled: true,
  low_stock_alerts: true,
  session_reminders: false,
  daily_summary: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

interface UseTelegramReturn {
  connection: TelegramConnection | null
  loading: boolean
  error: string | null
  isConfigured: boolean
  connectLink: string
  updateSettings: (settings: Partial<TelegramConnection>) => Promise<void>
  disconnect: () => Promise<void>
  refresh: () => Promise<void>
}

export function useTelegram(): UseTelegramReturn {
  const [connection, setConnection] = useState<TelegramConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user, isDemoMode } = useAuth()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  const [connectLink, setConnectLink] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)

  // Fetch connect link from server (token generation needs server-side secrets)
  useEffect(() => {
    if (!user || isDemoMode) return
    fetch('/api/telegram/connect-link')
      .then(r => r.json())
      .then(data => {
        setIsConfigured(data.configured)
        setConnectLink(data.link || '')
      })
      .catch((err) => console.error('Telegram hook error:', err))
  }, [user, isDemoMode])

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setConnection(DEMO_CONNECTION)
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchConnection = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const timeout = setTimeout(() => setLoading(false), 8000)

    try {
      const { data, error: fetchError } = await supabase
        .from('telegram_connections')
        .select('id, profile_id, telegram_user_id, telegram_username, chat_id, is_active, notifications_enabled, low_stock_alerts, session_reminders, daily_summary, created_at, updated_at')
        .eq('profile_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }
      setConnection(data || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Telegram connection')
    }

    clearTimeout(timeout)
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    if (!isDemoMode) {
      fetchConnection()
    }
  }, [fetchConnection, isDemoMode])

  const updateSettings = useCallback(async (settings: Partial<TelegramConnection>) => {
    if (isDemoMode) {
      setConnection(prev => prev ? { ...prev, ...settings, updated_at: new Date().toISOString() } : null)
      return
    }

    if (!user || !supabase || !connection) return

    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('telegram_connections')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('id', connection.id)
        .eq('profile_id', user.id)

      if (updateError) throw updateError
      setConnection(prev => prev ? { ...prev, ...settings, updated_at: new Date().toISOString() } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings')
    }
  }, [user, supabase, connection, isDemoMode])

  const disconnect = useCallback(async () => {
    if (isDemoMode) {
      setConnection(null)
      return
    }

    if (!user || !supabase || !connection) return

    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('telegram_connections')
        .delete()
        .eq('id', connection.id)
        .eq('profile_id', user.id)

      if (deleteError) throw deleteError
      setConnection(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect Telegram')
    }
  }, [user, supabase, connection, isDemoMode])

  return {
    connection,
    loading,
    error,
    isConfigured,
    connectLink,
    updateSettings,
    disconnect,
    refresh: fetchConnection,
  }
}
