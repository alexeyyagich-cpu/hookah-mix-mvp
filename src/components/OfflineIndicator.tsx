'use client'

import { useOnlineStatus } from '@/lib/offline/useOnlineStatus'
import { useTranslation } from '@/lib/i18n'

export function OfflineIndicator() {
  const { isOnline, pendingSyncCount, failedSyncCount, isSyncing } = useOnlineStatus()
  const tc = useTranslation('common')

  // Online with nothing pending — hide
  if (isOnline && pendingSyncCount === 0 && failedSyncCount === 0 && !isSyncing) {
    return null
  }

  const isOffline = !isOnline

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium shadow-lg border backdrop-blur-sm"
      style={{
        background: isOffline
          ? 'rgba(245, 158, 11, 0.15)'
          : 'rgba(59, 130, 246, 0.15)',
        borderColor: isOffline
          ? 'rgba(245, 158, 11, 0.3)'
          : 'rgba(59, 130, 246, 0.3)',
        color: isOffline
          ? 'rgb(245, 158, 11)'
          : 'rgb(96, 165, 250)',
      }}
    >
      {isOffline ? (
        <>
          {/* Cloud-off icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 2l20 20" />
            <path d="M17 17H7A5 5 0 0 1 5.02 7.02" />
            <path d="M22 16.74A6 6 0 0 0 12.06 6.06" />
          </svg>
          <span>{tc.offline.indicator}</span>
        </>
      ) : isSyncing ? (
        <>
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>{tc.offline.syncing}</span>
        </>
      ) : failedSyncCount > 0 ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{tc.offline.syncFailed(String(failedSyncCount))}</span>
        </>
      ) : (
        <>
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>{tc.offline.syncPending(String(pendingSyncCount))}</span>
        </>
      )}
    </div>
  )
}
