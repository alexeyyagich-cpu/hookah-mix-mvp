'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getPendingCount, getFailedCount } from './db'
import { processSyncQueue } from './syncEngine'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'

interface OnlineStatusContextType {
  isOnline: boolean
  pendingSyncCount: number
  failedSyncCount: number
  isSyncing: boolean
  triggerSync: () => Promise<void>
}

const OnlineStatusContext = createContext<OnlineStatusContextType>({
  isOnline: true,
  pendingSyncCount: 0,
  failedSyncCount: 0,
  isSyncing: false,
  triggerSync: async () => {},
})

export function OnlineStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [failedSyncCount, setFailedSyncCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const syncingRef = useRef(false)

  // Track online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Update pending counts periodically
  const refreshCounts = useCallback(async () => {
    const [pending, failed] = await Promise.all([getPendingCount(), getFailedCount()])
    setPendingSyncCount(pending)
    setFailedSyncCount(failed)
  }, [])

  useEffect(() => {
    refreshCounts()
    const interval = setInterval(refreshCounts, 10_000)
    return () => clearInterval(interval)
  }, [refreshCounts])

  // Sync when coming back online
  const triggerSync = useCallback(async () => {
    if (syncingRef.current || !isSupabaseConfigured) return
    syncingRef.current = true
    setIsSyncing(true)
    try {
      const supabase = createClient()
      await processSyncQueue(supabase)
    } catch {
      // sync failed — will retry later
    } finally {
      syncingRef.current = false
      setIsSyncing(false)
      await refreshCounts()
    }
  }, [refreshCounts])

  // Auto-sync on reconnect
  useEffect(() => {
    if (isOnline) {
      triggerSync()
    }
  }, [isOnline, triggerSync])

  // Periodic sync while online (every 30s)
  useEffect(() => {
    if (!isOnline) return
    const interval = setInterval(() => {
      if (pendingSyncCount > 0) triggerSync()
    }, 30_000)
    return () => clearInterval(interval)
  }, [isOnline, pendingSyncCount, triggerSync])

  return (
    <OnlineStatusContext.Provider
      value={{ isOnline, pendingSyncCount, failedSyncCount, isSyncing, triggerSync }}
    >
      {children}
    </OnlineStatusContext.Provider>
  )
}

export function useOnlineStatus() {
  return useContext(OnlineStatusContext)
}
