import { createBrowserClient } from '@supabase/ssr'
import { supabaseUrl, supabaseAnonKey } from '@/lib/config'

export function createClient() {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        // Disable navigator.locks to prevent hanging when a stale lock
        // is held by a previous tab, service worker, or browser extension.
        lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
          return await fn()
        },
      },
    }
  )
}
