'use client'

import { useEffect, useRef } from 'react'
import { Toaster, toast } from 'sonner'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { useInventory } from '@/lib/hooks/useInventory'
import { useNotificationSettings } from '@/lib/hooks/useNotificationSettings'

function LowStockNotifier() {
  const { inventory } = useInventory()
  const { settings } = useNotificationSettings()
  const hasShownRef = useRef(false)

  useEffect(() => {
    // Only show once per session
    if (hasShownRef.current || !settings?.low_stock_enabled) return

    const threshold = settings?.low_stock_threshold || 50
    const lowStockItems = inventory.filter(item =>
      item.quantity_grams < threshold && item.quantity_grams > 0
    )
    const outOfStockItems = inventory.filter(item => item.quantity_grams <= 0)

    if (outOfStockItems.length > 0) {
      toast.error(`${outOfStockItems.length} позиций закончились!`, {
        description: outOfStockItems.slice(0, 3).map(i => `${i.brand} ${i.flavor}`).join(', ') +
          (outOfStockItems.length > 3 ? '...' : ''),
        duration: 6000,
      })
      hasShownRef.current = true
    } else if (lowStockItems.length > 0) {
      toast.warning(`${lowStockItems.length} позиций на исходе`, {
        description: lowStockItems.slice(0, 3).map(i => `${i.brand} ${i.flavor} (${i.quantity_grams.toFixed(0)}г)`).join(', ') +
          (lowStockItems.length > 3 ? '...' : ''),
        duration: 5000,
      })
      hasShownRef.current = true
    }
  }, [inventory, settings])

  return null
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--color-bg)] relative">
        {/* Global background slot - pages can inject backgrounds here via portal or we check pathname */}
        <div id="page-background" className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />
        <Sidebar />
        <main className="lg:pl-72 relative" style={{ zIndex: 1 }}>
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
        <LowStockNotifier />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--color-bgCard)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            },
          }}
        />
      </div>
    </AuthGuard>
  )
}
