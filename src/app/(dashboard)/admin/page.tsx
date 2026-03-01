'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AccessDenied } from '@/components/ui/AccessDenied'
import Link from 'next/link'
import type { AdminStats } from '@/types/database'

export default function AdminDashboard() {
  const { isSuperAdmin, user } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('No session')

      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (!isSuperAdmin) {
    return <AccessDenied />
  }

  return (
    <ErrorBoundary sectionName="Admin Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Super Admin
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-textMuted)' }}>
              Platform overview & management
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="btn btn-sm"
            style={{ background: 'var(--color-bgHover)', color: 'var(--color-text)' }}
          >
            {loading ? '...' : '↻ Refresh'}
          </button>
        </div>

        {error && (
          <div className="card p-4" style={{ background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Organizations"
            value={stats?.total_orgs ?? '—'}
            loading={loading}
          />
          <KpiCard
            label="Active (7d)"
            value={stats?.active_orgs_7d ?? '—'}
            loading={loading}
            accent="var(--color-success)"
          />
          <KpiCard
            label="MRR"
            value={stats ? `€${stats.mrr}` : '—'}
            loading={loading}
            accent="var(--color-primary)"
          />
          <KpiCard
            label="Total Users"
            value={stats?.total_users ?? '—'}
            loading={loading}
          />
        </div>

        {/* Tier Breakdown */}
        {stats && (
          <div className="card p-5">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Subscription Breakdown
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <TierCard tier="Trial" count={stats.orgs_by_tier.trial} color="var(--color-textMuted)" />
              <TierCard tier="Core" count={stats.orgs_by_tier.core} color="var(--color-primary)" />
              <TierCard tier="Multi" count={stats.orgs_by_tier.multi} color="var(--color-success)" />
              <TierCard tier="Enterprise" count={stats.orgs_by_tier.enterprise} color="var(--color-warning)" />
            </div>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-sm" style={{ color: 'var(--color-textMuted)' }}>Trial → Paid Conversion</p>
            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
              {loading ? '—' : `${stats?.trial_to_paid_rate ?? 0}%`}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-sm" style={{ color: 'var(--color-textMuted)' }}>Trials Expiring (7d)</p>
            <p className="text-3xl font-bold mt-1" style={{ color: stats?.trials_expiring_7d ? 'var(--color-warning)' : 'var(--color-text)' }}>
              {loading ? '—' : stats?.trials_expiring_7d ?? 0}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-sm" style={{ color: 'var(--color-textMuted)' }}>New Signups (30d)</p>
            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
              {loading ? '—' : stats?.recent_signups_30d ?? 0}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/admin/organizations" className="card p-5 hover:opacity-80 transition-opacity">
            <p className="font-semibold" style={{ color: 'var(--color-text)' }}>Organizations →</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-textMuted)' }}>Manage all clients</p>
          </Link>
          <Link href="/admin/analytics" className="card p-5 hover:opacity-80 transition-opacity">
            <p className="font-semibold" style={{ color: 'var(--color-text)' }}>Analytics →</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-textMuted)' }}>Product metrics & funnels</p>
          </Link>
          <Link href="/admin/system" className="card p-5 hover:opacity-80 transition-opacity">
            <p className="font-semibold" style={{ color: 'var(--color-text)' }}>System →</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-textMuted)' }}>Backups, health, impersonation</p>
          </Link>
        </div>
      </div>
    </ErrorBoundary>
  )
}

function KpiCard({ label, value, loading, accent }: {
  label: string
  value: string | number
  loading: boolean
  accent?: string
}) {
  return (
    <div className="card p-5">
      <p className="text-sm" style={{ color: 'var(--color-textMuted)' }}>{label}</p>
      <p
        className={`text-2xl font-bold mt-1 ${loading ? 'skeleton rounded w-16 h-8' : ''}`}
        style={{ color: accent || 'var(--color-text)' }}
      >
        {loading ? '' : value}
      </p>
    </div>
  )
}

function TierCard({ tier, count, color }: { tier: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--color-bgHover)' }}>
      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{tier}</p>
        <p className="text-lg font-bold" style={{ color }}>{count}</p>
      </div>
    </div>
  )
}
