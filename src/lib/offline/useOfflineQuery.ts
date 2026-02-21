'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getCachedData, setCachedData } from './db'

interface UseOfflineQueryOptions<T> {
  storeName: string
  queryFn: () => Promise<{ data: T[] | null; error: { message: string } | null }>
  userId: string | null
  enabled?: boolean
}

interface UseOfflineQueryResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  isFromCache: boolean
  refresh: () => Promise<void>
}

export function useOfflineQuery<T>({
  storeName,
  queryFn,
  userId,
  enabled = true,
}: UseOfflineQueryOptions<T>): UseOfflineQueryResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetchData = useCallback(async () => {
    if (!enabled || !userId) {
      setData([])
      setLoading(false)
      return
    }

    // 1. Try cache first for instant display
    const cached = await getCachedData<T>(storeName, userId)
    if (cached && mountedRef.current) {
      setData(cached.data)
      setIsFromCache(true)
      setLoading(false)
    }

    // 2. Try network
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // Offline — use cache only
      if (!cached && mountedRef.current) {
        setData([])
        setLoading(false)
        setError('Offline — no cached data')
      }
      return
    }

    try {
      const { data: freshData, error: fetchError } = await queryFn()

      if (!mountedRef.current) return

      if (fetchError) {
        // Network error — keep cache if available
        if (!cached) {
          setError(fetchError.message)
          setData([])
        }
        setLoading(false)
        return
      }

      const result = freshData || []
      setData(result)
      setIsFromCache(false)
      setError(null)
      setLoading(false)

      // Write to cache
      await setCachedData(storeName, userId, result)
    } catch {
      // Fetch threw (network failure) — keep cache
      if (!cached && mountedRef.current) {
        setData([])
        setLoading(false)
      }
    }
  }, [storeName, queryFn, userId, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, isFromCache, refresh: fetchData }
}
