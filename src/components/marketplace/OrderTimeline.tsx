'use client'

import type { OrderStatus } from '@/types/database'
import { IconPackage, IconCheck, IconTruck, IconClose } from '@/components/Icons'

interface OrderTimelineProps {
  status: OrderStatus
  createdAt: string
  estimatedDeliveryDate?: string | null
  actualDeliveryDate?: string | null
}

const STATUSES: { key: OrderStatus; label: string; Icon: typeof IconPackage }[] = [
  { key: 'pending', label: 'Оформлен', Icon: IconPackage },
  { key: 'confirmed', label: 'Подтвержден', Icon: IconCheck },
  { key: 'shipped', label: 'Отправлен', Icon: IconTruck },
  { key: 'delivered', label: 'Доставлен', Icon: IconCheck },
]

export function OrderTimeline({
  status,
  createdAt,
  estimatedDeliveryDate,
  actualDeliveryDate,
}: OrderTimelineProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusIndex = (s: OrderStatus) => {
    if (s === 'cancelled') return -1
    return STATUSES.findIndex(item => item.key === s)
  }

  const currentIndex = getStatusIndex(status)

  if (status === 'cancelled') {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center">
            <IconClose size={24} className="text-[var(--color-danger)]" />
          </div>
          <div>
            <div className="font-semibold text-[var(--color-danger)]">Заказ отменен</div>
            <div className="text-sm text-[var(--color-textMuted)]">
              {formatDate(createdAt)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="relative">
        {STATUSES.map((item, index) => {
          const isCompleted = index <= currentIndex
          const isCurrent = index === currentIndex
          const Icon = item.Icon

          return (
            <div key={item.key} className="flex gap-4">
              {/* Line and dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)]'
                  } ${isCurrent ? 'ring-4 ring-[var(--color-primary)]/20' : ''}`}
                >
                  <Icon size={20} />
                </div>
                {index < STATUSES.length - 1 && (
                  <div
                    className={`w-0.5 h-12 ${
                      index < currentIndex
                        ? 'bg-[var(--color-primary)]'
                        : 'bg-[var(--color-border)]'
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className={`pb-8 ${index === STATUSES.length - 1 ? 'pb-0' : ''}`}>
                <div className={`font-medium ${
                  isCompleted ? 'text-[var(--color-text)]' : 'text-[var(--color-textMuted)]'
                }`}>
                  {item.label}
                </div>

                {/* Show date for completed or current status */}
                {isCompleted && (
                  <div className="text-sm text-[var(--color-textMuted)] mt-0.5">
                    {item.key === 'pending' && formatDate(createdAt)}
                    {item.key === 'delivered' && actualDeliveryDate && formatDate(actualDeliveryDate)}
                  </div>
                )}

                {/* Show estimated delivery for shipped */}
                {item.key === 'delivered' && !isCompleted && estimatedDeliveryDate && (
                  <div className="text-sm text-[var(--color-textMuted)] mt-0.5">
                    Ожидается: {formatDate(estimatedDeliveryDate)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
