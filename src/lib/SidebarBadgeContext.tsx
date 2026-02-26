'use client'

import { createContext, useContext, useCallback, useRef, useSyncExternalStore } from 'react'

type Badges = Record<string, number>
type Listener = () => void

function createBadgeStore() {
  let badges: Badges = {}
  const listeners = new Set<Listener>()

  return {
    getSnapshot: () => badges,
    subscribe: (listener: Listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    setBadge: (route: string, count: number) => {
      if (badges[route] === count) return
      badges = { ...badges, [route]: count }
      listeners.forEach(l => l())
    },
  }
}

const StoreContext = createContext<ReturnType<typeof createBadgeStore> | null>(null)

export function SidebarBadgeProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<ReturnType<typeof createBadgeStore>>(null)
  if (!storeRef.current) storeRef.current = createBadgeStore()

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  )
}

export function useSetSidebarBadge() {
  const store = useContext(StoreContext)
  return useCallback((route: string, count: number) => {
    store?.setBadge(route, count)
  }, [store])
}

export function useSidebarBadges(): Badges {
  const store = useContext(StoreContext)
  return useSyncExternalStore(
    store?.subscribe ?? (() => () => {}),
    store?.getSnapshot ?? (() => ({})),
    () => ({})
  )
}
