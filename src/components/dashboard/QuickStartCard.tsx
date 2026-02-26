'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { useTranslation } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'

const IconCheck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)

const IconArrowRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
)

interface QuickStartStep {
  key: string
  title: string
  description: string
  href: string
  completed: boolean
  optional?: boolean
}

const STORAGE_KEY = 'quickstart_dismissed'

export function QuickStartCard() {
  const { profile, isDemoMode } = useAuth()
  const t = useTranslation('hookah')
  const tc = useTranslation('common')
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  const [dismissed, setDismissed] = useState(true) // start hidden, show after check
  const [inventoryCount, setInventoryCount] = useState<number | null>(null)
  const [sessionsCount, setSessionsCount] = useState<number | null>(null)
  const [teamCount, setTeamCount] = useState<number | null>(null)

  // Check localStorage on mount
  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === 'true')
  }, [])

  // Lightweight Supabase count queries
  useEffect(() => {
    if (!profile?.id || !supabase || isDemoMode) return

    let cancelled = false

    Promise.all([
      supabase
        .from('tobacco_inventory')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profile.id),
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profile.id),
      supabase
        .from('org_members')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .limit(1)
        .then(async (memberResult) => {
          // Get the org_id from membership, then count all members in that org
          const orgId = memberResult.data?.[0]
            ? (memberResult.data[0] as { id: string }).id
            : null
          if (!orgId && !memberResult.error) {
            // Try getting org_id via a direct member lookup
            const { data: memberData } = await supabase
              .from('org_members')
              .select('organization_id')
              .eq('user_id', profile.id)
              .eq('is_active', true)
              .limit(1)
              .single()
            if (memberData?.organization_id) {
              return supabase
                .from('org_members')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', memberData.organization_id)
                .eq('is_active', true)
            }
          }
          return { count: 1, error: null }
        }),
    ]).then(([inv, sess, team]) => {
      if (cancelled) return
      setInventoryCount(inv.count ?? 0)
      setSessionsCount(sess.count ?? 0)
      // team might be a plain object or a Supabase response
      if (team && typeof team === 'object' && 'count' in team) {
        setTeamCount(team.count ?? 1)
      } else {
        setTeamCount(1)
      }
    }).catch(() => {
      // Counts are non-critical — fail silently
    })

    return () => { cancelled = true }
  }, [profile?.id, supabase, isDemoMode])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setDismissed(true)
  }

  // Build steps
  const steps: QuickStartStep[] = useMemo(() => [
    {
      key: 'add-tobacco',
      title: t.quickStartAddTobacco,
      description: t.quickStartAddTobaccoDesc,
      href: '/inventory',
      completed: (inventoryCount ?? 0) > 0,
    },
    {
      key: 'create-mix',
      title: t.quickStartCreateMix,
      description: t.quickStartCreateMixDesc,
      href: '/mix',
      completed: (sessionsCount ?? 0) > 0,
    },
    {
      key: 'setup-profile',
      title: t.quickStartSetupProfile,
      description: t.quickStartSetupProfileDesc,
      href: '/settings',
      completed: !!(profile?.business_name && profile?.phone),
    },
    {
      key: 'invite-team',
      title: t.quickStartInviteTeam,
      description: t.quickStartInviteTeamDesc,
      href: '/settings/team',
      completed: (teamCount ?? 1) > 1,
      optional: true,
    },
  ], [t, inventoryCount, sessionsCount, teamCount, profile?.business_name, profile?.phone])

  const completedCount = steps.filter(s => s.completed).length
  const totalCount = steps.length
  const allCompleted = completedCount === totalCount

  // Don't render if dismissed, all complete, demo mode, or still loading initial data
  if (dismissed || allCompleted || isDemoMode) return null
  if (inventoryCount === null || sessionsCount === null) return null

  const progressPercent = (completedCount / totalCount) * 100

  return (
    <div className="card overflow-hidden border-[var(--color-primary)]/30 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent">
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">{t.quickStartTitle}</h3>
          <span className="text-sm font-medium text-[var(--color-primary)]">
            {t.quickStartProgress(completedCount, totalCount)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-[var(--color-surface)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="p-5 pt-4 space-y-1">
        {steps.map((step, index) => (
          <Link
            key={step.key}
            href={step.href}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              step.completed
                ? 'opacity-60'
                : 'hover:bg-[var(--color-surface)]'
            }`}
          >
            {/* Step indicator */}
            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${
              step.completed
                ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
            }`}>
              {step.completed ? <IconCheck size={16} /> : index + 1}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${step.completed ? 'line-through text-[var(--color-textMuted)]' : ''}`}>
                {step.title}
                {step.optional && (
                  <span className="ml-1.5 text-xs font-normal text-[var(--color-textMuted)]">
                    ({tc.optional})
                  </span>
                )}
              </div>
              <div className="text-xs text-[var(--color-textMuted)] truncate">
                {step.description}
              </div>
            </div>

            {/* Arrow */}
            {!step.completed && (
              <div className="shrink-0 text-[var(--color-textMuted)]">
                <IconArrowRight size={16} />
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Dismiss */}
      <div className="px-5 pb-4">
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
        >
          {t.quickStartDismiss}
        </button>
      </div>
    </div>
  )
}
