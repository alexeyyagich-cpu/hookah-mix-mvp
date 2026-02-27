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

  // Track online/offline with debounce to prevent flickering on flaky connections
  const onlineTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    const handleOnline = () => {
      clearTimeout(onlineTimerRef.current)
      onlineTimerRef.current = setTimeout(() => setIsOnline(true), 1000)
    }
    const handleOffline = () => {
      clearTimeout(onlineTimerRef.current)
      onlineTimerRef.current = setTimeout(() => setIsOnline(false), 300)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      clearTimeout(onlineTimerRef.current)
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
    // Refresh counts immediately when a mutation is enqueued offline
    const handleEnqueue = () => refreshCounts()
    window.addEventListener('offline-mutation-enqueued', handleEnqueue)
    return () => {
      clearInterval(interval)
      window.removeEventListener('offline-mutation-enqueued', handleEnqueue)
    }
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

  // Listen for Background Sync trigger from SW
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TRIGGER_SYNC') {
        triggerSync()
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [triggerSync])

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
