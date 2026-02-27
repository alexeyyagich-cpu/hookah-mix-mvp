'use client'

import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSessions } from '@/lib/hooks/useSessions'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { SessionCard } from '@/components/dashboard/SessionCard'
import { IconSmoke, IconCalendar, IconWarning, IconBowl, IconPlus, IconExport, IconLock, IconChart } from '@/components/Icons'
import { EmptyState } from '@/components/ui/EmptyState'
import { exportSessionsCSV, exportSessionsPDF } from '@/lib/utils/exportReport'
import type { SessionWithItems } from '@/types/database'
import Link from 'next/link'
import { useTranslation, useLocale, formatDateTime } from '@/lib/i18n'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function SessionsPage() {
  return (
    <Suspense>
      <SessionsPageInner />
    </Suspense>
  )
}

function SessionsPageInner() {
  const t = useTranslation('hookah')
  const tc = useTranslation('common')
  const { locale } = useLocale()
  const { sessions, loading, error, updateSession, deleteSession } = useSessions()
  const { isFreeTier, canExport } = useSubscription()

  const searchParams = useSearchParams()
  const router = useRouter()
  const filter = searchParams.get('filter') || ''
  const setFilter = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('filter', value)
    else params.delete('filter')
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])
  const [selectedSession, setSelectedSession] = useState<SessionWithItems | null>(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [closingModal, setClosingModal] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const closeModal = useCallback(() => {
    setClosingModal(true)
    setTimeout(() => {
      setSelectedSession(null)
      setClosingModal(false)
    }, 200)
  }, [])

  // Background portal
  const [bgContainer, setBgContainer] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setBgContainer(document.getElementById('page-background'))
    return () => setBgContainer(null)
  }, [])

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSessions = useMemo(() => filter
    ? sessions.filter(session =>
        session.session_items?.some(item =>
          item.brand.toLowerCase().includes(filter.toLowerCase()) ||
          item.flavor.toLowerCase().includes(filter.toLowerCase())
        )
      )
    : sessions, [sessions, filter])

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!canExport || filteredSessions.length === 0) return
    if (format === 'csv') {
      exportSessionsCSV(filteredSessions)
    } else {
      void exportSessionsPDF(filteredSessions)
    }
    setExportMenuOpen(false)
  }

  const handleRate = async (id: string, rating: number) => {
    try {
      await updateSession(id, { rating })
      toast.success(tc.saved)
    } catch {
      toast.error(tc.errorSaving)
    }
  }

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id)
  }

  const confirmDelete = async () => {
    try {
      if (confirmDeleteId) await deleteSession(confirmDeleteId)
      setConfirmDeleteId(null)
      toast.success(tc.deleted)
    } catch {
      toast.error(tc.errorDeleting)
    }
  }

  return (
    <ErrorBoundary>
    <div className="space-y-6 relative">
      {/* Background Image via Portal */}
      {bgContainer && createPortal(
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'url(/images/sessions-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />,
        bgContainer
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.sessionHistory}</h1>
          <p className="text-[var(--color-textMuted)]">
            {t.sessionsSubtitle(sessions.length)}
            {isFreeTier && ` ${t.sessionsFreeTierNotice}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Button with Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button type="button"
              onClick={() => canExport && setExportMenuOpen(!exportMenuOpen)}
              disabled={!canExport || sessions.length === 0}
              className="btn btn-ghost disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={canExport ? t.exportSessions : t.exportProOnly}
            >
              <IconExport size={18} />
              {!canExport && <IconLock size={14} />}
            </button>

            {exportMenuOpen && canExport && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-lg z-50 overflow-hidden">
                <button type="button"
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] flex items-center gap-2 transition-colors"
                >
                  <IconChart size={16} />
                  {t.exportCSV}
                </button>
                <button type="button"
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] flex items-center gap-2 transition-colors border-t border-[var(--color-border)]"
                >
                  <IconExport size={16} />
                  {t.exportPDF}
                </button>
              </div>
            )}
          </div>

          <Link href="/mix" className="btn btn-primary flex items-center gap-2">
            <IconPlus size={18} />
            {t.createSession}
          </Link>
        </div>
      </div>

      {/* Free Tier Notice */}
      {isFreeTier && (
        <div className="card p-4 border-[var(--color-warning)]/50 bg-[var(--color-warning)]/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-warning)]/20 flex items-center justify-center text-[var(--color-warning)]">
              <IconCalendar size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold">{t.limitedHistory}</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                {t.limitedHistoryDesc}
              </p>
            </div>
            <a href="/pricing" className="btn btn-primary">
              {tc.upgrade}
            </a>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t.searchTobaccos}
          aria-label={tc.search}
          className="w-full px-4 py-3 pl-10 rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-textMuted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-danger)]/20 flex items-center justify-center text-[var(--color-danger)]">
              <IconWarning size={20} />
            </div>
            <p className="text-[var(--color-danger)]">{error}</p>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-8 h-8 mx-auto border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-[var(--color-textMuted)]">{t.loadingSessions}</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          icon={<IconSmoke size={32} />}
          title={filter ? t.noResults : t.noSessions}
          description={filter ? t.tryDifferentSearch : t.startFirstSession}
          action={!filter ? { label: t.createMix, href: '/mix' } : undefined}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onView={setSelectedSession}
              onDelete={handleDelete}
              onRate={handleRate}
            />
          ))}
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm ${closingModal ? 'animate-backdropFadeOut' : ''}`}>
          <div role="dialog" aria-modal="true" aria-labelledby="session-modal-title" className={`w-full max-w-lg bg-[var(--color-bgCard)] rounded-2xl border border-[var(--color-border)] ${closingModal ? 'animate-fadeOutDown' : 'animate-scaleIn'}`}>
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 id="session-modal-title" className="text-xl font-bold">{t.sessionDetails}</h2>
              <button type="button"
                onClick={closeModal}
                aria-label={tc.close}
                className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Date & Bowl */}
              <div className="flex items-center justify-between">
                <div className="text-[var(--color-textMuted)]">
                  {formatDateTime(selectedSession.session_date, locale)}
                </div>
                {selectedSession.bowl_type && (
                  <span className="badge badge-primary flex items-center gap-1">
                    <IconBowl size={14} />
                    {selectedSession.bowl_type.name}
                  </span>
                )}
              </div>

              {/* Mix Items */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold">{t.mixComposition}</h3>
                {selectedSession.session_items?.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{item.flavor}</div>
                      <div className="text-sm text-[var(--color-textMuted)]">{item.brand}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item.percentage}%</div>
                      <div className="text-sm text-[var(--color-textMuted)]">{item.grams_used}{tc.grams}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-[var(--color-bgHover)]">
                  <div className="text-2xl font-bold">{selectedSession.total_grams}{tc.grams}</div>
                  <div className="text-xs text-[var(--color-textMuted)]">{t.totalLabel}</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-[var(--color-bgHover)]">
                  <div className={`text-2xl font-bold ${
                    (selectedSession.compatibility_score || 0) >= 80 ? 'text-[var(--color-success)]' :
                    (selectedSession.compatibility_score || 0) >= 60 ? 'text-[var(--color-primary)]' :
                    'text-[var(--color-warning)]'
                  }`}>
                    {selectedSession.compatibility_score || '—'}%
                  </div>
                  <div className="text-xs text-[var(--color-textMuted)]">{t.compatibilityLabel}</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-[var(--color-bgHover)]">
                  <div className="text-2xl font-bold text-[var(--color-primary)]">
                    {selectedSession.rating ? '★'.repeat(selectedSession.rating) : '—'}
                  </div>
                  <div className="text-xs text-[var(--color-textMuted)]">{t.ratingLabel}</div>
                </div>
              </div>

              {/* Notes */}
              {selectedSession.notes && (
                <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
                  <h4 className="font-medium mb-2">{t.sessionNotes}</h4>
                  <p className="text-[var(--color-textMuted)]">{selectedSession.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[var(--color-border)] flex justify-end">
              <button type="button"
                onClick={closeModal}
                className="btn btn-ghost"
              >
                {tc.close}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={!!confirmDeleteId}
        title={t.deleteSessionConfirm}
        message={tc.deleteWarning}
        confirmLabel={tc.delete}
        cancelLabel={tc.cancel}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
    </ErrorBoundary>
  )
}
