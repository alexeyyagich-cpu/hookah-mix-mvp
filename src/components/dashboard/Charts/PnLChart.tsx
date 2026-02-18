'use client'

import type { PnLLineItem } from '@/lib/hooks/usePnL'

interface PnLChartProps {
  data: PnLLineItem[]
  showHookah?: boolean
}

export function PnLChart({ data, showHookah = true }: PnLChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--color-textMuted)]">
        Нет данных для отображения
      </div>
    )
  }

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.totalRevenue, d.totalCost)),
    1
  )
  const chartHeight = 140

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5 px-1" style={{ height: chartHeight }}>
        {data.map((day) => {
          const revenueH = Math.max((day.barRevenue / maxValue) * chartHeight, 2)
          const barCostH = Math.max((day.barCost / maxValue) * chartHeight, 1)
          const hookahCostH = showHookah ? Math.max((day.hookahCost / maxValue) * chartHeight, 1) : 0

          return (
            <div
              key={day.date}
              className="flex-1 flex gap-0.5 justify-center items-end group relative"
              style={{ height: chartHeight }}
            >
              {/* Tooltip */}
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-center whitespace-nowrap z-10 bg-[var(--color-bgCard)] px-2 py-1.5 rounded-lg shadow-lg border border-[var(--color-border)]">
                <div className="font-medium text-[var(--color-success)]">{day.barRevenue.toFixed(0)}€</div>
                <div className="text-[var(--color-danger)]">Бар: -{day.barCost.toFixed(0)}€</div>
                {showHookah && day.hookahCost > 0 && (
                  <div className="text-[var(--color-warning)]">Табак: -{day.hookahCost.toFixed(0)}€</div>
                )}
                <div className={day.profit >= 0 ? 'font-medium text-[var(--color-success)]' : 'font-medium text-[var(--color-danger)]'}>
                  = {day.profit.toFixed(0)}€
                </div>
              </div>

              {/* Revenue bar */}
              {day.barRevenue > 0 && (
                <div
                  className="flex-1 rounded-t-md bg-[var(--color-success)] hover:opacity-80 transition-all cursor-pointer max-w-3"
                  style={{ height: revenueH }}
                />
              )}

              {/* Cost bar (stacked: bar cost + hookah cost) */}
              <div className="flex-1 flex flex-col justify-end max-w-3">
                {showHookah && day.hookahCost > 0 && (
                  <div
                    className="w-full rounded-t-md bg-[var(--color-warning)]/60"
                    style={{ height: hookahCostH }}
                  />
                )}
                {day.barCost > 0 && (
                  <div
                    className="w-full bg-[var(--color-danger)]/40"
                    style={{ height: barCostH, borderRadius: day.hookahCost > 0 ? 0 : '0.375rem 0.375rem 0 0' }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Date labels */}
      <div className="flex gap-1.5 px-1">
        {data.map((day, index) => (
          <div key={day.date} className="flex-1 text-center">
            {(data.length <= 7 || index === 0 || index === data.length - 1 || index === Math.floor(data.length / 2)) && (
              <div className="text-[10px] text-[var(--color-textMuted)]">
                {new Date(day.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-[var(--color-textMuted)]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[var(--color-success)]" />
          Выручка
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[var(--color-danger)]/40" />
          Себестоимость бар
        </div>
        {showHookah && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[var(--color-warning)]/60" />
            Расход табака
          </div>
        )}
      </div>
    </div>
  )
}
