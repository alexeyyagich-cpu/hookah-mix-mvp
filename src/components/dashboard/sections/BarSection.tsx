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
import { useTranslation, useLocale } from '@/lib/i18n'

const LOCALE_MAP: Record<string, string> = { ru: 'ru-RU', en: 'en-US', de: 'de-DE' }

export function BarSection() {
  const t = useTranslation('manage')
  const { locale } = useLocale()
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
          label={t.barRevenueLabelShort}
          value={`${analytics.totalRevenue.toFixed(0)}€`}
          color="success"
        />
        <StatsCard
          icon={<IconTrendUp size={20} />}
          label={t.barProfitLabel}
          value={`${analytics.totalProfit.toFixed(0)}€`}
          color="primary"
        />
        <StatsCard
          icon={<IconCart size={20} />}
          label={t.barSalesLabel}
          value={analytics.totalSales}
          subtext={t.subtextPortionsSold}
          color="warning"
        />
        <StatsCard
          icon={<IconPercent size={20} />}
          label={t.barMarginLabel}
          value={analytics.avgMargin !== null ? `${analytics.avgMargin.toFixed(0)}%` : '—'}
          subtext={t.subtextAverage}
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
              <h3 className="font-semibold">{t.barInventoryAlert}</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                {outOfStockItems.length > 0 && (
                  <span className="text-[var(--color-danger)]">{t.itemsOutOfStock(outOfStockItems.length)}</span>
                )}
                {lowStockItems.length > 0 && (
                  <span className="text-[var(--color-warning)]">{t.itemsLowStock(lowStockItems.length)}</span>
                )}
              </p>
              <Link href="/bar/inventory" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
                {t.checkBarInventory}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Chart + Top Cocktails */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{t.barRevenueTitle}</h2>
            <Link href="/bar/sales" className="text-sm text-[var(--color-primary)] hover:underline">
              {t.allSalesLink}
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
            <h2 className="text-lg font-semibold">{t.topCocktails}</h2>
            <Link href="/bar/recipes" className="text-sm text-[var(--color-primary)] hover:underline">
              {t.allRecipes}
            </Link>
          </div>
          {analytics.topCocktails.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-textMuted)]">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-center">
                <IconCocktail size={24} />
              </div>
              <p>{t.noSalesYet}</p>
              <p className="text-sm mt-2">{t.recordFirstSale}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.topCocktails.slice(0, 5).map((cocktail, i) => (
                <div
                  key={cocktail.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bgHover)]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                      {i + 1}
                    </span>
                    <span className="font-medium truncate">{cocktail.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium">{cocktail.count} {t.pcsShort}</div>
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
          <h2 className="text-lg font-semibold">{t.recentSales}</h2>
          <Link href="/bar/sales" className="text-sm text-[var(--color-primary)] hover:underline">
            {t.allSalesLink}
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-textMuted)]">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-center">
              <IconCocktail size={24} />
            </div>
            <p>{t.noSalesYet}</p>
            <p className="text-sm mt-2">{t.recordFirstSale}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="p-4 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)]">
                    <IconCocktail size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {sale.recipe_name} {sale.quantity > 1 ? `×${sale.quantity}` : ''}
                    </div>
                    <div className="text-sm text-[var(--color-textMuted)]">
                      {new Date(sale.sold_at).toLocaleDateString(LOCALE_MAP[locale] || 'ru-RU', {
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
                    {t.costShort} {sale.total_cost.toFixed(0)}€
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
