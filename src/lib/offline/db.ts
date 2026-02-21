import { openDB, type IDBPDatabase } from 'idb'

// --- Schema ---

interface CacheEntry {
  data: unknown[]
  cachedAt: number
}

export interface SyncQueueEntry {
  id?: number
  table: string
  operation: 'insert' | 'update' | 'delete' | 'upsert' | 'compound'
  payload: Record<string, unknown>
  matchColumn?: string // for update/delete: which column to match (default 'id')
  userId: string
  createdAt: string
  status: 'pending' | 'syncing' | 'failed'
  retryCount: number
  error: string | null
  idempotencyKey?: string
  meta?: Record<string, unknown> // compound mutation data (related entities, adjustments)
}

interface OfflineDBSchema {
  cache: {
    key: string // "{storeName}:{userId}"
    value: CacheEntry
  }
  syncQueue: {
    key: number
    value: SyncQueueEntry
    indexes: { byStatus: string }
  }
}

// --- Database ---

const DB_NAME = 'hookah-torus-offline'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<OfflineDBSchema>> | null = null

function getDb(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache')
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          const store = db.createObjectStore('syncQueue', {
            keyPath: 'id',
            autoIncrement: true,
          })
          store.createIndex('byStatus', 'status')
        }
      },
    })
  }
  return dbPromise
}

// --- Cache Operations ---

export async function getCachedData<T>(
  storeName: string,
  userId: string
): Promise<{ data: T[]; cachedAt: number } | null> {
  try {
    const db = await getDb()
    const entry = await db.get('cache', `${storeName}:${userId}`)
    if (!entry) return null
    return { data: entry.data as T[], cachedAt: entry.cachedAt }
  } catch {
    return null
  }
}

export async function setCachedData<T>(
  storeName: string,
  userId: string,
  data: T[]
): Promise<void> {
  try {
    const db = await getDb()
    await db.put('cache', { data, cachedAt: Date.now() }, `${storeName}:${userId}`)
  } catch {
    // IndexedDB write failed (quota, etc.) — non-critical
  }
}

export async function clearCache(storeName: string, userId: string): Promise<void> {
  try {
    const db = await getDb()
    await db.delete('cache', `${storeName}:${userId}`)
  } catch {
    // ignore
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    const db = await getDb()
    await db.clear('cache')
  } catch {
    // ignore
  }
}

// --- Sync Queue Operations ---

export async function enqueueMutation(
  entry: Omit<SyncQueueEntry, 'id'>
): Promise<number> {
  const db = await getDb()
  return db.add('syncQueue', entry as SyncQueueEntry) as Promise<number>
}

export async function getPendingMutations(): Promise<SyncQueueEntry[]> {
  const db = await getDb()
  const all = await db.getAllFromIndex('syncQueue', 'byStatus', 'pending')
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function updateMutationStatus(
  id: number,
  status: 'syncing' | 'failed' | 'pending',
  error?: string
): Promise<void> {
  const db = await getDb()
  const entry = await db.get('syncQueue', id)
  if (!entry) return
  entry.status = status
  if (error !== undefined) entry.error = error
  if (status === 'failed') entry.retryCount += 1
  await db.put('syncQueue', entry)
}

export async function removeMutation(id: number): Promise<void> {
  const db = await getDb()
  await db.delete('syncQueue', id)
}

export async function getPendingCount(): Promise<number> {
  try {
    const db = await getDb()
    return db.countFromIndex('syncQueue', 'byStatus', 'pending')
  } catch {
    return 0
  }
}

export async function getFailedCount(): Promise<number> {
  try {
    const db = await getDb()
    return db.countFromIndex('syncQueue', 'byStatus', 'failed')
  } catch {
    return 0
  }
}

export async function clearSyncQueue(): Promise<void> {
  try {
    const db = await getDb()
    await db.clear('syncQueue')
  } catch {
    // ignore
  }
}
