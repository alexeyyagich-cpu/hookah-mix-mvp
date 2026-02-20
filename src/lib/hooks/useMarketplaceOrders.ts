'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type {
  MarketplaceOrder,
  MarketplaceOrderWithItems,
  OrderStatus,
  Cart,
} from '@/types/database'

import { isSupabaseConfigured } from '@/lib/config'

// Generate order number
function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${dateStr}-${random}`
}

// Demo orders
const DEMO_ORDERS: MarketplaceOrderWithItems[] = [
  {
    id: 'demo-o1',
    profile_id: 'demo-user-id',
    supplier_id: 'demo-s1',
    order_number: 'ORD-20260208-0001',
    status: 'delivered',
    subtotal: 130,
    shipping_cost: 0,
    total: 130,
    notes: null,
    estimated_delivery_date: '2026-02-10',
    actual_delivery_date: '2026-02-09',
    is_auto_order: false,
    created_at: '2026-02-08T10:00:00Z',
    supplier: {
      id: 'demo-s1',
      name: 'Tobacco Wholesale EU',
      contact_email: 'orders@tweu.com',
      contact_phone: '+49 30 123456',
      website: 'https://tobacco-wholesale.eu',
      logo_url: null,
      description: 'Premium tobacco distributor',
      min_order_amount: 100,
      delivery_days_min: 2,
      delivery_days_max: 5,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    order_items: [
      { id: 'demo-oi1', order_id: 'demo-o1', supplier_product_id: 'demo-p1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', quantity: 5, unit_price: 15, package_grams: 100, total_price: 75 },
      { id: 'demo-oi2', order_id: 'demo-o1', supplier_product_id: 'demo-p4', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', quantity: 3, unit_price: 18, package_grams: 100, total_price: 54 },
    ],
  },
  {
    id: 'demo-o2',
    profile_id: 'demo-user-id',
    supplier_id: 'demo-s2',
    order_number: 'ORD-20260209-0002',
    status: 'shipped',
    subtotal: 88,
    shipping_cost: 10,
    total: 98,
    notes: 'Please leave at the door',
    estimated_delivery_date: '2026-02-12',
    actual_delivery_date: null,
    is_auto_order: false,
    created_at: '2026-02-09T14:30:00Z',
    supplier: {
      id: 'demo-s2',
      name: 'Shisha Direct',
      contact_email: 'info@shishadirect.com',
      contact_phone: '+44 20 7946 0958',
      website: 'https://shishadirect.com',
      logo_url: null,
      description: 'UK-based supplier',
      min_order_amount: 75,
      delivery_days_min: 1,
      delivery_days_max: 3,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    order_items: [
      { id: 'demo-oi3', order_id: 'demo-o2', supplier_product_id: 'demo-p9', tobacco_id: 'bb1', brand: 'Black Burn', flavor: 'Something Berry', quantity: 4, unit_price: 14, package_grams: 100, total_price: 56 },
      { id: 'demo-oi4', order_id: 'demo-o2', supplier_product_id: 'demo-p11', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', quantity: 2, unit_price: 16, package_grams: 100, total_price: 32 },
    ],
  },
  {
    id: 'demo-o3',
    profile_id: 'demo-user-id',
    supplier_id: 'demo-s1',
    order_number: 'ORD-20260210-0003',
    status: 'pending',
    subtotal: 126,
    shipping_cost: 0,
    total: 126,
    notes: null,
    estimated_delivery_date: '2026-02-14',
    actual_delivery_date: null,
    is_auto_order: false,
    created_at: '2026-02-10T09:15:00Z',
    supplier: {
      id: 'demo-s1',
      name: 'Tobacco Wholesale EU',
      contact_email: 'orders@tweu.com',
      contact_phone: '+49 30 123456',
      website: 'https://tobacco-wholesale.eu',
      logo_url: null,
      description: 'Premium tobacco distributor',
      min_order_amount: 100,
      delivery_days_min: 2,
      delivery_days_max: 5,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    order_items: [
      { id: 'demo-oi5', order_id: 'demo-o3', supplier_product_id: 'demo-p7', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', quantity: 3, unit_price: 42, package_grams: 250, total_price: 126 },
    ],
  },
]

interface CreateOrderInput {
  cart: Cart
  notes?: string
  isAutoOrder?: boolean
}

interface UseMarketplaceOrdersReturn {
  orders: MarketplaceOrderWithItems[]
  loading: boolean
  error: string | null
  createOrder: (input: CreateOrderInput) => Promise<MarketplaceOrder | null>
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>
  getOrder: (id: string) => MarketplaceOrderWithItems | undefined
  refresh: () => Promise<void>
}

export function useMarketplaceOrders(): UseMarketplaceOrdersReturn {
  const [orders, setOrders] = useState<MarketplaceOrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isDemoMode } = useAuth()
  const { organizationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setOrders(DEMO_ORDERS)
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchOrders = useCallback(async () => {
    if (!user || !supabase) {
      setOrders([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Fetch orders with supplier and items
    const { data: ordersData, error: ordersError } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        supplier:suppliers(*),
        order_items:marketplace_order_items(*)
      `)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
      .order('created_at', { ascending: false })

    if (ordersError) {
      setError(ordersError.message)
      setOrders([])
    } else {
      setOrders(ordersData || [])
    }

    setLoading(false)
  }, [user, supabase, organizationId])

  useEffect(() => {
    if (!isDemoMode) {
      fetchOrders()
    }
  }, [fetchOrders, isDemoMode])

  const createOrder = useCallback(async (input: CreateOrderInput): Promise<MarketplaceOrder | null> => {
    const { cart, notes, isAutoOrder = false } = input

    if (!user) return null

    const orderNumber = generateOrderNumber()

    // Calculate estimated delivery date
    const estimatedDelivery = new Date()
    estimatedDelivery.setDate(estimatedDelivery.getDate() + cart.supplier.delivery_days_max)

    // Demo mode
    if (isDemoMode || !supabase) {
      const newOrder: MarketplaceOrderWithItems = {
        id: `demo-o${Date.now()}`,
        profile_id: 'demo-user-id',
        supplier_id: cart.supplier.id,
        order_number: orderNumber,
        status: 'pending',
        subtotal: cart.subtotal,
        shipping_cost: 0,
        total: cart.subtotal,
        notes: notes || null,
        estimated_delivery_date: estimatedDelivery.toISOString().slice(0, 10),
        actual_delivery_date: null,
        is_auto_order: isAutoOrder,
        created_at: new Date().toISOString(),
        supplier: cart.supplier,
        order_items: cart.items.map((item, idx) => ({
          id: `demo-oi-${Date.now()}-${idx}`,
          order_id: `demo-o${Date.now()}`,
          supplier_product_id: item.product.id,
          tobacco_id: item.product.tobacco_id,
          brand: item.product.brand,
          flavor: item.product.flavor,
          quantity: item.quantity,
          unit_price: item.product.price,
          package_grams: item.product.package_grams,
          total_price: item.product.price * item.quantity,
        })),
      }

      setOrders(prev => [newOrder, ...prev])
      return newOrder
    }

    // Create order in Supabase
    const { data: orderData, error: orderError } = await supabase
      .from('marketplace_orders')
      .insert({
        profile_id: user.id,
        supplier_id: cart.supplier.id,
        order_number: orderNumber,
        status: 'pending',
        subtotal: cart.subtotal,
        shipping_cost: 0,
        total: cart.subtotal,
        notes: notes || null,
        estimated_delivery_date: estimatedDelivery.toISOString().slice(0, 10),
        is_auto_order: isAutoOrder,
        ...(organizationId ? { organization_id: organizationId } : {}),
      })
      .select()
      .single()

    if (orderError) {
      setError(orderError.message)
      return null
    }

    // Create order items
    const orderItems = cart.items.map(item => ({
      order_id: orderData.id,
      supplier_product_id: item.product.id,
      tobacco_id: item.product.tobacco_id,
      brand: item.product.brand,
      flavor: item.product.flavor,
      quantity: item.quantity,
      unit_price: item.product.price,
      package_grams: item.product.package_grams,
      total_price: item.product.price * item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('marketplace_order_items')
      .insert(orderItems)

    if (itemsError) {
      setError(itemsError.message)
      // Note: Order was created but items failed - should handle rollback
    }

    await fetchOrders()
    return orderData
  }, [user, isDemoMode, supabase, fetchOrders])

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus): Promise<boolean> => {
    if (!user) return false

    // Demo mode
    if (isDemoMode || !supabase) {
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? {
              ...order,
              status,
              actual_delivery_date: status === 'delivered'
                ? new Date().toISOString().slice(0, 10)
                : order.actual_delivery_date,
            }
          : order
      ))
      return true
    }

    const updates: Partial<MarketplaceOrder> = { status }
    if (status === 'delivered') {
      updates.actual_delivery_date = new Date().toISOString().slice(0, 10)
    }

    const { error: updateError } = await supabase
      .from('marketplace_orders')
      .update(updates)
      .eq('id', orderId)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    await fetchOrders()
    return true
  }, [user, isDemoMode, supabase, fetchOrders, organizationId])

  const getOrder = useCallback((id: string): MarketplaceOrderWithItems | undefined => {
    return orders.find(o => o.id === id)
  }, [orders])

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    getOrder,
    refresh: fetchOrders,
  }
}
