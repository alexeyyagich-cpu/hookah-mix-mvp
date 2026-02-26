'use client'

import { useTranslation } from '@/lib/i18n'
import { IconUsers } from '@/components/Icons'
import type { StaffRowEnriched } from '@/types/dashboard-control'

interface Props {
  rows: StaffRowEnriched[]
}

export function StaffComparisonTable({ rows }: Props) {
  const t = useTranslation('manage')

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
          <IconUsers size={20} />
        </div>
        <h2 className="text-lg font-semibold">{t.controlStaffTitle}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--color-bgCard)]">
            <tr className="text-left text-[var(--color-textMuted)] border-b border-[var(--color-border)]">
              <th className="pb-3 font-medium">{t.controlStaffName}</th>
              <th className="pb-3 font-medium text-right">{t.controlStaffSessions}</th>
              <th className="pb-3 font-medium text-right">{t.controlStaffAvgGrams}</th>
              <th className="pb-3 font-medium text-right">{t.controlStaffDeviation}</th>
              <th className="pb-3 font-medium text-right">{t.controlStaffStatus}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.user_id}
                className={`border-b border-[var(--color-border)]/50 ${
                  row.status === 'worst' ? 'bg-[var(--color-danger)]/5' :
                  row.status === 'best' ? 'bg-[var(--color-success)]/5' : ''
                }`}
              >
                <td className="py-3">
                  <div className="font-medium">{row.display_name}</div>
                  <div className="text-xs text-[var(--color-textMuted)]">{row.role}</div>
                </td>
                <td className="py-3 text-right font-medium">{row.sessions_count}</td>
                <td className="py-3 text-right font-medium">
                  {row.avg_grams > 0 ? `${row.avg_grams}g` : '—'}
                </td>
                <td className="py-3 text-right">
                  {row.sessions_count > 0 ? (
                    <span className={
                      row.deviation_from_mean > 5 ? 'text-[var(--color-danger)]' :
                      row.deviation_from_mean < -5 ? 'text-[var(--color-success)]' :
                      'text-[var(--color-textMuted)]'
                    }>
                      {row.deviation_from_mean > 0 ? '+' : ''}{row.deviation_from_mean}%
                    </span>
                  ) : '—'}
                </td>
                <td className="py-3 text-right">
                  {row.status === 'best' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-success)]/20 text-[var(--color-success)]">
                      {t.controlStaffBest}
                    </span>
                  )}
                  {row.status === 'worst' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-danger)]/20 text-[var(--color-danger)]">
                      {t.controlStaffWorst}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
