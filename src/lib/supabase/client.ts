import { createBrowserClient } from '@supabase/ssr'
import { supabaseUrl, supabaseAnonKey } from '@/lib/config'

// Simple mutex to prevent concurrent token refreshes
let lockPromise: Promise<void> = Promise.resolve()

export function createClient() {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        // Use a simple mutex instead of navigator.locks (which can hang
        // when a stale lock is held by a previous tab or service worker)
        lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
          let release: () => void
          const prev = lockPromise
          lockPromise = new Promise<void>(resolve => { release = resolve })
          await prev
          try {
            return await fn()
          } finally {
            release!()
          }
        },
      },
    }
  )
}
