'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import type { Review } from '@/types/database'

// Demo reviews for dashboard
const DEMO_REVIEWS: Review[] = [
  {
    id: '1',
    profile_id: 'demo',
    author_name: 'Piotr Kowalski',
    rating: 5,
    text: 'Best hookah lounge in the city! Amazing atmosphere, always friendly staff.',
    is_published: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    profile_id: 'demo',
    author_name: 'Lena Schmidt',
    rating: 5,
    text: 'Love this place! Cozy interior, great hookahs and excellent music.',
    is_published: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    profile_id: 'demo',
    author_name: 'Jakub Nowak',
    rating: 4,
    text: 'Great tobacco selection and professional hookah masters. Will come again!',
    is_published: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    profile_id: 'demo',
    author_name: 'Sophie Müller',
    rating: 5,
    text: 'Celebrated a birthday here — everything was perfect!',
    is_published: false,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// ============================================================================
// Dashboard hook (owner) — full CRUD
// ============================================================================

interface UseReviewsReturn {
  reviews: Review[]
  loading: boolean
  error: string | null
  averageRating: number
  totalCount: number
  togglePublished: (id: string, isPublished: boolean) => Promise<void>
  deleteReview: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useReviews(): UseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user, isDemoMode } = useAuth()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  useEffect(() => {
    if (isDemoMode && user) {
      setReviews(DEMO_REVIEWS)
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchReviews = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setReviews(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки отзывов')
    }

    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    if (!isDemoMode) {
      fetchReviews()
    }
  }, [fetchReviews, isDemoMode])

  const togglePublished = useCallback(async (id: string, isPublished: boolean) => {
    if (isDemoMode) {
      setReviews(prev => prev.map(r =>
        r.id === id ? { ...r, is_published: isPublished } : r
      ))
      return
    }

    if (!user || !supabase) return

    try {
      const { error: updateError } = await supabase
        .from('reviews')
        .update({ is_published: isPublished })
        .eq('id', id)
        .eq('profile_id', user.id)

      if (updateError) throw updateError
      setReviews(prev => prev.map(r =>
        r.id === id ? { ...r, is_published: isPublished } : r
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления отзыва')
    }
  }, [user, supabase, isDemoMode])

  const deleteReview = useCallback(async (id: string) => {
    if (isDemoMode) {
      setReviews(prev => prev.filter(r => r.id !== id))
      return
    }

    if (!user || !supabase) return

    try {
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id)
        .eq('profile_id', user.id)

      if (deleteError) throw deleteError
      setReviews(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления отзыва')
    }
  }, [user, supabase, isDemoMode])

  const averageRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0

  return {
    reviews,
    loading,
    error,
    averageRating,
    totalCount: reviews.length,
    togglePublished,
    deleteReview,
    refresh: fetchReviews,
  }
}

// ============================================================================
// Public hook — load published reviews + submit new review (no auth required)
// ============================================================================

interface UsePublicReviewsReturn {
  reviews: Review[]
  loading: boolean
  error: string | null
  submitReview: (review: { author_name: string; rating: number; text?: string }) => Promise<boolean>
  submitting: boolean
}

export function usePublicReviews(profileId: string | undefined): UsePublicReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  useEffect(() => {
    if (!profileId || !supabase) {
      setLoading(false)
      return
    }

    const fetchPublicReviews = async () => {
      setLoading(true)
      try {
        const { data, error: fetchError } = await supabase
          .from('reviews')
          .select('*')
          .eq('profile_id', profileId)
          .eq('is_published', true)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setReviews(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки отзывов')
      }
      setLoading(false)
    }

    fetchPublicReviews()
  }, [profileId, supabase])

  const submitReview = useCallback(async (review: { author_name: string; rating: number; text?: string }): Promise<boolean> => {
    if (!profileId || !supabase) return false

    setSubmitting(true)
    try {
      const { data, error: insertError } = await supabase
        .from('reviews')
        .insert({
          profile_id: profileId,
          author_name: review.author_name,
          rating: review.rating,
          text: review.text || null,
        })
        .select()
        .single()

      if (insertError) throw insertError
      if (data) {
        setReviews(prev => [data, ...prev])
      }
      setSubmitting(false)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки отзыва')
      setSubmitting(false)
      return false
    }
  }, [profileId, supabase])

  return {
    reviews,
    loading,
    error,
    submitReview,
    submitting,
  }
}
