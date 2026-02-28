'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Link from 'next/link'
import type { Organization, OrgMember, Location } from '@/types/database'

interface OrgDetail extends Organization {
  members: OrgMember[]
  locations: Location[]
}

export default function AdminOrgDetail() {
  const { id } = useParams<{ id: string }>()
  const { isSuperAdmin, user } = useAuth()
  const [org, setOrg] = useState<OrgDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrg = useCallback(async () => {
    if (!user || !id) return
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('No session')

      // Fetch org + members + locations via admin API
      const res = await fetch(`/api/admin/organizations?detail=${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      // If array response (list), find our org; otherwise use directly
      if (Array.isArray(data)) {
        const found = data.find((o: Organization) => o.id === id)
        if (!found) throw new Error('Organization not found')
        setOrg({ ...found, members: [], locations: [] })
      } else {
        setOrg(data)
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [user, id])

  useEffect(() => { fetchOrg() }, [fetchOrg])

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--color-textMuted)' }}>Access denied</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded-lg skeleton" />
        <div className="card p-5 h-48 skeleton" />
        <div className="card p-5 h-32 skeleton" />
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className="space-y-4">
        <Link href="/admin/organizations" className="text-sm" style={{ color: 'var(--color-primary)' }}>
          ← Back to Organizations
        </Link>
        <div className="card p-4" style={{ background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: 'var(--color-danger)' }}>
          {error || 'Organization not found'}
        </div>
      </div>
    )
  }

  const tierColor = {
    trial: 'var(--color-textMuted)',
    core: 'var(--color-primary)',
    multi: 'var(--color-success)',
    enterprise: 'var(--color-warning)',
  }[org.subscription_tier] || 'var(--color-textMuted)'

  return (
    <ErrorBoundary sectionName="Admin Org Detail">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/organizations" className="text-sm" style={{ color: 'var(--color-primary)' }}>
            ← Organizations
          </Link>
        </div>

        {/* Header */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{org.name}</h1>
              {org.slug && <p className="text-sm mt-1" style={{ color: 'var(--color-textMuted)' }}>/{org.slug}</p>}
            </div>
            <span
              className="text-sm px-3 py-1 rounded-full font-medium uppercase"
              style={{ background: `color-mix(in srgb, ${tierColor} 20%, transparent)`, color: tierColor }}
            >
              {org.subscription_tier}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <InfoItem label="Created" value={new Date(org.created_at).toLocaleDateString()} />
            <InfoItem label="Updated" value={new Date(org.updated_at).toLocaleDateString()} />
            <InfoItem
              label="Subscription Expires"
              value={org.subscription_expires_at ? new Date(org.subscription_expires_at).toLocaleDateString() : 'N/A'}
            />
            <InfoItem
              label="Trial Expires"
              value={org.trial_expires_at ? new Date(org.trial_expires_at).toLocaleDateString() : 'N/A'}
            />
          </div>

          {org.stripe_customer_id && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-textMuted)' }}>
                Stripe Customer: <span className="font-mono text-xs">{org.stripe_customer_id}</span>
              </p>
              {org.stripe_subscription_id && (
                <p className="text-sm mt-1" style={{ color: 'var(--color-textMuted)' }}>
                  Stripe Subscription: <span className="font-mono text-xs">{org.stripe_subscription_id}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Members */}
        {org.members && org.members.length > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Members ({org.members.length})
            </h2>
            <div className="space-y-2">
              {org.members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--color-bgHover)' }}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>{m.display_name || 'Unnamed'}</p>
                    <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>User: {m.user_id.slice(0, 8)}...</p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      background: m.role === 'owner' ? 'color-mix(in srgb, var(--color-warning) 20%, transparent)' : 'var(--color-bgAccent)',
                      color: m.role === 'owner' ? 'var(--color-warning)' : 'var(--color-textMuted)',
                    }}
                  >
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locations */}
        {org.locations && org.locations.length > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Locations ({org.locations.length})
            </h2>
            <div className="space-y-2">
              {org.locations.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--color-bgHover)' }}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>{l.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                      {l.address || 'No address'} · {l.business_type} · Modules: {l.active_modules?.join(', ') || 'none'}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-textMuted)' }}>{l.locale}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ID for debugging */}
        <p className="text-xs font-mono" style={{ color: 'var(--color-textMuted)' }}>
          ID: {org.id}
        </p>
      </div>
    </ErrorBoundary>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>{label}</p>
      <p className="font-medium mt-0.5" style={{ color: 'var(--color-text)' }}>{value}</p>
    </div>
  )
}
