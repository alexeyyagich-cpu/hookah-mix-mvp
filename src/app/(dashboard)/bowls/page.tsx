'use client'

import { useState } from 'react'
import { useBowls } from '@/lib/hooks/useBowls'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { BowlCard } from '@/components/dashboard/BowlCard'
import type { BowlType } from '@/types/database'

export default function BowlsPage() {
  const {
    bowls,
    loading,
    error,
    addBowl,
    updateBowl,
    deleteBowl,
    setDefaultBowl,
    canAddMore,
    bowlsLimit,
  } = useBowls()
  const { isFreeTier } = useSubscription()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBowl, setEditingBowl] = useState<BowlType | null>(null)
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !capacity) return

    setSaving(true)
    if (editingBowl) {
      await updateBowl(editingBowl.id, {
        name,
        capacity_grams: parseFloat(capacity),
      })
    } else {
      await addBowl({
        name,
        capacity_grams: parseFloat(capacity),
        is_default: bowls.length === 0,
      })
    }
    setSaving(false)
    closeModal()
  }

  const openModal = (bowl?: BowlType) => {
    if (bowl) {
      setEditingBowl(bowl)
      setName(bowl.name)
      setCapacity(bowl.capacity_grams.toString())
    } else {
      setEditingBowl(null)
      setName('')
      setCapacity('')
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingBowl(null)
    setName('')
    setCapacity('')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Удалить эту чашу?')) {
      await deleteBowl(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Типы чаш</h1>
          <p className="text-[var(--color-textMuted)]">
            Управляйте чашами для точного расчета граммовки
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn btn-primary"
          disabled={!canAddMore}
        >
          + Добавить чашу
        </button>
      </div>

      {/* Limit Warning */}
      {isFreeTier && !canAddMore && (
        <div className="card p-4 border-[var(--color-warning)]/50 bg-[var(--color-warning)]/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div className="flex-1">
              <h3 className="font-semibold">Достигнут лимит</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                Бесплатный тариф позволяет добавить {bowlsLimit} чашу.
                Обновите подписку для добавления большего количества.
              </p>
            </div>
            <a href="/pricing" className="btn btn-primary">
              Обновить
            </a>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❌</span>
            <p className="text-[var(--color-danger)]">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-8 h-8 mx-auto border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-[var(--color-textMuted)]">Загрузка...</p>
        </div>
      ) : bowls.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🥣</div>
          <h3 className="text-lg font-semibold mb-2">Нет добавленных чаш</h3>
          <p className="text-[var(--color-textMuted)] mb-4">
            Добавьте первую чашу для точного расчета граммовки при создании сессий
          </p>
          <button onClick={() => openModal()} className="btn btn-primary">
            + Добавить чашу
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bowls.map((bowl) => (
            <BowlCard
              key={bowl.id}
              bowl={bowl}
              onEdit={openModal}
              onDelete={handleDelete}
              onSetDefault={setDefaultBowl}
            />
          ))}
        </div>
      )}

      {/* Preset Suggestions */}
      {bowls.length === 0 && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Популярные чаши</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { name: 'Phunnel маленький', capacity: 15 },
              { name: 'Phunnel средний', capacity: 20 },
              { name: 'Phunnel большой', capacity: 25 },
              { name: 'Turka', capacity: 18 },
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={async () => {
                  if (canAddMore) {
                    await addBowl({
                      name: preset.name,
                      capacity_grams: preset.capacity,
                      is_default: bowls.length === 0,
                    })
                  }
                }}
                disabled={!canAddMore}
                className="p-4 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium">{preset.name}</div>
                <div className="text-sm text-[var(--color-textMuted)]">{preset.capacity}г</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-[var(--color-bgCard)] rounded-2xl border border-[var(--color-border)]">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingBowl ? 'Редактировать чашу' : 'Добавить чашу'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Название</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder="Phunnel средний"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Вместимость (г)</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder="20"
                  min="5"
                  max="50"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 btn btn-ghost"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!name || !capacity || saving}
                  className="flex-1 btn btn-primary disabled:opacity-50"
                >
                  {saving ? 'Сохранение...' : editingBowl ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
