'use client'

import { useState } from 'react'
import { useSessions } from '@/lib/hooks/useSessions'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { SessionCard } from '@/components/dashboard/SessionCard'
import type { SessionWithItems } from '@/types/database'
import Link from 'next/link'

export default function SessionsPage() {
  const { sessions, loading, error, updateSession, deleteSession } = useSessions()
  const { isFreeTier } = useSubscription()

  const [filter, setFilter] = useState('')
  const [selectedSession, setSelectedSession] = useState<SessionWithItems | null>(null)

  const filteredSessions = sessions.filter(session =>
    session.session_items?.some(item =>
      item.brand.toLowerCase().includes(filter.toLowerCase()) ||
      item.flavor.toLowerCase().includes(filter.toLowerCase())
    )
  )

  const handleRate = async (id: string, rating: number) => {
    await updateSession(id, { rating })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Удалить эту сессию?')) {
      await deleteSession(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">История сессий</h1>
          <p className="text-[var(--color-textMuted)]">
            {sessions.length} сессий
            {isFreeTier && ' за последние 30 дней'}
          </p>
        </div>
        <Link href="/mix" className="btn btn-primary">
          💨 Создать сессию
        </Link>
      </div>

      {/* Free Tier Notice */}
      {isFreeTier && (
        <div className="card p-4 border-[var(--color-warning)]/50 bg-[var(--color-warning)]/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div className="flex-1">
              <h3 className="font-semibold">Ограниченная история</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                На бесплатном тарифе доступна история только за последние 30 дней.
                Обновите подписку для полного доступа.
              </p>
            </div>
            <a href="/pricing" className="btn btn-primary">
              Обновить
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
          placeholder="Поиск по табакам..."
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
            <span className="text-2xl">❌</span>
            <p className="text-[var(--color-danger)]">{error}</p>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-8 h-8 mx-auto border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-[var(--color-textMuted)]">Загрузка сессий...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">💨</div>
          <h3 className="text-lg font-semibold mb-2">
            {filter ? 'Ничего не найдено' : 'Нет сессий'}
          </h3>
          <p className="text-[var(--color-textMuted)] mb-4">
            {filter
              ? 'Попробуйте изменить поисковый запрос'
              : 'Создайте первую забивку в калькуляторе миксов'
            }
          </p>
          {!filter && (
            <Link href="/mix" className="btn btn-primary">
              Создать микс
            </Link>
          )}
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg bg-[var(--color-bgCard)] rounded-2xl border border-[var(--color-border)]">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="text-xl font-bold">Детали сессии</h2>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Date & Bowl */}
              <div className="flex items-center justify-between">
                <div className="text-[var(--color-textMuted)]">
                  {new Date(selectedSession.session_date).toLocaleDateString('ru-RU', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {selectedSession.bowl_type && (
                  <span className="badge badge-primary">
                    🥣 {selectedSession.bowl_type.name}
                  </span>
                )}
              </div>

              {/* Mix Items */}
              <div className="space-y-3">
                <h3 className="font-semibold">Состав микса</h3>
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
                      <div className="text-sm text-[var(--color-textMuted)]">{item.grams_used}г</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-[var(--color-bgHover)]">
                  <div className="text-2xl font-bold">{selectedSession.total_grams}г</div>
                  <div className="text-xs text-[var(--color-textMuted)]">Всего</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-[var(--color-bgHover)]">
                  <div className={`text-2xl font-bold ${
                    (selectedSession.compatibility_score || 0) >= 80 ? 'text-[var(--color-success)]' :
                    (selectedSession.compatibility_score || 0) >= 60 ? 'text-[var(--color-primary)]' :
                    'text-[var(--color-warning)]'
                  }`}>
                    {selectedSession.compatibility_score || '—'}%
                  </div>
                  <div className="text-xs text-[var(--color-textMuted)]">Совместимость</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-[var(--color-bgHover)]">
                  <div className="text-2xl font-bold text-[var(--color-primary)]">
                    {selectedSession.rating ? '★'.repeat(selectedSession.rating) : '—'}
                  </div>
                  <div className="text-xs text-[var(--color-textMuted)]">Оценка</div>
                </div>
              </div>

              {/* Notes */}
              {selectedSession.notes && (
                <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
                  <h4 className="font-medium mb-2">Заметки</h4>
                  <p className="text-[var(--color-textMuted)]">{selectedSession.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[var(--color-border)] flex justify-end">
              <button
                onClick={() => setSelectedSession(null)}
                className="btn btn-ghost"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
