'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/lib/AuthContext'
import { useModules } from '@/lib/hooks/useModules'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { HookahSection } from '@/components/dashboard/sections/HookahSection'
import { BarSection } from '@/components/dashboard/sections/BarSection'
import { FloorStatusWidget } from '@/components/dashboard/sections/FloorStatusWidget'
import {
  IconCalculator,
} from '@/components/Icons'
import Link from 'next/link'

export default function DashboardPage() {
  const { profile } = useAuth()
  const { isHookahActive, isBarActive } = useModules()
  const { isFreeTier } = useSubscription()

  const isCombined = isHookahActive && isBarActive

  // Background portal
  const [bgContainer, setBgContainer] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setBgContainer(document.getElementById('page-background'))
    return () => setBgContainer(null)
  }, [])

  return (
    <div className="space-y-8 relative">
      {/* Background Image via Portal */}
      {bgContainer && createPortal(
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'url(/images/dashboard-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />,
        bgContainer
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Привет, {profile?.owner_name || 'Владелец'}!
          </h1>
          <p className="text-[var(--color-textMuted)]">
            {profile?.business_name || 'Мое заведение'} — обзор за последние 30 дней
          </p>
        </div>
        {isHookahActive && (
          <Link href="/mix" className="btn btn-primary flex items-center gap-2">
            <IconCalculator size={18} />
            Калькулятор миксов
          </Link>
        )}
      </div>

      {/* Floor Status — always visible */}
      <FloorStatusWidget />

      {/* Hookah Section */}
      {isHookahActive && (
        <div>
          {isCombined && (
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🔥</span> Кальянная
            </h2>
          )}
          <HookahSection />
        </div>
      )}

      {/* Bar Section */}
      {isBarActive && (
        <div>
          {isCombined && (
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🍸</span> Бар
            </h2>
          )}
          <BarSection />
        </div>
      )}

      {/* Upgrade Banner */}
      {isFreeTier && (
        <div className="card p-6 bg-gradient-to-r from-[var(--color-primary)]/10 to-purple-500/10 border-[var(--color-primary)]/30">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">Перейдите на Pro</h3>
              <p className="text-[var(--color-textMuted)]">
                Получите безлимитный инвентарь, полную статистику, экспорт данных и многое другое
              </p>
            </div>
            <Link href="/pricing" className="btn btn-primary whitespace-nowrap">
              Улучшить тариф
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
