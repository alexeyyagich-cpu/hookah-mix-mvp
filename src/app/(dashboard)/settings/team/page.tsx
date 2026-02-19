'use client'

import { useState } from 'react'
import { useTeam } from '@/lib/hooks/useTeam'
import { useRole, ORG_ROLE_LABELS } from '@/lib/hooks/useRole'
import { IconUsers, IconMail, IconTrash, IconRefresh, IconPlus } from '@/components/Icons'
import { useTranslation, useLocale } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
import type { OrgRole } from '@/types/database'

const LOCALE_MAP: Record<string, string> = { ru: 'ru-RU', en: 'en-US', de: 'de-DE' }

const INVITABLE_ROLES: OrgRole[] = ['manager', 'hookah_master', 'bartender', 'cook']

export default function TeamPage() {
  const tm = useTranslation('manage')
  const tc = useTranslation('common')
  const { locale } = useLocale()
  const router = useRouter()
  const { isOwner } = useRole()
  const { members, invitations, loading, error, inviteMember, removeMember, updateMemberRole, cancelInvitation, resendInvitation } = useTeam()

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrgRole>('hookah_master')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Only owners can access this page
  if (!isOwner) {
    router.push('/dashboard')
    return null
  }

  const getRoleLabel = (role: OrgRole) => {
    const labels = ORG_ROLE_LABELS[role]
    if (!labels) return role
    const key = locale as keyof typeof labels
    return `${labels.emoji} ${labels[key] || labels.en}`
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    setInviteError('')

    const result = await inviteMember(inviteEmail.trim(), inviteRole)

    if (result.success) {
      setInviteEmail('')
      setInviteRole('hookah_master')
      setShowInviteModal(false)
    } else {
      setInviteError(result.error || tm.inviteError)
    }

    setInviting(false)
  }

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(tm.confirmRemoveStaff(name))) return

    setActionLoading(memberId)
    await removeMember(memberId)
    setActionLoading(null)
  }

  const handleRoleChange = async (memberId: string, newRole: OrgRole) => {
    setActionLoading(`role-${memberId}`)
    await updateMemberRole(memberId, newRole)
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

      {/* Members List */}
      <div className="card">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold">{tm.staffTitle(members.length)}</h2>
        </div>

        {members.length === 0 ? (
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
            {members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {(member.display_name || 'S')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{member.display_name || tm.defaultStaffName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as OrgRole)}
                        disabled={actionLoading === `role-${member.id}`}
                        className="text-xs px-2 py-1 rounded-lg bg-[var(--color-bgHover)] border border-[var(--color-border)] cursor-pointer"
                      >
                        {INVITABLE_ROLES.map(r => (
                          <option key={r} value={r}>{getRoleLabel(r)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-xs text-[var(--color-textMuted)] mt-1">
                      {tm.memberSince(formatDate(member.created_at))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.id, member.display_name || tm.removeStaffFallback)}
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
                      <div className="text-xs text-[var(--color-textMuted)]">
                        {getRoleLabel(invitation.role)}
                      </div>
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
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {locale === 'ru' ? 'Роль' : locale === 'de' ? 'Rolle' : 'Role'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {INVITABLE_ROLES.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInviteRole(r)}
                      className={`px-3 py-2 rounded-xl text-sm text-left transition-colors ${
                        inviteRole === r
                          ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] border'
                          : 'bg-[var(--color-bgHover)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                      }`}
                    >
                      {getRoleLabel(r)}
                    </button>
                  ))}
                </div>
              </div>

              {inviteError && (
                <p className="text-sm text-[var(--color-danger)]">{inviteError}</p>
              )}

              <p className="text-sm text-[var(--color-textMuted)]">
                {tm.inviteLinkHint}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteEmail('')
                    setInviteRole('hookah_master')
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
