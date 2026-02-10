'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Supplier, SupplierProduct, CartItem, Cart } from '@/types/database'

const CART_STORAGE_KEY = 'hookah-mix-cart'

interface StoredCart {
  supplierId: string
  items: { productId: string; quantity: number }[]
}

interface UseCartReturn {
  cart: Cart | null
  cartItemCount: number
  loading: boolean
  addToCart: (product: SupplierProduct, supplier: Supplier, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  getItemQuantity: (productId: string) => number
  canAddToCart: (supplierId: string) => boolean
}

export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<Cart | null>(null)
  const [products, setProducts] = useState<Map<string, SupplierProduct>>(new Map())
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        if (!stored) {
          setLoading(false)
          return
        }

        const storedCart: StoredCart = JSON.parse(stored)
        if (!storedCart.items || storedCart.items.length === 0) {
          localStorage.removeItem(CART_STORAGE_KEY)
          setLoading(false)
          return
        }

        // Note: Products and supplier need to be loaded from parent component
        // Cart only stores IDs and quantities in localStorage
        // Full data is hydrated when products are added
        setLoading(false)
      } catch (e) {
        console.error('Failed to load cart:', e)
        localStorage.removeItem(CART_STORAGE_KEY)
        setLoading(false)
      }
    }

    loadCart()
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (loading) return

    if (!cart || cart.items.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY)
      return
    }

    const storedCart: StoredCart = {
      supplierId: cart.supplier.id,
      items: cart.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storedCart))
  }, [cart, loading])

  // Calculate subtotal
  const calculateSubtotal = useCallback((items: CartItem[]): number => {
    return items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  }, [])

  const addToCart = useCallback((product: SupplierProduct, supplierData: Supplier, quantity: number = 1) => {
    setCart(currentCart => {
      // If cart exists with different supplier, need to clear first
      if (currentCart && currentCart.supplier.id !== product.supplier_id) {
        // This shouldn't happen due to canAddToCart check, but safety fallback
        return currentCart
      }

      // Create new cart if empty
      if (!currentCart) {
        const newItems: CartItem[] = [{ product, quantity }]
        return {
          supplier: supplierData,
          items: newItems,
          subtotal: calculateSubtotal(newItems),
        }
      }

      // Check if product already in cart
      const existingIndex = currentCart.items.findIndex(item => item.product.id === product.id)

      let newItems: CartItem[]
      if (existingIndex >= 0) {
        // Update quantity
        newItems = currentCart.items.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        // Add new item
        newItems = [...currentCart.items, { product, quantity }]
      }

      return {
        ...currentCart,
        items: newItems,
        subtotal: calculateSubtotal(newItems),
      }
    })

    // Update supplier reference
    setSupplier(supplierData)

    // Update products cache
    setProducts(prev => {
      const updated = new Map(prev)
      updated.set(product.id, product)
      return updated
    })
  }, [calculateSubtotal])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      setCart(currentCart => {
        if (!currentCart) return null

        const newItems = currentCart.items.filter(item => item.product.id !== productId)

        if (newItems.length === 0) {
          return null
        }

        return {
          ...currentCart,
          items: newItems,
          subtotal: calculateSubtotal(newItems),
        }
      })
      return
    }

    setCart(currentCart => {
      if (!currentCart) return null

      const newItems = currentCart.items.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )

      return {
        ...currentCart,
        items: newItems,
        subtotal: calculateSubtotal(newItems),
      }
    })
  }, [calculateSubtotal])

  const removeFromCart = useCallback((productId: string) => {
    setCart(currentCart => {
      if (!currentCart) return null

      const newItems = currentCart.items.filter(item => item.product.id !== productId)

      if (newItems.length === 0) {
        return null
      }

      return {
        ...currentCart,
        items: newItems,
        subtotal: calculateSubtotal(newItems),
      }
    })
  }, [calculateSubtotal])

  const clearCart = useCallback(() => {
    setCart(null)
    setProducts(new Map())
    setSupplier(null)
    localStorage.removeItem(CART_STORAGE_KEY)
  }, [])

  const getItemQuantity = useCallback((productId: string): number => {
    if (!cart) return 0
    const item = cart.items.find(i => i.product.id === productId)
    return item?.quantity || 0
  }, [cart])

  const canAddToCart = useCallback((supplierId: string): boolean => {
    // Can add if cart is empty or same supplier
    if (!cart) return true
    return cart.supplier.id === supplierId
  }, [cart])

  const cartItemCount = useMemo(() => {
    if (!cart) return 0
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  return {
    cart,
    cartItemCount,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getItemQuantity,
    canAddToCart,
  }
}
