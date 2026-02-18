'use client'

export default function BarSalesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Продажи бара</h1>
        <p className="text-[var(--color-textMuted)]">
          Учёт продаж, автосписание и аналитика
        </p>
      </div>

      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">💰</div>
        <h3 className="text-lg font-semibold mb-2">Скоро</h3>
        <p className="text-[var(--color-textMuted)] max-w-md mx-auto">
          Здесь будут быстрые продажи в 1 тап, автосписание ингредиентов со склада,
          аналитика по выручке, маржинальности и популярности коктейлей.
        </p>
      </div>
    </div>
  )
}
