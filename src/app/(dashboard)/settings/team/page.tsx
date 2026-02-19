'use client'

import { useState } from 'react'
import { useTeam } from '@/lib/hooks/useTeam'
import { useRole } from '@/lib/hooks/useRole'
import { IconUsers, IconMail, IconTrash, IconRefresh, IconPlus } from '@/components/Icons'
import { useTranslation, useLocale } from '@/lib/i18n'
import { useRouter } from 'next/navigation'

const LOCALE_MAP: Record<string, string> = { ru: 'ru-RU', en: 'en-US', de: 'de-DE' }

export default function TeamPage() {
  const tm = useTranslation('manage')
  const tc = useTranslation('common')
  const { locale } = useLocale()
  const router = useRouter()
  const { isOwner } = useRole()
  const { staff, invitations, loading, error, inviteStaff, removeStaff, cancelInvitation, resendInvitation } = useTeam()

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Only owners can access this page
  if (!isOwner) {
    router.push('/dashboard')
    return null
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    setInviteError('')

    const result = await inviteStaff(inviteEmail.trim())

    if (result.success) {
      setInviteEmail('')
      setShowInviteModal(false)
    } else {
      setInviteError(result.error || tm.inviteError)
    }

    setInviting(false)
  }

  const handleRemoveStaff = async (staffId: string, name: string) => {
    if (!confirm(tm.confirmRemoveStaff(name))) return

    setActionLoading(staffId)
    await removeStaff(staffId)
    setActionLoading(null)
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm(tm.confirmCancelInvitation)) return

    setActionLoading(invitationId)
    await cancelInvitation(invitationId)
    setActionLoading(null)
  }

  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading(`resend-${invitationId}`)
    await resendInvitation(invitationId)
    setActionLoading(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(LOCALE_MAP[locale] || 'ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getDaysUntilExpiry = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <IconUsers size={28} />
            {tm.teamTitle}
          </h1>
          <p className="text-[var(--color-textMuted)] mt-1">
            {tm.teamDescription}
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <IconPlus size={18} />
          {tm.inviteMember}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {/* Staff List */}
      <div className="card">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold">{tm.staffTitle(staff.length)}</h2>
        </div>

        {staff.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bgHover)] flex items-center justify-center">
              <IconUsers size={32} className="text-[var(--color-textMuted)]" />
            </div>
            <p className="text-[var(--color-textMuted)] mb-2">
              {tm.noTeamMembers}
            </p>
            <p className="text-sm text-[var(--color-textMuted)]">
              {tm.inviteStaffHint}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {staff.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {(member.owner_name || 'S')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{member.owner_name || tm.defaultStaffName}</div>
                    {member.phone && (
                      <div className="text-sm text-[var(--color-textMuted)]">{member.phone}</div>
                    )}
                    <div className="text-xs text-[var(--color-textMuted)]">
                      {tm.memberSince(formatDate(member.created_at))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveStaff(member.id, member.owner_name || tm.removeStaffFallback)}
                  disabled={actionLoading === member.id}
                  className="p-2 rounded-lg hover:bg-[var(--color-danger)]/10 text-[var(--color-textMuted)] hover:text-[var(--color-danger)] transition-colors disabled:opacity-50"
                  title={tm.removeFromTeamTooltip}
                >
                  {actionLoading === member.id ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <IconTrash size={20} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold">{tm.pendingInvitations(invitations.length)}</h2>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {invitations.map((invitation) => {
              const daysLeft = getDaysUntilExpiry(invitation.expires_at)

              return (
                <div key={invitation.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-bgHover)] flex items-center justify-center">
                      <IconMail size={24} className="text-[var(--color-textMuted)]" />
                    </div>
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-[var(--color-textMuted)]">
                        {tm.inviteSentAt(formatDate(invitation.created_at))}
                      </div>
                      <div className={`text-xs ${daysLeft <= 2 ? 'text-[var(--color-warning)]' : 'text-[var(--color-textMuted)]'}`}>
                        {tm.expiresInDays(daysLeft)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResendInvitation(invitation.id)}
                      disabled={actionLoading === `resend-${invitation.id}`}
                      className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
                      title={tm.resendTooltip}
                    >
                      {actionLoading === `resend-${invitation.id}` ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <IconRefresh size={20} />
                      )}
                    </button>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={actionLoading === invitation.id}
                      className="p-2 rounded-lg hover:bg-[var(--color-danger)]/10 text-[var(--color-textMuted)] hover:text-[var(--color-danger)] transition-colors disabled:opacity-50"
                      title={tm.cancelInvitationTooltip}
                    >
                      {actionLoading === invitation.id ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <IconTrash size={20} />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="card p-5 bg-[var(--color-primary)]/5 border-[var(--color-primary)]/20">
        <h3 className="font-semibold mb-2">{tm.staffPermissionsTitle}</h3>
        <ul className="space-y-2 text-sm text-[var(--color-textMuted)]">
          <li className="flex items-center gap-2">
            <span className="text-[var(--color-success)]">✓</span>
            {tm.staffCanViewInventory}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[var(--color-success)]">✓</span>
            {tm.staffCanCreateSessions}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[var(--color-success)]">✓</span>
            {tm.staffCanUseMixer}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[var(--color-danger)]">✗</span>
            {tm.staffCannotEditInventory}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[var(--color-danger)]">✗</span>
            {tm.staffCannotViewStats}
          </li>
        </ul>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{tm.inviteMember}</h2>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {tm.staffEmailLabel}
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="staff@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                  required
                  autoFocus
                />
                {inviteError && (
                  <p className="text-sm text-[var(--color-danger)] mt-2">{inviteError}</p>
                )}
              </div>

              <p className="text-sm text-[var(--color-textMuted)]">
                {tm.inviteLinkHint}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteEmail('')
                    setInviteError('')
                  }}
                  className="btn btn-ghost flex-1"
                >
                  {tc.cancel}
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {inviting ? tm.sending : tm.send}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
