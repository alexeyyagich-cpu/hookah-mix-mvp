'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/AuthContext'
import { isSupabaseConfigured } from '@/lib/config'
import { useTranslation } from '@/lib/i18n'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { IconWarning } from '@/components/Icons'
import { ORG_ROLE_LABELS } from '@/lib/hooks/useRole'
import type { OrgRole } from '@/types/database'

type InviteState = 'loading' | 'ready' | 'accepting' | 'success' | 'expired' | 'error' | 'login_required'

interface InviteData {
  id: string
  organization_id: string
  location_id: string | null
  email: string
  role: OrgRole
  expires_at: string
  org_name?: string
}

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const t = useTranslation('auth')
  const token = params.token as string

  const [state, setState] = useState<InviteState>('loading')
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured || !token) {
      setState('error')
      setErrorMsg(t.invalidLink)
      return
    }

    const loadInvite = async () => {
      const supabase = createClient()

      // Use secure RPC instead of direct table query
      // (invite_tokens SELECT is restricted to org admins only)
      const { data, error } = await supabase.rpc('lookup_invite', { p_token: token })

      if (error || !data) {
        setState('expired')
        return
      }

      // Check if expired (server already filters, but double-check client-side)
      if (new Date(data.expires_at) < new Date()) {
        setState('expired')
        return
      }

      setInvite({
        ...data,
        role: data.role as OrgRole,
      })

      if (!user) {
        setState('login_required')
      } else {
        setState('ready')
      }
    }

    loadInvite()
  }, [token, user, t.invalidLink])

  // Clean up redirect timeout on unmount
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    return () => clearTimeout(redirectTimerRef.current)
  }, [])

  const handleAccept = async () => {
    if (!user || !invite) return

    // Client-side email check (server also validates)
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      setState('error')
      setErrorMsg(t.inviteEmailMismatch(invite.email))
      return
    }

    setState('accepting')
    const supabase = createClient()

    try {
      // Use secure RPC: validates email, creates membership, marks accepted — atomically
      const { data, error } = await supabase.rpc('accept_invite', { p_token: token })

      if (error) throw error
      if (!data?.success) throw new Error(t.inviteAcceptFailed)

      setState('success')

      // Redirect to dashboard after 2s
      redirectTimerRef.current = setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : t.inviteAcceptFailed)
    }
  }

  const roleLabel = invite?.role ? ORG_ROLE_LABELS[invite.role] : null

  return (
    <ErrorBoundary sectionName="Join Team">
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8 text-center">
        {state === 'loading' && (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 mx-auto border-3 border-[var(--color-primary)] border-t-transparent rounded-full" />
            <p className="text-[var(--color-textMuted)]">{t.loadingInvite}</p>
          </div>
        )}

        {state === 'expired' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center text-3xl">
              ⏰
            </div>
            <h2 className="text-xl font-bold">{t.inviteExpired}</h2>
            <p className="text-[var(--color-textMuted)]">
              {t.inviteExpiredDesc}
            </p>
            <button type="button" onClick={() => router.push('/login')} className="btn btn-primary w-full">
              {t.goToLogin}
            </button>
          </div>
        )}

        {state === 'login_required' && invite && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-3xl">
              {roleLabel?.emoji || '🔑'}
            </div>
            <h2 className="text-xl font-bold">{t.joinOrg(invite.org_name || '')}</h2>
            <p className="text-[var(--color-textMuted)]">
              {t.inviteDescriptionLogin(roleLabel?.label || invite.role)}
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => router.push(`/login?redirect=/join/${token}`)}
                className="btn btn-primary w-full"
              >
                {t.login}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/register?invite=${token}`)}
                className="btn btn-ghost w-full"
              >
                {t.register}
              </button>
            </div>
          </div>
        )}

        {state === 'ready' && invite && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-3xl">
              {roleLabel?.emoji || '🔑'}
            </div>
            <h2 className="text-xl font-bold">{t.joinOrg(invite.org_name || '')}</h2>
            <p className="text-[var(--color-textMuted)]">
              {t.inviteDescription(roleLabel?.label || invite.role)}
            </p>
            <button type="button" onClick={handleAccept} disabled={state !== 'ready'} className="btn btn-primary w-full disabled:opacity-50">
              {t.acceptInvite}
            </button>
          </div>
        )}

        {state === 'accepting' && (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 mx-auto border-3 border-[var(--color-primary)] border-t-transparent rounded-full" />
            <p className="text-[var(--color-textMuted)]">{t.joiningTeam}</p>
          </div>
        )}

        {state === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-success)]/10 flex items-center justify-center text-3xl">
              ✅
            </div>
            <h2 className="text-xl font-bold">{t.welcomeToTeam}</h2>
            <p className="text-[var(--color-textMuted)]">
              {t.redirectingDashboard}
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center">
              <IconWarning size={32} className="text-[var(--color-danger)]" />
            </div>
            <h2 className="text-xl font-bold">{t.error}</h2>
            <p className="text-[var(--color-textMuted)]">{errorMsg}</p>
            <button type="button" onClick={() => router.push('/login')} className="btn btn-primary w-full">
              {t.goToLogin}
            </button>
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  )
}
