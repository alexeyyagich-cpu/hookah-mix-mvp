'use client'

export default function BarMenuPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Меню бара</h1>
        <p className="text-[var(--color-textMuted)]">
          Управление коктейльной картой и ценами
        </p>
      </div>

      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-lg font-semibold mb-2">Скоро</h3>
        <p className="text-[var(--color-textMuted)] max-w-md mx-auto">
          Здесь будет управление меню бара: коктейли на продажу, цены, категории
          и экспорт в PDF.
        </p>
      </div>
    </div>
  )
}
