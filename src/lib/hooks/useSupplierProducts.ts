'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import type { SupplierProduct } from '@/types/database'

// Demo products - exported for use in useSuppliers
export const DEMO_PRODUCTS: SupplierProduct[] = [
  // Supplier 1: Tobacco Wholesale EU
  { id: 'demo-p1', supplier_id: 'demo-s1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', sku: 'MH-PINK-100', price: 15, package_grams: 100, in_stock: true, created_at: new Date().toISOString() },
  { id: 'demo-p2', supplier_id: 'demo-s1', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', sku: 'MH-LL-100', price: 15, package_grams: 100, in_stock: true, created_at: new Date().toISOString() },
  { id: 'demo-p3', supplier_id: 'demo-s1', tobacco_id: 'mh3', brand: 'Musthave', flavor: 'Mango Sling', sku: 'MH-MS-100', price: 15, package_grams: 100, in_stock: true, created_at: new Date().toISOString() },
  { id: 'demo-p4', supplier_id: 'demo-s1', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', sku: 'DS-SN-100', price: 18, package_grams: 100, in_stock: true, created_at: new Date().toISOString() },
  { id: 'demo-p5', supplier_id: 'demo-s1', tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', sku: 'DS-BP-100', price: 18, package_grams: 100, in_stock: true, created_at: new Date().toISOString() },
  { id: 'demo-p6', supplier_id: 'demo-s1', tobacco_id: 'ds3', brand: 'Darkside', flavor: 'Cosmo Flower', sku: 'DS-CF-100', price: 18, package_grams: 100, in_stock: true, created_at: new Date().toISOString() },
  { id: 'demo-p7', supplier_id: 'demo-s1', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', sku: 'TG-CM-250', price: 42, package_grams: 250, in_stock: true, created_at: new Date().toISOString() },
  { id: 'demo-p8', supplier_id: 'demo-s1', tobacco_id: 'tg2', brand: 'Tangiers', flavor: 'Kashmir Peach', sku: 'TG-KP-250', price: 42, package_grams: 250, in_stock: false, created_at: new Date().toISOString() },

  // Supplier 2: Shisha Direct
  { id: 'demo-p9', supplier_id: 'demo-s2', tobacco_id: 'bb1', brand: 'Black Burn', flavor: 'Something Berry', sku: 'BB-SB-100', price: 14, package_grams: 100, in_stock: true, created_at: new Date().toISOString() },
  { id: 'demo-p10', supplier_id: 'demo-s2', tobacco_id: 'bb2', brand: 'Black Burn', flavor: 'Anise Star', sku: 'BB-AS-100', price: 14, package_grams: 100, in_stock: true, created_at: new Date().toISOString() },
  { id: 'demo-p11', supplier_id: 'demo-s2', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', sku: 'MH-PINK-100', price: 16, package_grams: 100, in_stock: true, created_at: new Date().toISOString() },
  { id: 'demo-p12', supplier_id: 'demo-s2', tobacco_id: 'af1', brand: 'Al Fakher', flavor: 'Two Apples', sku: 'AF-2A-250', price: 20, package_grams: 250, in_stock: true, created_at: new Date().toISOString() },
  { id: 'demo-p13', supplier_id: 'demo-s2', tobacco_id: 'af2', brand: 'Al Fakher', flavor: 'Grape Mint', sku: 'AF-GM-250', price: 20, package_grams: 250, in_stock: true, created_at: new Date().toISOString() },

  // Supplier 3: Middle East Imports
  { id: 'demo-p14', supplier_id: 'demo-s3', tobacco_id: 'af1', brand: 'Al Fakher', flavor: 'Two Apples', sku: 'AF-2A-1KG', price: 65, package_grams: 1000, in_stock: true, created_at: new Date().toISOString() },
  { id: 'demo-p15', supplier_id: 'demo-s3', tobacco_id: 'af3', brand: 'Al Fakher', flavor: 'Watermelon Mint', sku: 'AF-WM-1KG', price: 65, package_grams: 1000, in_stock: true, created_at: new Date().toISOString() },
  { id: 'demo-p16', supplier_id: 'demo-s3', tobacco_id: 'nk1', brand: 'Nakhla', flavor: 'Double Apple', sku: 'NK-DA-250', price: 18, package_grams: 250, in_stock: true, created_at: new Date().toISOString() },
  { id: 'demo-p17', supplier_id: 'demo-s3', tobacco_id: 'nk2', brand: 'Nakhla', flavor: 'Lemon', sku: 'NK-LM-250', price: 18, package_grams: 250, in_stock: true, created_at: new Date().toISOString() },
]

interface UseSupplierProductsOptions {
  supplierId?: string
  searchQuery?: string
  brand?: string
  inStockOnly?: boolean
}

interface UseSupplierProductsReturn {
  products: SupplierProduct[]
  loading: boolean
  error: string | null
  brands: string[]
  getProduct: (id: string) => SupplierProduct | undefined
  refresh: () => Promise<void>
}

export function useSupplierProducts(options: UseSupplierProductsOptions = {}): UseSupplierProductsReturn {
  const { supplierId, searchQuery, brand, inStockOnly = true } = options
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isDemoMode } = useAuth()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  const fetchProducts = useCallback(async () => {
    if (!user) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Demo mode
    if (isDemoMode || !supabase) {
      let filteredProducts = [...DEMO_PRODUCTS]

      if (supplierId) {
        filteredProducts = filteredProducts.filter(p => p.supplier_id === supplierId)
      }

      if (inStockOnly) {
        filteredProducts = filteredProducts.filter(p => p.in_stock)
      }

      if (brand) {
        filteredProducts = filteredProducts.filter(p => p.brand === brand)
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredProducts = filteredProducts.filter(p =>
          p.brand.toLowerCase().includes(query) ||
          p.flavor.toLowerCase().includes(query)
        )
      }

      setProducts(filteredProducts)
      setLoading(false)
      return
    }

    // Build query
    let query = supabase
      .from('supplier_products')
      .select('*')

    if (supplierId) {
      query = query.eq('supplier_id', supplierId)
    }

    if (inStockOnly) {
      query = query.eq('in_stock', true)
    }

    if (brand) {
      query = query.eq('brand', brand)
    }

    query = query.order('brand', { ascending: true }).order('flavor', { ascending: true })

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setProducts([])
    } else {
      let result = data || []

      // Client-side search filter (Supabase doesn't have good full-text search by default)
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        result = result.filter(p =>
          p.brand.toLowerCase().includes(q) ||
          p.flavor.toLowerCase().includes(q)
        )
      }

      setProducts(result)
    }

    setLoading(false)
  }, [user, isDemoMode, supabase, supplierId, searchQuery, brand, inStockOnly])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Extract unique brands from products
  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map(p => p.brand))]
    return uniqueBrands.sort()
  }, [products])

  const getProduct = useCallback((id: string): SupplierProduct | undefined => {
    return products.find(p => p.id === id)
  }, [products])

  return {
    products,
    loading,
    error,
    brands,
    getProduct,
    refresh: fetchProducts,
  }
}
