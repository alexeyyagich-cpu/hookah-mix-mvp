'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useSavedMixes } from '@/lib/hooks/useSavedMixes'
import { IconStar, IconMix, IconTrash } from '@/components/Icons'
import { MixRating, MixNotes } from './MixRating'
import type { SavedMix, SavedMixTobacco } from '@/types/database'

interface SavedMixesDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelectMix: (tobaccos: SavedMixTobacco[], mixId: string) => void
}

type SortOption = 'recent' | 'popular' | 'favorite' | 'rating'
type FilterOption = 'all' | 'favorites'

export function SavedMixesDrawer({ isOpen, onClose, onSelectMix }: SavedMixesDrawerProps) {
  const t = useTranslation('hookah')
  const { savedMixes, loading, deleteMix, toggleFavorite, incrementUsage, updateMix } = useSavedMixes()
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Filter and sort mixes
  const filteredMixes = savedMixes
    .filter(mix => filterBy === 'all' || mix.is_favorite)
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.usage_count - a.usage_count
        case 'favorite':
          if (a.is_favorite === b.is_favorite) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
          return a.is_favorite ? -1 : 1
        case 'rating':
          // Sort by rating (nulls last), then by date
          if (a.rating === null && b.rating === null) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
          if (a.rating === null) return 1
          if (b.rating === null) return -1
          return b.rating - a.rating
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  const handleSelect = async (mix: SavedMix) => {
    await incrementUsage(mix.id)
    onSelectMix(mix.tobaccos, mix.id)
    onClose()
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      await deleteMix(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md z-[70] animate-slideInRight overflow-hidden flex flex-col"
        style={{
          background: 'var(--color-bgCard)',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          className="p-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              {t.mixMyMixes}
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
              {t.mixSavedCount(savedMixes.length)}
            </p>
          </div>
          <button type="button"
            onClick={onClose}
            aria-label={t.mixCloseDrawer}
            className="icon-btn icon-btn-sm icon-btn-ghost"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-3 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {/* Filter tabs */}
          <div className="flex gap-2">
            {[
              { value: 'all' as FilterOption, label: t.mixFilterAll },
              { value: 'favorites' as FilterOption, label: t.mixFilterFavorites },
            ].map(option => (
              <button type="button"
                key={option.value}
                onClick={() => setFilterBy(option.value)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: filterBy === option.value ? 'var(--color-primary)' : 'var(--color-bgHover)',
                  color: filterBy === option.value ? 'var(--color-bg)' : 'var(--color-text)',
                }}
              >
                {option.value === 'favorites' && <IconStar size={14} className="inline mr-1 text-[var(--color-warning)]" />}
                {option.label}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
              {t.mixSortLabel}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-2 py-1 rounded-lg text-sm"
              style={{
                background: 'var(--color-bgHover)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <option value="recent">{t.mixSortRecent}</option>
              <option value="popular">{t.mixSortPopular}</option>
              <option value="rating">{t.mixSortRating}</option>
              <option value="favorite">{t.mixSortFavorite}</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMixes.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--color-textMuted)' }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-bgHover)] flex items-center justify-center">
                <IconMix size={32} />
              </div>
              <p className="font-medium">{t.mixNoSaved}</p>
              <p className="text-sm mt-2">
                {filterBy === 'favorites'
                  ? t.mixAddToFavoritesHint
                  : t.mixSaveFirstHint}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMixes.map(mix => (
                <div
                  key={mix.id}
                  className="rounded-xl p-4 transition-all hover:scale-[1.01]"
                  style={{ background: 'var(--color-bgHover)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium" style={{ color: 'var(--color-text)' }}>
                          {mix.name}
                        </h3>
                        {mix.is_favorite && (
                          <IconStar size={14} className="text-[var(--color-warning)]" />
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-textMuted)' }}>
                        {t.mixUsageCount(mix.usage_count, new Date(mix.created_at).toLocaleDateString())}
                      </p>
                      {/* Rating */}
                      <div className="mt-2">
                        <MixRating
                          rating={mix.rating}
                          onRate={(rating) => updateMix(mix.id, { rating })}
                          size="sm"
                        />
                      </div>
                    </div>
                    {mix.compatibility_score !== null && (
                      <span
                        className="px-2 py-1 rounded-lg text-xs font-bold"
                        style={{
                          background: mix.compatibility_score >= 80
                            ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
                            : mix.compatibility_score >= 60
                            ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)'
                            : 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
                          color: mix.compatibility_score >= 80
                            ? 'var(--color-success)'
                            : mix.compatibility_score >= 60
                            ? 'var(--color-primary)'
                            : 'var(--color-warning)',
                        }}
                      >
                        {mix.compatibility_score}%
                      </span>
                    )}
                  </div>

                  {/* Tobacco chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {mix.tobaccos.map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-lg text-xs"
                        style={{
                          border: `1px solid ${t.color}`,
                          color: 'var(--color-text)',
                        }}
                      >
                        {t.flavor} ({t.percent}%)
                      </span>
                    ))}
                  </div>

                  {/* Notes */}
                  <div className="mb-3">
                    <MixNotes
                      notes={mix.notes}
                      onSave={(notes) => updateMix(mix.id, { notes: notes || null })}
                      placeholder={t.mixAddNote}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => handleSelect(mix)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        background: 'var(--color-primary)',
                        color: 'var(--color-bg)',
                      }}
                    >
                      {t.mixLoad}
                    </button>
                    <button type="button"
                      onClick={() => toggleFavorite(mix.id)}
                      className="px-3 py-2 rounded-lg transition-colors"
                      style={{
                        background: 'var(--color-bgCard)',
                        border: '1px solid var(--color-border)',
                      }}
                      title={mix.is_favorite ? t.mixRemoveFavorite : t.mixAddFavorite}
                    >
                      <IconStar size={16} className={mix.is_favorite ? 'text-[var(--color-warning)]' : 'text-[var(--color-textMuted)]'} />
                    </button>
                    <button type="button"
                      onClick={() => handleDelete(mix.id)}
                      className="px-3 py-2 rounded-lg transition-colors"
                      style={{
                        background: deleteConfirm === mix.id
                          ? 'var(--color-danger)'
                          : 'var(--color-bgCard)',
                        border: '1px solid var(--color-border)',
                        color: deleteConfirm === mix.id ? 'white' : 'var(--color-textMuted)',
                      }}
                      title={t.mixDelete}
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
