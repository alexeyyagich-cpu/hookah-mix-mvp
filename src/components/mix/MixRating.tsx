'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { IconStar } from '@/components/Icons'

interface MixRatingProps {
  rating: number | null
  onRate: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
}

export function MixRating({ rating, onRate, size = 'md', readonly = false }: MixRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const sizes = {
    sm: 14,
    md: 18,
    lg: 24,
  }

  const iconSize = sizes[size]
  const displayRating = hoverRating ?? rating ?? 0

  return (
    <div
      className={`flex items-center gap-0.5 ${readonly ? '' : 'cursor-pointer'}`}
      onMouseLeave={() => !readonly && setHoverRating(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onRate(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          className={`transition-transform ${
            !readonly ? 'hover:scale-110 active:scale-95' : ''
          } disabled:cursor-default`}
        >
          <IconStar
            size={iconSize}
            className={`transition-colors ${
              star <= displayRating
                ? 'text-[var(--color-warning)] fill-[var(--color-warning)]'
                : 'text-[var(--color-border)]'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

interface MixNotesProps {
  notes: string | null
  onSave: (notes: string) => void
  placeholder?: string
}

export function MixNotes({ notes, onSave, placeholder }: MixNotesProps) {
  const t = useTranslation('hookah')
  const resolvedPlaceholder = placeholder ?? t.mixNotePlaceholder
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(notes || '')

  const handleSave = () => {
    onSave(value.trim() || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSave()
    }
    if (e.key === 'Escape') {
      setValue(notes || '')
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={resolvedPlaceholder}
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1 text-xs rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90"
          >
            {t.mixNoteSave}
          </button>
          <button
            type="button"
            onClick={() => {
              setValue(notes || '')
              setIsEditing(false)
            }}
            className="px-3 py-1 text-xs rounded-lg text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)]"
          >
            {t.mixNoteCancel}
          </button>
          <span className="text-xs text-[var(--color-textMuted)] ml-auto">
            {t.mixNoteShortcut}
          </span>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="w-full text-left text-sm text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors py-1"
    >
      {notes || resolvedPlaceholder}
    </button>
  )
}
