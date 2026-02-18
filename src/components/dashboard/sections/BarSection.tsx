'use client'

import { useBarSales } from '@/lib/hooks/useBarSales'
import { useBarInventory } from '@/lib/hooks/useBarInventory'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { BarRevenueChart } from '@/components/dashboard/Charts/BarRevenueChart'
import {
  IconCoin,
  IconTrendUp,
  IconCart,
  IconPercent,
  IconWarning,
  IconCocktail,
} from '@/components/Icons'
import Link from 'next/link'

export function BarSection() {
  const { sales, loading, getAnalytics } = useBarSales()
  const { inventory } = useBarInventory()

  const analytics = getAnalytics(30)

  const lowStockItems = inventory.filter(
    item => item.quantity > 0 && item.quantity <= item.min_quantity
  )
  const outOfStockItems = inventory.filter(item => item.quantity <= 0)

  const recentSales = sales.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<IconCoin size={20} />}
          label="Выручка"
          value={`${analytics.totalRevenue.toFixed(0)}€`}
          color="success"
        />
        <StatsCard
          icon={<IconTrendUp size={20} />}
          label="Прибыль"
          value={`${analytics.totalProfit.toFixed(0)}€`}
          color="primary"
        />
        <StatsCard
          icon={<IconCart size={20} />}
          label="Продажи"
          value={analytics.totalSales}
          subtext="порций продано"
          color="warning"
        />
        <StatsCard
          icon={<IconPercent size={20} />}
          label="Маржа"
          value={analytics.avgMargin !== null ? `${analytics.avgMargin.toFixed(0)}%` : '—'}
          subtext="в среднем"
          color="primary"
        />
      </div>

      {/* Bar Low Stock Alert */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="card p-4 border-[var(--color-warning)]/50 bg-[var(--color-warning)]/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-warning)]/20 flex items-center justify-center text-[var(--color-warning)]">
              <IconWarning size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Внимание к бар-инвентарю</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                {outOfStockItems.length > 0 && (
                  <span className="text-[var(--color-danger)]">{outOfStockItems.length} позиций закончились. </span>
                )}
                {lowStockItems.length > 0 && (
                  <span className="text-[var(--color-warning)]">{lowStockItems.length} позиций на исходе.</span>
                )}
              </p>
              <Link href="/bar/inventory" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
                Проверить бар-инвентарь →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Chart + Top Cocktails */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Выручка</h2>
            <Link href="/bar/sales" className="text-sm text-[var(--color-primary)] hover:underline">
              Все продажи →
            </Link>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <BarRevenueChart data={analytics.revenueByDay} />
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Топ коктейли</h2>
            <Link href="/bar/recipes" className="text-sm text-[var(--color-primary)] hover:underline">
              Все рецепты →
            </Link>
          </div>
          {analytics.topCocktails.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-textMuted)]">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-center">
                <IconCocktail size={24} />
              </div>
              <p>Пока нет продаж</p>
              <p className="text-sm mt-2">Зафиксируйте первую продажу в разделе бара</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.topCocktails.slice(0, 5).map((cocktail, i) => (
                <div
                  key={cocktail.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bgHover)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                      {i + 1}
                    </span>
                    <span className="font-medium">{cocktail.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{cocktail.count} шт</div>
                    <div className="text-xs text-[var(--color-textMuted)]">{cocktail.revenue.toFixed(0)}€</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Последние продажи</h2>
          <Link href="/bar/sales" className="text-sm text-[var(--color-primary)] hover:underline">
            Все продажи →
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-textMuted)]">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-center">
              <IconCocktail size={24} />
            </div>
            <p>Пока нет продаж</p>
            <p className="text-sm mt-2">Зафиксируйте первую продажу в разделе бара</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="p-4 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)]">
                    <IconCocktail size={20} />
                  </div>
                  <div>
                    <div className="font-medium">
                      {sale.recipe_name} {sale.quantity > 1 ? `×${sale.quantity}` : ''}
                    </div>
                    <div className="text-sm text-[var(--color-textMuted)]">
                      {new Date(sale.sold_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--color-success)]">
                    {sale.total_revenue.toFixed(0)}€
                  </div>
                  <div className="text-xs text-[var(--color-textMuted)]">
                    Себ. {sale.total_cost.toFixed(0)}€
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
