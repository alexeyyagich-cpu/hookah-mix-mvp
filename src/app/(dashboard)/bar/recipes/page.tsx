'use client'

export default function BarRecipesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Рецепты коктейлей</h1>
        <p className="text-[var(--color-textMuted)]">
          Рецепты с пограммовками и калькулятором себестоимости
        </p>
      </div>

      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">🍹</div>
        <h3 className="text-lg font-semibold mb-2">Скоро</h3>
        <p className="text-[var(--color-textMuted)] max-w-md mx-auto">
          Здесь будут рецепты коктейлей с ингредиентами, пограммовками, калькулятором себестоимости
          и возможностью импорта классических рецептов.
        </p>
      </div>
    </div>
  )
}
