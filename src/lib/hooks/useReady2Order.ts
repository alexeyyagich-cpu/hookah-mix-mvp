'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type { R2OConnectionStatus } from '@/types/database'

interface R2OConnectionInfo {
  status: R2OConnectionStatus
  webhook_registered: boolean
  last_sync_at: string | null
  product_group_id: number | null
  created_at: string
}

const DEMO_CONNECTION: R2OConnectionInfo = {
  status: 'connected',
  webhook_registered: true,
  last_sync_at: new Date(Date.now() - 3600_000).toISOString(),
  product_group_id: 42,
  created_at: new Date(Date.now() - 86400_000 * 3).toISOString(),
}

interface UseReady2OrderReturn {
  connection: R2OConnectionInfo | null
  loading: boolean
  error: string | null
  syncing: boolean
  syncResult: { synced: number; errors: number; total: number } | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  sync: () => Promise<void>
  refresh: () => Promise<void>
}

export function useReady2Order(): UseReady2OrderReturn {
  const [connection, setConnection] = useState<R2OConnectionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced: number; errors: number; total: number } | null>(null)

  const { user, isDemoMode } = useAuth()
  const { organizationId, locationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Demo mode
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
      const { data, error: fetchError } = await Promise.race([
        supabase
          .from('r2o_connections')
          .select('status, webhook_registered, last_sync_at, product_group_id, created_at')
          .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
          .single(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ])

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }
      setConnection(data || null)
    } catch (err) {
      if (err instanceof Error && err.message !== 'timeout') {
        setError(err.message)
      }
    }

    setLoading(false)
  }, [user, supabase, organizationId])

  useEffect(() => {
    if (!isDemoMode) {
      fetchConnection()
    }
  }, [fetchConnection, isDemoMode])

  const connect = useCallback(async () => {
    if (isDemoMode) {
      setConnection(DEMO_CONNECTION)
      return
    }

    setError(null)

    try {
      const response = await fetch('/api/r2o/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect POS')
      }

      if (data.grantAccessUri) {
        // Open r2o grant access page in a popup
        const popup = window.open(
          data.grantAccessUri,
          'r2o_connect',
          'width=600,height=700,scrollbars=yes'
        )

        // Poll for connection completion
        if (popup) {
          const pollInterval = setInterval(async () => {
            try {
              if (popup.closed) {
                clearInterval(pollInterval)
                // Refresh connection state
                await fetchConnection()
              }
            } catch {
              // Cross-origin error means popup is still on r2o domain
            }
          }, 1000)

          // Safety timeout
          setTimeout(() => {
            clearInterval(pollInterval)
            fetchConnection()
          }, 120_000)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect POS')
    }
  }, [isDemoMode, fetchConnection])

  const disconnect = useCallback(async () => {
    if (isDemoMode) {
      setConnection(null)
      return
    }

    setError(null)

    try {
      const response = await fetch('/api/r2o/disconnect', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to disconnect POS')
      }

      setConnection(null)
      setSyncResult(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect POS')
    }
  }, [isDemoMode])

  const sync = useCallback(async () => {
    if (isDemoMode) {
      setSyncing(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSyncResult({ synced: 15, errors: 0, total: 15 })
      setSyncing(false)
      setConnection(prev => prev ? { ...prev, last_sync_at: new Date().toISOString() } : null)
      return
    }

    setSyncing(true)
    setSyncResult(null)
    setError(null)

    try {
      const response = await fetch('/api/r2o/sync', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed')
      }

      setSyncResult(data)
      setConnection(prev => prev ? { ...prev, last_sync_at: new Date().toISOString() } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    }

    setSyncing(false)
  }, [isDemoMode])

  return {
    connection,
    loading,
    error,
    syncing,
    syncResult,
    connect,
    disconnect,
    sync,
    refresh: fetchConnection,
  }
}
