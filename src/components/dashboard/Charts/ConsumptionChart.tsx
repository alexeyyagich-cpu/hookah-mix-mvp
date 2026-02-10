'use client'

interface DailyData {
  date: string
  grams: number
  sessions: number
}

interface ConsumptionChartProps {
  data: DailyData[]
}

export function ConsumptionChart({ data }: ConsumptionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--color-textMuted)]">
        Нет данных для отображения
      </div>
    )
  }

  const maxGrams = Math.max(...data.map(d => d.grams), 1)
  const maxSessions = Math.max(...data.map(d => d.sessions), 1)

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-48 flex items-end gap-1">
        {data.map((day, index) => {
          const barHeight = (day.grams / maxGrams) * 100

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-center mb-1">
                <div className="font-medium">{day.grams}г</div>
                <div className="text-[var(--color-textMuted)]">{day.sessions} сессий</div>
              </div>

              {/* Bar */}
              <div
                className="w-full rounded-t-md bg-[var(--color-primary)] hover:bg-[var(--color-primaryHover)] transition-all cursor-pointer"
                style={{ height: `${Math.max(barHeight, 4)}%` }}
              />

              {/* Date Label */}
              {(index === 0 || index === data.length - 1 || data.length <= 7) && (
                <div className="text-[10px] text-[var(--color-textMuted)] mt-1">
                  {new Date(day.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-[var(--color-textMuted)]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[var(--color-primary)]" />
          Расход (г)
        </div>
      </div>
    </div>
  )
}
