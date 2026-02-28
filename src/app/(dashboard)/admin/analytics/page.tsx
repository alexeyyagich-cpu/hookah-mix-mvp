'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Link from 'next/link'
import type { AdminStats } from '@/types/database'

export default function AdminAnalytics() {
  const { isSuperAdmin, user } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) setStats(await res.json())
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--color-textMuted)' }}>Access denied</p>
      </div>
    )
  }

  const arr = stats ? stats.mrr * 12 : 0
  const totalPaid = stats ? (stats.orgs_by_tier.core + stats.orgs_by_tier.multi + stats.orgs_by_tier.enterprise) : 0

  return (
    <ErrorBoundary sectionName="Admin Analytics">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Product Analytics</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-textMuted)' }}>Revenue, conversion & adoption</p>
          </div>
          <Link href="/admin" className="text-sm" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
        </div>

        {/* Revenue */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Revenue</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="MRR" value={loading ? '—' : `€${stats?.mrr || 0}`} accent="var(--color-success)" />
            <MetricCard label="ARR" value={loading ? '—' : `€${arr}`} accent="var(--color-success)" />
            <MetricCard label="Paying Orgs" value={loading ? '—' : totalPaid} />
            <MetricCard
              label="ARPU"
              value={loading || !totalPaid ? '—' : `€${Math.round((stats?.mrr || 0) / totalPaid)}/mo`}
              accent="var(--color-primary)"
            />
          </div>
        </div>

        {/* Funnel */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Trial Funnel</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Signups" value={loading ? '—' : stats?.total_orgs ?? 0} />
            <MetricCard label="Active (7d)" value={loading ? '—' : stats?.active_orgs_7d ?? 0} accent="var(--color-success)" />
            <MetricCard label="Converted to Paid" value={loading ? '—' : totalPaid} accent="var(--color-primary)" />
            <MetricCard
              label="Conversion Rate"
              value={loading ? '—' : `${stats?.trial_to_paid_rate ?? 0}%`}
              accent={(stats?.trial_to_paid_rate ?? 0) >= 10 ? 'var(--color-success)' : 'var(--color-warning)'}
            />
          </div>
        </div>

        {/* Tier Distribution */}
        {stats && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Tier Distribution</h2>
            <div className="space-y-3">
              {(['trial', 'core', 'multi', 'enterprise'] as const).map(tier => {
                const count = stats.orgs_by_tier[tier]
                const pct = stats.total_orgs > 0 ? Math.round((count / stats.total_orgs) * 100) : 0
                const colors = {
                  trial: 'var(--color-textMuted)',
                  core: 'var(--color-primary)',
                  multi: 'var(--color-success)',
                  enterprise: 'var(--color-warning)',
                }
                return (
                  <div key={tier}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium uppercase" style={{ color: 'var(--color-text)' }}>{tier}</span>
                      <span style={{ color: 'var(--color-textMuted)' }}>{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bgHover)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: colors[tier], minWidth: count > 0 ? 8 : 0 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Activity */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Activity</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard label="New Signups (30d)" value={loading ? '—' : stats?.recent_signups_30d ?? 0} />
            <MetricCard
              label="Trials Expiring (7d)"
              value={loading ? '—' : stats?.trials_expiring_7d ?? 0}
              accent={(stats?.trials_expiring_7d ?? 0) > 0 ? 'var(--color-warning)' : undefined}
            />
            <MetricCard label="Total Users" value={loading ? '—' : stats?.total_users ?? 0} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

function MetricCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="p-4 rounded-lg" style={{ background: 'var(--color-bgHover)' }}>
      <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color: accent || 'var(--color-text)' }}>{value}</p>
    </div>
  )
}
