'use client'

import { useState, useMemo } from 'react'
import { useBarRecipes } from '@/lib/hooks/useBarRecipes'
import { RecipeCard } from '@/components/bar/RecipeCard'
import { CostCalculator } from '@/components/bar/CostCalculator'
import { AddRecipeModal } from '@/components/bar/AddRecipeModal'
import { useTranslation } from '@/lib/i18n'
import type { BarRecipeWithIngredients, CocktailMethod } from '@/types/database'

type FilterMethod = CocktailMethod | 'all'
type FilterMenu = 'all' | 'on_menu' | 'favorites'

export default function BarRecipesPage() {
  const tb = useTranslation('bar')

  const METHOD_LABELS: Record<string, string> = {
    build: tb.methodBuild, stir: tb.methodStir, shake: tb.methodShake,
    blend: tb.methodBlend, layer: tb.methodLayer, muddle: tb.methodMuddle,
  }

  const {
    recipes,
    loading,
    error,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleOnMenu,
    toggleFavorite,
    calculateCost,
  } = useBarRecipes()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<BarRecipeWithIngredients | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null)
  const [filterMethod, setFilterMethod] = useState<FilterMethod>('all')
  const [filterMenu, setFilterMenu] = useState<FilterMenu>('all')
  const [search, setSearch] = useState('')

  const filteredRecipes = useMemo(() => {
    let result = recipes

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.name_en?.toLowerCase().includes(q) ||
        r.ingredients.some(i => i.ingredient_name.toLowerCase().includes(q))
      )
    }

    if (filterMethod !== 'all') {
      result = result.filter(r => r.method === filterMethod)
    }

    if (filterMenu === 'on_menu') {
      result = result.filter(r => r.is_on_menu)
    } else if (filterMenu === 'favorites') {
      result = result.filter(r => r.is_favorite)
    }

    return result
  }, [recipes, search, filterMethod, filterMenu])

  const handleSave = async (
    recipe: Parameters<typeof addRecipe>[0],
    ingredients: Parameters<typeof addRecipe>[1]
  ) => {
    if (editingRecipe) {
      await updateRecipe(editingRecipe.id, recipe, ingredients)
    } else {
      await addRecipe(recipe, ingredients)
    }
    setEditingRecipe(null)
  }

  const handleEdit = (recipe: BarRecipeWithIngredients) => {
    setEditingRecipe(recipe)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteRecipe(id)
    if (selectedRecipe === id) setSelectedRecipe(null)
  }

  // Stats
  const totalRecipes = recipes.length
  const onMenuCount = recipes.filter(r => r.is_on_menu).length
  const avgMargin = useMemo(() => {
    const margins = recipes
      .map(r => calculateCost(r).margin)
      .filter((m): m is number => m !== null)
    if (margins.length === 0) return null
    return margins.reduce((a, b) => a + b, 0) / margins.length
  }, [recipes, calculateCost])

  const selectedRecipeObj = selectedRecipe ? recipes.find(r => r.id === selectedRecipe) : null
  const selectedCost = selectedRecipeObj ? calculateCost(selectedRecipeObj) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tb.recipesTitle}</h1>
          <p className="text-[var(--color-textMuted)]">
            {tb.recipesCount(totalRecipes)} · {onMenuCount} {tb.inMenu}
            {avgMargin !== null && ` · ${tb.avgMarginLabel(avgMargin.toFixed(0))}`}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRecipe(null)
            setModalOpen(true)
          }}
          className="btn btn-primary"
        >
          + {tb.newRecipe}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{tb.totalRecipes}</div>
          <div className="text-2xl font-bold mt-1">{totalRecipes}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{tb.onMenu}</div>
          <div className="text-2xl font-bold text-[var(--color-success)] mt-1">{onMenuCount}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{tb.avgMargin}</div>
          <div className={`text-2xl font-bold mt-1 ${
            avgMargin !== null
              ? avgMargin >= 60 ? 'text-[var(--color-success)]' : avgMargin >= 40 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'
              : ''
          }`}>
            {avgMargin !== null ? `${avgMargin.toFixed(0)}%` : '—'}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{tb.favorites}</div>
          <div className="text-2xl font-bold mt-1">{recipes.filter(r => r.is_favorite).length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={tb.searchRecipes}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
        />
        <select
          value={filterMethod}
          onChange={e => setFilterMethod(e.target.value as FilterMethod)}
          className="px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
        >
          <option value="all">{tb.allMethods}</option>
          {Object.entries(METHOD_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filterMenu}
          onChange={e => setFilterMenu(e.target.value as FilterMenu)}
          className="px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
        >
          <option value="all">{tb.allRecipes}</option>
          <option value="on_menu">{tb.onMenu}</option>
          <option value="favorites">{tb.favorites}</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <p className="text-[var(--color-danger)]">{error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto" />
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🍹</div>
          <h3 className="text-lg font-semibold mb-2">
            {recipes.length === 0 ? tb.noRecipes : tb.nothingFound}
          </h3>
          <p className="text-[var(--color-textMuted)] max-w-md mx-auto mb-4">
            {recipes.length === 0
              ? tb.createFirstOrImport
              : tb.tryChangingFilters
            }
          </p>
          {recipes.length === 0 && (
            <button onClick={() => setModalOpen(true)} className="btn btn-primary">
              + {tb.createRecipe}
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Recipe Grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecipes.map(recipe => {
              const cost = calculateCost(recipe)
              return (
                <div
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe.id === selectedRecipe ? null : recipe.id)}
                  className={`cursor-pointer rounded-2xl transition-all ${
                    recipe.id === selectedRecipe ? 'ring-2 ring-[var(--color-primary)]' : ''
                  }`}
                >
                  <RecipeCard
                    recipe={recipe}
                    cost={cost}
                    onToggleMenu={() => toggleOnMenu(recipe.id)}
                    onToggleFavorite={() => toggleFavorite(recipe.id)}
                    onEdit={() => handleEdit(recipe)}
                    onDelete={() => handleDelete(recipe.id)}
                  />
                </div>
              )
            })}
          </div>

          {/* Cost Calculator Sidebar */}
          {selectedCost && (
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-6">
                <CostCalculator cost={selectedCost} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AddRecipeModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingRecipe(null)
        }}
        onSave={handleSave}
        editingRecipe={editingRecipe}
      />
    </div>
  )
}
