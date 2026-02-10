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
    <div className="space-y-2">
      {/* Chart */}
      <div className="relative h-40 flex items-end gap-2 px-1">
        {data.map((day, index) => {
          const barHeight = (day.grams / maxGrams) * 100

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center group relative"
              style={{ height: '100%' }}
            >
              {/* Tooltip - absolute positioned */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-center whitespace-nowrap z-10 bg-[var(--color-bgCard)] px-2 py-1 rounded-lg shadow-lg border border-[var(--color-border)]">
                <div className="font-medium">{day.grams}г</div>
                <div className="text-[var(--color-textMuted)]">{day.sessions} сес.</div>
              </div>

              {/* Bar container - fills available height */}
              <div className="flex-1 w-full flex items-end">
                <div
                  className="w-full rounded-t-md bg-[var(--color-primary)] hover:bg-[var(--color-primaryHover)] transition-all cursor-pointer min-h-[4px]"
                  style={{ height: `${Math.max(barHeight, 3)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Date Labels */}
      <div className="flex gap-2 px-1">
        {data.map((day, index) => (
          <div key={day.date} className="flex-1 text-center">
            {(data.length <= 7 || index === 0 || index === data.length - 1) && (
              <div className="text-[10px] text-[var(--color-textMuted)]">
                {new Date(day.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </div>
            )}
          </div>
        ))}
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
