'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useTranslation } from '@/lib/i18n'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function AccountSection() {
  const { signOut } = useAuth()
  const ts = useTranslation('settings')
  const tc = useTranslation('common')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [message, setMessage] = useState('')
  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => { clearTimeout(msgTimerRef.current) }, [])

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(true)
  }

  const confirmDeleteAccount = async () => {
    setShowDeleteConfirm(false)
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      })
      if (res.ok) {
        await signOut()
      } else {
        const data = await res.json()
        setMessage(tc.error + ': ' + (data.error || ts.deleteError))
        msgTimerRef.current = setTimeout(() => setMessage(''), 5000)
      }
    } catch {
      setMessage(ts.deleteError)
      msgTimerRef.current = setTimeout(() => setMessage(''), 5000)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      {message && (
        <div className="p-4 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
          {message}
        </div>
      )}
      <div id="account" className="card p-6 border-[var(--color-danger)]/30 scroll-mt-4">
        <h2 className="text-lg font-semibold text-[var(--color-danger)] mb-4">
          {ts.dangerZone}
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{ts.logoutTitle}</h3>
              <p className="text-sm text-[var(--color-textMuted)]">{ts.logoutDesc}</p>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="btn btn-ghost border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
            >
              {ts.logout}
            </button>
          </div>
          <hr className="border-[var(--color-border)]" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{ts.deleteAccount}</h3>
              <p className="text-sm text-[var(--color-textMuted)]">{ts.deleteAccountDesc}</p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="btn bg-[var(--color-danger)] text-[var(--color-bg)] hover:opacity-80 disabled:opacity-50"
            >
              {deleteLoading ? tc.loading : ts.deleteAccount}
            </button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={showDeleteConfirm}
        title={ts.deleteConfirm1}
        message={ts.deleteConfirm2}
        confirmLabel={tc.delete}
        cancelLabel={tc.cancel}
        danger
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}
