'use client'

import { useState } from 'react'
import { useOnlineStatus } from '@/lib/offline/useOnlineStatus'
import { useTranslation } from '@/lib/i18n'
import { getFailedMutations, retryFailedMutation, removeMutation, clearAllCache, type SyncQueueEntry } from '@/lib/offline/db'

export function OfflineIndicator() {
  const { isOnline, pendingSyncCount, failedSyncCount, isSyncing, triggerSync } = useOnlineStatus()
  const tc = useTranslation('common')
  const [showFailed, setShowFailed] = useState(false)
  const [failedItems, setFailedItems] = useState<SyncQueueEntry[]>([])

  // Online with nothing pending — hide
  if (isOnline && pendingSyncCount === 0 && failedSyncCount === 0 && !isSyncing) {
    return null
  }

  const isOffline = !isOnline
  const isFailed = failedSyncCount > 0 && !isSyncing && isOnline

  const bg = isOffline
    ? 'rgba(245, 158, 11, 0.15)'
    : isFailed
      ? 'rgba(239, 68, 68, 0.15)'
      : 'rgba(59, 130, 246, 0.15)'
  const border = isOffline
    ? 'rgba(245, 158, 11, 0.3)'
    : isFailed
      ? 'rgba(239, 68, 68, 0.3)'
      : 'rgba(59, 130, 246, 0.3)'
  const color = isOffline
    ? 'rgb(245, 158, 11)'
    : isFailed
      ? 'rgb(248, 113, 113)'
      : 'rgb(96, 165, 250)'

  const handleFailedClick = async () => {
    if (failedSyncCount > 0) {
      const items = await getFailedMutations()
      setFailedItems(items)
      setShowFailed(prev => !prev)
    }
  }

  const handleRetry = async (id: number) => {
    await retryFailedMutation(id)
    setFailedItems(prev => prev.filter(i => i.id !== id))
    triggerSync()
  }

  const handleDiscard = async (id: number) => {
    await removeMutation(id)
    setFailedItems(prev => prev.filter(i => i.id !== id))
    // Reconcile: clear stale cache and trigger hooks to refetch from server
    await clearAllCache()
    window.dispatchEvent(new Event('offline-mutation-enqueued'))
    window.dispatchEvent(new Event('offline-discard-reconcile'))
  }

  const handleRetryAll = async () => {
    for (const item of failedItems) {
      if (item.id) await retryFailedMutation(item.id)
    }
    setFailedItems([])
    triggerSync()
  }

  const handleDiscardAll = async () => {
    for (const item of failedItems) {
      if (item.id) await removeMutation(item.id)
    }
    setFailedItems([])
    setShowFailed(false)
    // Reconcile: clear stale cache and trigger hooks to refetch from server
    await clearAllCache()
    window.dispatchEvent(new Event('offline-mutation-enqueued'))
    window.dispatchEvent(new Event('offline-discard-reconcile'))
  }

  const LABELS: Record<string, string> = {
    sessions: 'Session',
    kds_orders: 'KDS Order',
    tobacco_inventory: 'Inventory',
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Failed mutations panel */}
      {showFailed && failedItems.length > 0 && (
        <div
          className="w-72 max-h-64 overflow-y-auto rounded-xl border shadow-xl backdrop-blur-md text-xs"
          style={{ background: 'rgba(15, 15, 25, 0.95)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <span className="text-[var(--color-error)] font-medium">
              {tc.offline.syncFailed(String(failedItems.length))}
            </span>
            <div className="flex gap-1">
              <button type="button" onClick={handleRetryAll} className="px-2 py-0.5 rounded text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors">
                {tc.retry}
              </button>
              <button type="button" onClick={handleDiscardAll} className="px-2 py-0.5 rounded text-[var(--color-textMuted)] hover:bg-[var(--color-textMuted)]/10 transition-colors">
                {tc.delete}
              </button>
            </div>
          </div>

          {failedItems.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[var(--color-text)] truncate">
                  {LABELS[item.table] || item.table} — {item.operation}
                </div>
                {item.error && (
                  <div className="text-[var(--color-error)]/70 truncate mt-0.5">{item.error}</div>
                )}
              </div>
              <div className="flex gap-1 ml-2 shrink-0">
                <button type="button"
                  onClick={() => item.id && handleRetry(item.id)}
                  className="p-1 rounded hover:bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors"
                  title={tc.retry}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                    <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  </svg>
                </button>
                <button type="button"
                  onClick={() => item.id && handleDiscard(item.id)}
                  className="p-1 rounded hover:bg-[var(--color-error)]/10 text-[var(--color-textMuted)] transition-colors"
                  title={tc.delete}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main pill */}
      <button type="button"
        onClick={isFailed ? handleFailedClick : undefined}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium shadow-lg border backdrop-blur-sm"
        style={{ background: bg, borderColor: border, color, cursor: isFailed ? 'pointer' : 'default' }}
      >
        {isOffline ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 2l20 20" /><path d="M17 17H7A5 5 0 0 1 5.02 7.02" /><path d="M22 16.74A6 6 0 0 0 12.06 6.06" />
            </svg>
            <span>{tc.offline.indicator}</span>
            {pendingSyncCount > 0 && <span className="opacity-70">({pendingSyncCount})</span>}
          </>
        ) : isSyncing ? (
          <>
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{tc.offline.syncing}</span>
          </>
        ) : isFailed ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{tc.offline.syncFailed(String(failedSyncCount))}</span>
          </>
        ) : (
          <>
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{tc.offline.syncPending(String(pendingSyncCount))}</span>
          </>
        )}
      </button>
    </div>
  )
}
