'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AccessDenied } from '@/components/ui/AccessDenied'
import Link from 'next/link'
import type { AdminOrganization, SubscriptionTier } from '@/types/database'

const TIER_COLORS: Record<SubscriptionTier, string> = {
  trial: 'var(--color-textMuted)',
  core: 'var(--color-primary)',
  multi: 'var(--color-success)',
  enterprise: 'var(--color-warning)',
}

export default function AdminOrganizations() {
  const { isSuperAdmin } = useAuth()
  const [orgs, setOrgs] = useState<AdminOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterTier, setFilterTier] = useState<string>('')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }, [])

  const fetchOrgs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('No session')

      const res = await fetch('/api/admin/organizations', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setOrgs(await res.json())
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { fetchOrgs() }, [fetchOrgs])

  const updateOrg = useCallback(async (id: string, updates: Record<string, unknown>) => {
    setActionLoading(id)
    try {
      const token = await getToken()
      if (!token) throw new Error('No session')

      const res = await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      // Refresh
      await fetchOrgs()
    } catch (err) {
      setError(String(err))
    } finally {
      setActionLoading(null)
    }
  }, [getToken, fetchOrgs])

  const extendTrial = useCallback((id: string) => {
    const newExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    updateOrg(id, { trial_expires_at: newExpiry })
  }, [updateOrg])

  const changeTier = useCallback((id: string, tier: SubscriptionTier) => {
    const expires = tier === 'trial'
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    updateOrg(id, {
      subscription_tier: tier,
      ...(tier === 'trial'
        ? { trial_expires_at: expires }
        : { subscription_expires_at: expires }),
    })
  }, [updateOrg])

  if (!isSuperAdmin) {
    return <AccessDenied />
  }

  // Filter & search
  const filtered = orgs.filter(o => {
    if (filterTier && o.subscription_tier !== filterTier) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        o.name.toLowerCase().includes(q) ||
        (o.slug || '').toLowerCase().includes(q) ||
        (o.owner_name || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <ErrorBoundary sectionName="Admin Organizations">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Organizations
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-textMuted)' }}>
              {orgs.length} total
            </p>
          </div>
          <Link href="/admin" className="text-sm" style={{ color: 'var(--color-primary)' }}>
            ← Dashboard
          </Link>
        </div>

        {error && (
          <div className="card p-4" style={{ background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search name, slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input px-3 py-2 text-sm rounded-lg"
            style={{ background: 'var(--color-bgHover)', color: 'var(--color-text)', border: '1px solid var(--color-border)', minWidth: 200 }}
          />
          <select
            value={filterTier}
            onChange={e => setFilterTier(e.target.value)}
            className="filter-select"
            style={{ background: filterTier ? 'var(--color-primary)' : 'var(--color-bgHover)', color: filterTier ? '#fff' : 'var(--color-text)' }}
          >
            <option value="">All tiers</option>
            <option value="trial">Trial</option>
            <option value="core">Core</option>
            <option value="multi">Multi</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card p-4 h-16 skeleton" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(org => (
              <div key={org.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="font-semibold truncate hover:underline"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {org.name}
                    </Link>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium uppercase"
                      style={{ background: `color-mix(in srgb, ${TIER_COLORS[org.subscription_tier]} 20%, transparent)`, color: TIER_COLORS[org.subscription_tier] }}
                    >
                      {org.subscription_tier}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs mt-1" style={{ color: 'var(--color-textMuted)' }}>
                    {org.slug && <span>/{org.slug}</span>}
                    <span>{org.member_count} members</span>
                    <span>{org.location_count} locations</span>
                    {org.owner_name && <span>Owner: {org.owner_name}</span>}
                    <span>Created: {new Date(org.created_at).toLocaleDateString()}</span>
                    {org.subscription_tier === 'trial' && org.trial_expires_at && (
                      <span style={{ color: new Date(org.trial_expires_at) < new Date() ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                        Trial: {daysUntil(org.trial_expires_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {org.subscription_tier === 'trial' && (
                    <button
                      onClick={() => extendTrial(org.id)}
                      disabled={actionLoading === org.id}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)' }}
                    >
                      {actionLoading === org.id ? '...' : '+14d trial'}
                    </button>
                  )}
                  <select
                    value=""
                    onChange={e => {
                      if (e.target.value) changeTier(org.id, e.target.value as SubscriptionTier)
                    }}
                    className="text-xs px-2 py-1.5 rounded-lg"
                    style={{ background: 'var(--color-bgHover)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                    disabled={actionLoading === org.id}
                  >
                    <option value="">Change tier...</option>
                    {(['trial', 'core', 'multi', 'enterprise'] as SubscriptionTier[])
                      .filter(t => t !== org.subscription_tier)
                      .map(t => <option key={t} value={t}>{t}</option>)
                    }
                  </select>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="card p-8 text-center" style={{ color: 'var(--color-textMuted)' }}>
                No organizations found
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

function daysUntil(dateStr: string): string {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `expired ${Math.abs(diff)}d ago`
  if (diff === 0) return 'expires today'
  return `${diff}d left`
}
