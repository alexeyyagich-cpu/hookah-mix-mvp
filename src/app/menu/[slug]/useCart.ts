'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { getLocaleName } from '@/lib/i18n'
import { useTranslation } from '@/lib/i18n'
import type { CartItem } from './CartOverlay'
import type { PublicBarRecipe } from '@/types/lounge'

export function useCart(slug: string, tableId: string | null, locale: string) {
  const t = useTranslation('hookah')

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCartOverlay, setShowCartOverlay] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  // Hookah ordering
  const [selectedHookahFlavor, setSelectedHookahFlavor] = useState<{ brand: string; flavor: string } | null>(null)
  const [hookahStrength, setHookahStrength] = useState<'light' | 'medium' | 'strong'>('medium')

  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])

  // Cart operations
  const addBarItem = useCallback((recipe: PublicBarRecipe) => {
    const name = getLocaleName(recipe, locale)
    setCart(prev => {
      const existing = prev.find(i => i.name === name && i.type === 'bar')
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { name, type: 'bar', quantity: 1, details: null }]
    })
  }, [locale])

  const removeBarItem = useCallback((recipe: PublicBarRecipe) => {
    const name = getLocaleName(recipe, locale)
    setCart(prev => {
      const existing = prev.find(i => i.name === name && i.type === 'bar')
      if (!existing) return prev
      if (existing.quantity <= 1) return prev.filter(i => i !== existing)
      return prev.map(i => i === existing ? { ...i, quantity: i.quantity - 1 } : i)
    })
  }, [locale])

  const getBarItemCount = useCallback((recipe: PublicBarRecipe) => {
    const name = getLocaleName(recipe, locale)
    return cart.find(i => i.name === name && i.type === 'bar')?.quantity || 0
  }, [cart, locale])

  const addHookahItem = useCallback(() => {
    if (!selectedHookahFlavor) return
    const name = `${selectedHookahFlavor.brand} ${selectedHookahFlavor.flavor}`
    const strengthLabel = hookahStrength === 'light' ? t.strengthLight
      : hookahStrength === 'strong' ? t.strengthStrong : t.strengthMedium
    setCart(prev => [...prev, { name, type: 'hookah', quantity: 1, details: strengthLabel }])
    setSelectedHookahFlavor(null)
  }, [selectedHookahFlavor, hookahStrength, t])

  const removeCartItem = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Escape key to close cart overlay
  const handleCartEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setShowCartOverlay(false)
  }, [])

  useEffect(() => {
    if (!showCartOverlay) return
    window.addEventListener('keydown', handleCartEscape)
    return () => window.removeEventListener('keydown', handleCartEscape)
  }, [showCartOverlay, handleCartEscape])

  const submitOrder = useCallback(async () => {
    if (cart.length === 0 || !tableId || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setOrderError(null)

    // Split cart into bar and hookah orders
    const barItems = cart.filter(i => i.type === 'bar')
    const hookahItems = cart.filter(i => i.type === 'hookah')

    const requests: Promise<Response>[] = []

    if (barItems.length > 0) {
      requests.push(
        fetch(`/api/public/order/${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table_id: tableId,
            guest_name: guestName || null,
            type: 'bar',
            items: barItems.map(i => ({ name: i.name, quantity: i.quantity, details: i.details })),
            notes: orderNotes || null,
          }),
        })
      )
    }

    if (hookahItems.length > 0) {
      requests.push(
        fetch(`/api/public/order/${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table_id: tableId,
            guest_name: guestName || null,
            type: 'hookah',
            items: hookahItems.map(i => ({ name: i.name, quantity: i.quantity, details: i.details })),
            notes: orderNotes || null,
          }),
        })
      )
    }

    try {
      const responses = await Promise.all(requests)
      for (const res of responses) {
        if (!res.ok) {
          let errorMessage = t.orderError
          if (res.status === 429) {
            errorMessage = t.orderRateLimit
          } else {
            try {
              const data = await res.json()
              if (data.error) errorMessage = data.error
            } catch {
              // Response body is not valid JSON — use default error message
            }
          }
          setOrderError(errorMessage)
          setSubmitting(false)
          submittingRef.current = false
          return
        }
      }
      setOrderSuccess(true)
      setCart([])
      setGuestName('')
      setOrderNotes('')
      setShowCartOverlay(false)
    } catch {
      setOrderError(t.orderError)
    }
    setSubmitting(false)
    submittingRef.current = false
  }, [cart, tableId, slug, guestName, orderNotes, t])

  return {
    cart, setCart,
    showCartOverlay, setShowCartOverlay,
    guestName, setGuestName,
    orderNotes, setOrderNotes,
    submitting,
    orderSuccess, setOrderSuccess,
    orderError,
    selectedHookahFlavor, setSelectedHookahFlavor,
    hookahStrength, setHookahStrength,
    cartItemCount,
    addBarItem, removeBarItem, getBarItemCount,
    addHookahItem, removeCartItem,
    submitOrder,
  }
}
