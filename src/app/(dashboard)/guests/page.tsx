'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useGuests } from '@/lib/hooks/useGuests'
import { useLoyalty } from '@/lib/hooks/useLoyalty'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { GuestCard } from '@/components/dashboard/GuestCard'
import { GuestDetailModal } from '@/components/dashboard/GuestDetailModal'
import { LoyaltySettingsPanel } from '@/components/dashboard/LoyaltySettingsPanel'
import { useTranslation } from '@/lib/i18n'
import { IconSearch, IconPlus, IconUsers, IconSettings, IconLock } from '@/components/Icons'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Guest, LoyaltyTier } from '@/types/database'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PageBackground } from '@/components/ui/PageBackground'

type SortBy = 'name' | 'visits' | 'spent' | 'tier' | 'recent'

const TIER_ORDER: Record<LoyaltyTier, number> = { gold: 3, silver: 2, bronze: 1 }

export default function GuestsPage() {
  const tm = useTranslation('manage')
  const tc = useTranslation('common')
  const { guests, loading, error, addGuest, updateGuest, deleteGuest } = useGuests()
  const { settings: loyaltySettings, updateSettings, getBonusHistory } = useLoyalty()
  const { canUseCRM } = useSubscription()

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('recent')
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const filteredGuests = useMemo(() => {
    let result = guests

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.phone?.toLowerCase().includes(q) ||
        g.notes?.toLowerCase().includes(q)
      )
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'visits':
          return b.visit_count - a.visit_count
        case 'spent':
          return b.total_spent - a.total_spent
        case 'tier':
          return TIER_ORDER[b.loyalty_tier] - TIER_ORDER[a.loyalty_tier]
        case 'recent':
        default:
          return new Date(b.last_visit_at || 0).getTime() - new Date(a.last_visit_at || 0).getTime()
      }
    })

    return result
  }, [guests, search, sortBy])

  const handleAddGuest = async () => {
    if (!newName.trim()) return
    try {
      await addGuest({ name: newName.trim(), phone: newPhone.trim() || null })
      setNewName('')
      setNewPhone('')
      setShowAddForm(false)
      toast.success(tc.saved)
    } catch {
      toast.error(tc.errorSaving)
    }
  }

  if (!canUseCRM) {
    return (
      <ErrorBoundary sectionName="Guest Form">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{tm.guestsTitle}</h1>
        <EmptyState
          icon={<IconLock size={32} />}
          title={tm.guestsProOnly}
          description={tm.guestsProOnlyDesc}
          action={{ label: tm.upgradePlan, href: '/pricing' }}
        />
      </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary sectionName="Guests">
    <div className="space-y-6">
      <PageBackground image="/images/dashboard-bg.jpg" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tm.guestsTitle}</h1>
          <p className="text-[var(--color-textMuted)]">
            {tm.guestsSubtitle} ({guests.length})
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-ghost"
            aria-label={tm.loyaltySettings}
          >
            <IconSettings size={18} />
          </button>
          <button type="button"
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <IconPlus size={18} />
            {tm.addGuest}
          </button>
        </div>
      </div>

      {/* Loyalty Settings Panel */}
      {showSettings && (
        <LoyaltySettingsPanel
          settings={loyaltySettings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Add Guest Form */}
      {showAddForm && (
        <form className="card p-4" onSubmit={(e) => { e.preventDefault(); handleAddGuest() }}>
          <h3 className="font-semibold mb-3">{tm.addGuest}</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={tm.guestNamePlaceholder}
              className="input flex-1"
              autoFocus
            />
            <input
              type="tel"
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              placeholder={tm.guestPhonePlaceholder}
              className="input w-full sm:w-48"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={!newName.trim()} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {tm.save}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-ghost">
                {tm.cancel}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-textMuted)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tm.searchGuests}
            aria-label={tm.searchGuests}
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex bg-[var(--color-bgHover)] rounded-xl p-1">
          {([
            { key: 'recent' as SortBy, label: tm.sortRecent },
            { key: 'visits' as SortBy, label: tm.sortVisits },
            { key: 'spent' as SortBy, label: tm.sortSpent },
            { key: 'tier' as SortBy, label: tm.sortTier },
          ]).map(s => (
            <button type="button"
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === s.key
                  ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                  : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <p className="text-[var(--color-danger)] text-sm">{error}</p>
        </div>
      )}

      {/* Guest List */}
      {loading ? (
        <div className="card p-12 text-center">
          <LoadingSpinner size="lg" className="mx-auto" />
        </div>
      ) : filteredGuests.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={32} />}
          title={tm.noGuests}
          description={tm.noGuestsDesc}
          action={{ label: `+ ${tm.addGuest}`, onClick: () => setShowAddForm(true) }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuests.map(guest => (
            <GuestCard
              key={guest.id}
              guest={guest}
              onClick={() => setSelectedGuest(guest)}
            />
          ))}
        </div>
      )}

      {/* Guest Detail Modal */}
      {selectedGuest && (
        <GuestDetailModal
          guest={selectedGuest}
          bonusHistory={getBonusHistory(selectedGuest.id)}
          onClose={() => setSelectedGuest(null)}
          onUpdate={async (updates) => {
            try {
              await updateGuest(selectedGuest.id, updates)
              setSelectedGuest(prev => prev ? { ...prev, ...updates } : null)
              toast.success(tc.saved)
            } catch {
              toast.error(tc.errorSaving)
            }
          }}
          onDelete={async () => {
            try {
              await deleteGuest(selectedGuest.id)
              setSelectedGuest(null)
              toast.success(tc.deleted)
            } catch {
              toast.error(tc.errorDeleting)
            }
          }}
        />
      )}
    </div>
    </ErrorBoundary>
  )
}
