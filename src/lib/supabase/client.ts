import { createBrowserClient } from '@supabase/ssr'
import { supabaseUrl, supabaseAnonKey } from '@/lib/config'

// Re-entrant mutex to prevent concurrent token refreshes
// without deadlocking when Supabase calls lock from within lock
// (e.g. onAuthStateChange → fetchProfile → getSession → lock)
let lockPromise: Promise<void> = Promise.resolve()
let lockDepth = 0

const authLock = async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
  // Re-entrant: if already inside the lock, run fn directly
  if (lockDepth > 0) {
    lockDepth++
    try {
      return await fn()
    } finally {
      lockDepth--
    }
  }

  let release: () => void
  const prev = lockPromise
  lockPromise = new Promise<void>(resolve => { release = resolve })
  await prev
  lockDepth++
  try {
    return await fn()
  } finally {
    lockDepth--
    release!()
  }
}

// Singleton — all hooks and components share one client to avoid
// duplicate auth listeners and competing token refreshes
let singleton: ReturnType<typeof buildClient> | undefined

function buildClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, { auth: { lock: authLock } })
}

export function createClient() {
  return (singleton ??= buildClient())
}
