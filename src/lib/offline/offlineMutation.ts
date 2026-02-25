import { enqueueMutation, getCachedData, setCachedData, type SyncQueueEntry } from './db'

export function generateTempId(): string {
  return `offline-${crypto.randomUUID()}`
}

/**
 * Enqueue a mutation for offline sync and apply optimistic update to IndexedDB cache.
 * After enqueuing, dispatches an event so the OnlineStatusProvider can update counts.
 */
export async function enqueueOfflineMutation<T>({
  storeName,
  userId,
  table,
  operation,
  payload,
  matchColumn,
  meta,
  optimisticUpdate,
}: {
  storeName: string
  userId: string
  table: string
  operation: SyncQueueEntry['operation']
  payload: Record<string, unknown>
  matchColumn?: string
  meta?: Record<string, unknown>
  optimisticUpdate?: (cached: T[]) => T[]
}): Promise<number> {
  const id = await enqueueMutation({
    table,
    operation,
    payload,
    matchColumn,
    userId,
    createdAt: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
    error: null,
    idempotencyKey: crypto.randomUUID(),
    meta,
  })

  if (optimisticUpdate) {
    const cached = await getCachedData<T>(storeName, userId)
    const currentData = cached?.data || []
    const updatedData = optimisticUpdate(currentData)
    await setCachedData(storeName, userId, updatedData)
  }

  // Notify OnlineStatusProvider to refresh pending count
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('offline-mutation-enqueued'))

    // Register background sync tag (Chrome/Edge; no-op on Safari)
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        // @ts-expect-error -- SyncManager not in all TS lib types
        reg.sync?.register('sync-mutations').catch((err) => console.error('Offline mutation error:', err))
      })
    }
  }

  return id
}
