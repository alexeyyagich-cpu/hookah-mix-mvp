'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/AuthContext'
import { isSupabaseConfigured } from '@/lib/config'
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
  const token = params.token as string

  const [state, setState] = useState<InviteState>('loading')
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured || !token) {
      setState('error')
      setErrorMsg('Invalid link')
      return
    }

    const loadInvite = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('invite_tokens')
        .select('id, organization_id, location_id, email, role, expires_at')
        .eq('token', token)
        .is('accepted_at', null)
        .single()

      if (error || !data) {
        setState('expired')
        return
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setState('expired')
        return
      }

      // Load org name
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', data.organization_id)
        .single()

      setInvite({
        ...data,
        role: data.role as OrgRole,
        org_name: orgData?.name || 'Unknown',
      })

      if (!user) {
        setState('login_required')
      } else {
        setState('ready')
      }
    }

    loadInvite()
  }, [token, user])

  // Clean up redirect timeout on unmount
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    return () => clearTimeout(redirectTimerRef.current)
  }, [])

  const handleAccept = async () => {
    if (!user || !invite) return

    // Verify email matches the invite
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      setState('error')
      setErrorMsg(`This invite was sent to ${invite.email}. Please log in with that email address.`)
      return
    }

    setState('accepting')
    const supabase = createClient()

    try {
      // Create org_members row
      const { error: memberErr } = await supabase
        .from('org_members')
        .insert({
          organization_id: invite.organization_id,
          location_id: invite.location_id,
          user_id: user.id,
          role: invite.role,
          display_name: user.user_metadata?.owner_name || user.email?.split('@')[0] || null,
        })

      if (memberErr) {
        // If unique constraint violation, member already exists
        if (memberErr.code === '23505') {
          // Already a member — just mark invite as accepted
        } else {
          throw memberErr
        }
      }

      // Mark invite as accepted
      const { error: acceptErr } = await supabase
        .from('invite_tokens')
        .update({
          accepted_at: new Date().toISOString(),
          accepted_by: user.id,
        })
        .eq('id', invite.id)

      if (acceptErr) throw acceptErr

      setState('success')

      // Redirect to dashboard after 2s
      redirectTimerRef.current = setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Failed to accept invite')
    }
  }

  const roleLabel = invite?.role ? ORG_ROLE_LABELS[invite.role] : null

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8 text-center">
        {state === 'loading' && (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 mx-auto border-3 border-[var(--color-primary)] border-t-transparent rounded-full" />
            <p className="text-[var(--color-textMuted)]">Loading invite...</p>
          </div>
        )}

        {state === 'expired' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center text-3xl">
              ⏰
            </div>
            <h2 className="text-xl font-bold">Invite Expired</h2>
            <p className="text-[var(--color-textMuted)]">
              This invitation link has expired or has already been used. Ask the venue owner to send a new one.
            </p>
            <button onClick={() => router.push('/login')} className="btn btn-primary w-full">
              Go to Login
            </button>
          </div>
        )}

        {state === 'login_required' && invite && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-3xl">
              {roleLabel?.emoji || '🔑'}
            </div>
            <h2 className="text-xl font-bold">Join {invite.org_name}</h2>
            <p className="text-[var(--color-textMuted)]">
              You&apos;ve been invited as <strong>{roleLabel?.label || invite.role}</strong>.
              Log in or create an account to accept.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push(`/login?redirect=/join/${token}`)}
                className="btn btn-primary w-full"
              >
                Log In
              </button>
              <button
                onClick={() => router.push(`/register?invite=${token}`)}
                className="btn btn-ghost w-full"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {state === 'ready' && invite && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-3xl">
              {roleLabel?.emoji || '🔑'}
            </div>
            <h2 className="text-xl font-bold">Join {invite.org_name}</h2>
            <p className="text-[var(--color-textMuted)]">
              You&apos;ve been invited as <strong>{roleLabel?.label || invite.role}</strong>.
            </p>
            <button onClick={handleAccept} className="btn btn-primary w-full">
              Accept Invitation
            </button>
          </div>
        )}

        {state === 'accepting' && (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 mx-auto border-3 border-[var(--color-primary)] border-t-transparent rounded-full" />
            <p className="text-[var(--color-textMuted)]">Joining team...</p>
          </div>
        )}

        {state === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-success)]/10 flex items-center justify-center text-3xl">
              ✅
            </div>
            <h2 className="text-xl font-bold">Welcome to the team!</h2>
            <p className="text-[var(--color-textMuted)]">
              Redirecting to dashboard...
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center text-3xl">
              ❌
            </div>
            <h2 className="text-xl font-bold">Error</h2>
            <p className="text-[var(--color-textMuted)]">{errorMsg}</p>
            <button onClick={() => router.push('/login')} className="btn btn-primary w-full">
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
