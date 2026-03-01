'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from '@/lib/i18n'
import { IconTimer, IconCocktail, IconBowl, IconClose } from '@/components/Icons'
import type { KdsOrder, KdsOrderStatus, KdsHookahData } from '@/types/database'

interface KdsOrderCardProps {
  order: KdsOrder
  onAction: (orderId: string, newStatus: KdsOrderStatus) => Promise<void>
  onCancel: (orderId: string) => Promise<void>
}

const NEXT_STATUS: Record<string, KdsOrderStatus> = {
  new: 'preparing',
  preparing: 'ready',
  ready: 'served',
}

// ACTION_LABELS moved into component to access translations

const BORDER_COLORS: Record<string, string> = {
  new: 'border-[var(--color-warning)]',
  preparing: 'border-[var(--color-primary)]',
  ready: 'border-[var(--color-success)]',
}

const ACTION_STYLES: Record<string, string> = {
  new: 'bg-[var(--color-primary)] text-[var(--color-bg)] hover:opacity-90',
  preparing: 'bg-[var(--color-success)] text-[var(--color-bg)] hover:opacity-90',
  ready: 'border border-[var(--color-border)] text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)]',
}

function formatElapsed(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  if (totalMinutes < 1) return `${seconds}s`
  return `${totalMinutes}:${seconds.toString().padStart(2, '0')}`
}

function getTimerColor(ms: number): string {
  const minutes = ms / 60000
  if (minutes < 5) return 'text-[var(--color-success)]'
  if (minutes < 10) return 'text-[var(--color-warning)]'
  return 'text-[var(--color-danger)]'
}

export function KdsOrderCard({ order, onAction, onCancel }: KdsOrderCardProps) {
  const t = useTranslation('manage')

  const ACTION_LABELS: Record<string, string> = {
    new: t.actionTake,
    preparing: t.actionReady,
    ready: t.actionServed,
  }

  const createdTs = useMemo(() => new Date(order.created_at).getTime(), [order.created_at])
  const [elapsed, setElapsed] = useState(Date.now() - createdTs)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - createdTs)
    }, 1000)
    return () => clearInterval(interval)
  }, [createdTs])

  const handleAction = async () => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setActing(true)
    try {
      await onAction(order.id, next)
    } finally {
      setActing(false)
    }
  }

  const handleCancel = async () => {
    setActing(true)
    try {
      await onCancel(order.id)
    } finally {
      setActing(false)
    }
  }

  const isBar = order.type === 'bar'
  const canCancel = order.status === 'new' || order.status === 'preparing'
  const hookahData: KdsHookahData | null = !isBar && order.items[0]?.hookah_data ? order.items[0].hookah_data : null

  return (
    <div className={`card border-l-4 ${BORDER_COLORS[order.status]} p-4 space-y-3 transition-all`}>
      {/* Header: table + timer */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate flex items-center gap-1">
            {order.table_name || t.noTableLabel}
            {order.source === 'guest_qr' && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-teal-500/20 text-teal-400">
                {t.guestQrBadge}
              </span>
            )}
          </div>
          {order.guest_name && (
            <div className="text-xs text-[var(--color-textMuted)] truncate">
              {order.guest_name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`flex items-center gap-1 text-sm font-mono font-medium ${getTimerColor(elapsed)}`}>
            <IconTimer size={14} />
            {formatElapsed(elapsed)}
          </div>
          {canCancel && (
            <button type="button"
              onClick={handleCancel}
              disabled={acting}
              className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-[var(--color-textMuted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors flex items-center justify-center"
              title={t.cancelTooltip}
              aria-label={t.cancelTooltip}
            >
              <IconClose size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Type badge */}
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
          isBar
            ? 'bg-indigo-500/10 text-indigo-400'
            : 'bg-orange-500/10 text-orange-400'
        }`}>
          {isBar ? <IconCocktail size={12} /> : <IconBowl size={12} />}
          {isBar ? t.typeLabelBar : t.typeLabelHookah}
        </span>
      </div>

      {/* Items */}
      {hookahData ? (
        <div className="space-y-2">
          {/* Tobacco pills */}
          <div className="flex flex-wrap gap-1.5">
            {hookahData.tobaccos.map((tob, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  background: tob.color + '20',
                  color: tob.color,
                  border: `1px solid ${tob.color}40`,
                }}
              >
                {tob.flavor} {tob.percent}%
              </span>
            ))}
          </div>
          {/* Mix details */}
          <div className="text-xs text-[var(--color-textMuted)] flex flex-wrap gap-x-2">
            <span>{t.gramsShortLabel(hookahData.total_grams)}</span>
            {hookahData.bowl_name && <span>{hookahData.bowl_name}</span>}
            {hookahData.heat_setup && (
              <span>
                {t.coalsLabel(hookahData.heat_setup.coals)}, {
                  hookahData.heat_setup.packing === 'fluffy' ? t.packingFluffy :
                  hookahData.heat_setup.packing === 'semi-dense' ? t.packingSemiDense :
                  t.packingDense
                }
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs text-[var(--color-textMuted)] mt-0.5 w-4 flex-shrink-0">
                {item.quantity > 1 ? `${item.quantity}x` : ''}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{item.name}</div>
                {item.details && (
                  <div className="text-xs text-[var(--color-textMuted)]">{item.details}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="text-xs text-[var(--color-textMuted)] italic px-1">
          {order.notes}
        </div>
      )}

      {/* Action button */}
      <button type="button"
        onClick={handleAction}
        disabled={acting}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${ACTION_STYLES[order.status]} ${acting ? 'opacity-50' : ''}`}
      >
        {acting ? '...' : ACTION_LABELS[order.status]}
      </button>
    </div>
  )
}
