'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import type { Supplier, SupplierWithProducts } from '@/types/database'

// Demo data for testing
const DEMO_SUPPLIERS: Supplier[] = [
  {
    id: 'demo-s1',
    name: 'Tobacco Wholesale EU',
    contact_email: 'orders@tweu.com',
    contact_phone: '+49 30 123456',
    website: 'https://tobacco-wholesale.eu',
    logo_url: null,
    description: 'Premium tobacco distributor covering all of Europe. Fast delivery, competitive prices.',
    min_order_amount: 100,
    delivery_days_min: 2,
    delivery_days_max: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-s2',
    name: 'Shisha Direct',
    contact_email: 'info@shishadirect.com',
    contact_phone: '+44 20 7946 0958',
    website: 'https://shishadirect.com',
    logo_url: null,
    description: 'UK-based supplier specializing in premium hookah tobacco. Express delivery available.',
    min_order_amount: 75,
    delivery_days_min: 1,
    delivery_days_max: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-s3',
    name: 'Middle East Imports',
    contact_email: 'sales@meimports.ae',
    contact_phone: '+971 4 321 4567',
    website: 'https://meimports.ae',
    logo_url: null,
    description: 'Authentic Middle Eastern tobacco brands. Direct from source.',
    min_order_amount: 150,
    delivery_days_min: 5,
    delivery_days_max: 10,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

interface UseSuppliersReturn {
  suppliers: Supplier[]
  loading: boolean
  error: string | null
  getSupplier: (id: string) => Supplier | undefined
  getSupplierWithProducts: (id: string) => Promise<SupplierWithProducts | null>
  refresh: () => Promise<void>
}

export function useSuppliers(): UseSuppliersReturn {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isDemoMode } = useAuth()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setSuppliers(DEMO_SUPPLIERS)
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchSuppliers = useCallback(async () => {
    if (!user || !supabase) {
      setSuppliers([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setSuppliers([])
    } else {
      setSuppliers(data || [])
    }

    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    if (!isDemoMode) {
      fetchSuppliers()
    }
  }, [fetchSuppliers, isDemoMode])

  const getSupplier = useCallback((id: string): Supplier | undefined => {
    return suppliers.find(s => s.id === id)
  }, [suppliers])

  const getSupplierWithProducts = useCallback(async (id: string): Promise<SupplierWithProducts | null> => {
    const supplier = suppliers.find(s => s.id === id)
    if (!supplier) return null

    if (isDemoMode || !supabase) {
      // Return demo products - imported from useSupplierProducts
      const { DEMO_PRODUCTS } = await import('./useSupplierProducts')
      const products = DEMO_PRODUCTS.filter(p => p.supplier_id === id)
      return { ...supplier, products }
    }

    const { data: products, error: fetchError } = await supabase
      .from('supplier_products')
      .select('*')
      .eq('supplier_id', id)
      .eq('in_stock', true)
      .order('brand', { ascending: true })
      .order('flavor', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      return { ...supplier, products: [] }
    }

    return { ...supplier, products: products || [] }
  }, [suppliers, isDemoMode, supabase])

  return {
    suppliers,
    loading,
    error,
    getSupplier,
    getSupplierWithProducts,
    refresh: fetchSuppliers,
  }
}
