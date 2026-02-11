'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/AuthContext'
import { generateConnectLink, isTelegramConfigured } from '@/lib/telegram/bot'
import type { TelegramConnection } from '@/lib/telegram/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

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

  const connectLink = useMemo(() => {
    if (!user) return ''
    return generateConnectLink(user.id)
  }, [user])

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

    try {
      const { data, error: fetchError } = await supabase
        .from('telegram_connections')
        .select('*')
        .eq('profile_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }
      setConnection(data || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки подключения Telegram')
    }

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
      setError(err instanceof Error ? err.message : 'Ошибка обновления настроек')
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
      setError(err instanceof Error ? err.message : 'Ошибка отключения Telegram')
    }
  }, [user, supabase, connection, isDemoMode])

  return {
    connection,
    loading,
    error,
    isConfigured: isTelegramConfigured,
    connectLink,
    updateSettings,
    disconnect,
    refresh: fetchConnection,
  }
}
