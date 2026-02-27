'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslation, useLocale, getLocaleName } from '@/lib/i18n'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import type { BarRecipe, BarRecipeIngredient, BarRecipeWithIngredients, CocktailMethod, CocktailCategory, BarPortionUnit } from '@/types/database'
import { RECIPE_PRESETS, COCKTAIL_CATEGORY_EMOJI, type RecipePreset } from '@/data/bar-recipes'
import { BAR_INGREDIENT_PRESETS } from '@/data/bar-ingredients'

const COCKTAIL_CATEGORIES: CocktailCategory[] = ['classic', 'tiki', 'sour', 'highball', 'shot', 'hot', 'non_alcoholic', 'smoothie', 'signature']

type RecipeInput = Omit<BarRecipe, 'id' | 'profile_id' | 'created_at' | 'updated_at' | 'is_on_menu' | 'is_favorite'>
type IngredientInput = Omit<BarRecipeIngredient, 'id' | 'recipe_id' | 'created_at'>

interface AddRecipeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (recipe: RecipeInput, ingredients: IngredientInput[]) => Promise<void>
  editingRecipe?: BarRecipeWithIngredients | null
}

const METHODS: CocktailMethod[] = ['build', 'stir', 'shake', 'blend', 'layer', 'muddle']
const GLASS_KEYS = ['highball', 'rocks', 'coupe', 'flute', 'martini', 'collins', 'hurricane', 'shot', 'wine', 'beer', 'copper_mug', 'tiki', 'other']
const PORTION_UNITS: BarPortionUnit[] = ['ml', 'g', 'pcs', 'oz', 'cl', 'dash', 'barspoon', 'drop', 'slice', 'sprig', 'wedge', 'twist']

interface IngredientRow {
  key: string
  ingredient_name: string
  quantity: string
  unit: BarPortionUnit
  bar_inventory_id: string | null
  is_optional: boolean
}

export function AddRecipeModal({ isOpen, onClose, onSave, editingRecipe }: AddRecipeModalProps) {
  const t = useTranslation('bar')
  const tc = useTranslation('common')
  const { locale } = useLocale()

  const METHOD_LABELS: Record<string, string> = {
    build: t.methodBuild, stir: t.methodStir, shake: t.methodShake,
    blend: t.methodBlend, layer: t.methodLayer, muddle: t.methodMuddle,
  }
  const GLASS_LABELS: Record<string, string> = {
    highball: t.glassHighball, rocks: t.glassRocks, coupe: t.glassCoupe,
    flute: t.glassFlute, martini: t.glassMartini, collins: t.glassCollins,
    hurricane: t.glassHurricane, shot: t.glassShot, wine: t.glassWine,
    beer: t.glassBeer, copper_mug: t.glassCopperMug, tiki: t.glassTiki,
    other: t.glassOther,
  }
  const PORTION_LABELS: Record<string, string> = {
    ml: t.portionMl, g: t.portionG, pcs: t.portionPcs,
    oz: t.portionOz, cl: t.portionCl, dash: t.portionDash,
    barspoon: t.portionBarspoon, drop: t.portionDrop, slice: t.portionSlice,
    sprig: t.portionSprig, wedge: t.portionWedge, twist: t.portionTwist,
  }

  const [mode, setMode] = useState<'preset' | 'custom'>('preset')
  const [presetFilter, setPresetFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | CocktailCategory>('all')

  const CATEGORY_LABELS: Record<CocktailCategory, string> = {
    classic: t.catClassic, tiki: t.catTiki, sour: t.catSour, highball: t.catHighball,
    shot: t.catShot, hot: t.catHot, non_alcoholic: t.catNonAlcoholic,
    smoothie: t.catSmoothie, signature: t.catSignature,
  }

  // Form state
  const [name, setName] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [description, setDescription] = useState('')
  const [method, setMethod] = useState<CocktailMethod>('shake')
  const [glass, setGlass] = useState('rocks')
  const [garnish, setGarnish] = useState('')
  const [menuPrice, setMenuPrice] = useState('')
  const [difficulty, setDifficulty] = useState('1')
  const [notes, setNotes] = useState('')
  const [ingredients, setIngredients] = useState<IngredientRow[]>([])
  const [saving, setSaving] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  useBodyScrollLock(isOpen)
  useFocusTrap(modalRef, isOpen, onClose)

  useEffect(() => {
    if (editingRecipe) {
      setMode('custom')
      setName(editingRecipe.name)
      setNameEn(editingRecipe.name_en || '')
      setDescription(editingRecipe.description || '')
      setMethod(editingRecipe.method || 'shake')
      setGlass(editingRecipe.glass || 'rocks')
      setGarnish(editingRecipe.garnish_description || '')
      setMenuPrice(editingRecipe.menu_price?.toString() || '')
      setDifficulty(editingRecipe.difficulty?.toString() || '1')
      setNotes(editingRecipe.notes || '')
      setIngredients(editingRecipe.ingredients.map(ing => ({
        key: ing.id,
        ingredient_name: ing.ingredient_name,
        quantity: ing.quantity.toString(),
        unit: ing.unit,
        bar_inventory_id: ing.bar_inventory_id,
        is_optional: ing.is_optional,
      })))
    } else {
      setMode('preset')
      resetForm()
    }
  }, [editingRecipe, isOpen])

  const resetForm = () => {
    setName('')
    setNameEn('')
    setDescription('')
    setMethod('shake')
    setGlass('rocks')
    setGarnish('')
    setMenuPrice('')
    setDifficulty('1')
    setNotes('')
    setIngredients([])
    setPresetFilter('')
    setCategoryFilter('all')
  }

  const selectPreset = (preset: RecipePreset) => {
    setMode('custom')
    setName(getLocaleName(preset, locale))
    setNameEn(locale === 'ru' ? preset.name_en : preset.name)
    setMethod(preset.method)
    setGlass(preset.glass)
    setGarnish(preset.garnish)
    setDifficulty(preset.difficulty.toString())
    setIngredients(preset.ingredients.map((ing, i) => {
      // Look up localized ingredient name from bar-ingredients catalog
      const catalogItem = ing.preset_id ? BAR_INGREDIENT_PRESETS.find(p => p.id === ing.preset_id) : null
      const ingredientName = catalogItem ? getLocaleName(catalogItem, locale) : ing.name
      return {
        key: `preset-${i}`,
        ingredient_name: ingredientName,
        quantity: ing.quantity.toString(),
        unit: ing.unit,
        bar_inventory_id: null,
        is_optional: ing.is_optional || false,
      }
    }))
  }

  const addIngredientRow = () => {
    setIngredients(prev => [...prev, {
      key: `new-${Date.now()}`,
      ingredient_name: '',
      quantity: '',
      unit: 'ml' as BarPortionUnit,
      bar_inventory_id: null,
      is_optional: false,
    }])
  }

  const updateIngredient = (key: string, field: keyof IngredientRow, value: string | boolean | null) => {
    setIngredients(prev => prev.map(ing =>
      ing.key === key ? { ...ing, [field]: value } : ing
    ))
  }

  const removeIngredient = (key: string) => {
    setIngredients(prev => prev.filter(ing => ing.key !== key))
  }

  const moveIngredient = (key: string, direction: 'up' | 'down') => {
    setIngredients(prev => {
      const idx = prev.findIndex(ing => ing.key === key)
      if (idx === -1) return prev
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const copy = [...prev]
      ;[copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]
      return copy
    })
  }

  const filteredPresets = RECIPE_PRESETS.filter(p => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
    if (presetFilter) {
      const q = presetFilter.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !p.name_en.toLowerCase().includes(q)) return false
    }
    return true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || ingredients.length === 0) return

    setSaving(true)

    const recipe: RecipeInput = {
      name: name.trim(),
      name_en: nameEn.trim() || null,
      description: description.trim() || null,
      method,
      glass,
      garnish_description: garnish.trim() || null,
      menu_price: menuPrice ? parseFloat(menuPrice) : null,
      image_url: null,
      serving_size_ml: null,
      prep_time_seconds: null,
      difficulty: parseInt(difficulty) || null,
      notes: notes.trim() || null,
    }

    const ingredientInputs: IngredientInput[] = ingredients
      .filter(ing => ing.ingredient_name.trim())
      .map((ing, i) => ({
        bar_inventory_id: ing.bar_inventory_id,
        ingredient_name: ing.ingredient_name.trim(),
        quantity: parseFloat(ing.quantity) || 0,
        unit: ing.unit,
        is_optional: ing.is_optional,
        sort_order: i,
      }))

    try {
      await onSave(recipe, ingredientInputs)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div ref={modalRef} role="dialog" aria-modal="true" className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-xl">
        <div className="sticky top-0 z-10 bg-[var(--color-bgCard)] px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {editingRecipe ? t.editRecipe : t.newRecipeTitle}
            </h2>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-bgHover)]" aria-label={tc.close}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!editingRecipe && (
            <div className="flex gap-2 mt-3">
              <button type="button"
                onClick={() => setMode('preset')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'preset' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)]'
                }`}
              >
                {t.fromCatalog}
              </button>
              <button type="button"
                onClick={() => setMode('custom')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'custom' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)]'
                }`}
              >
                {t.customRecipe}
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          {mode === 'preset' && !editingRecipe ? (
            <div className="space-y-3">
              <input
                type="text"
                value={presetFilter}
                onChange={e => setPresetFilter(e.target.value)}
                placeholder={t.searchCocktail}
                className="input"
              />
              {/* Category filter */}
              <div className="flex flex-wrap gap-1.5">
                <button type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                      : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)]'
                  }`}
                >
                  {t.all}
                </button>
                {COCKTAIL_CATEGORIES.map(cat => (
                  <button type="button"
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                        : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)]'
                    }`}
                  >
                    {COCKTAIL_CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
              <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                {filteredPresets.map(preset => (
                  <button type="button"
                    key={preset.id}
                    onClick={() => selectPreset(preset)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--color-bgHover)] transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {COCKTAIL_CATEGORY_EMOJI[preset.category]} {getLocaleName(preset, locale)}
                      </div>
                      <div className="text-xs text-[var(--color-textMuted)]">
                        {locale === 'ru' ? preset.name_en : preset.name} · {METHOD_LABELS[preset.method]} · {preset.ingredients.length} {t.ingredientsShort}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-[var(--color-textMuted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.nameRequired}</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)} required
                    className="input"
                    placeholder="Mojito"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">English name</label>
                  <input
                    type="text" value={nameEn} onChange={e => setNameEn(e.target.value)}
                    className="input"
                    placeholder="Mojito"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.methodLabel}</label>
                  <select value={method} onChange={e => setMethod(e.target.value as CocktailMethod)}
                    className="input"
                  >
                    {METHODS.map(m => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.glassLabel}</label>
                  <select value={glass} onChange={e => setGlass(e.target.value)}
                    className="input"
                  >
                    {GLASS_KEYS.map(g => <option key={g} value={g}>{GLASS_LABELS[g]}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.difficultyLabel}</label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                    className="input"
                  >
                    <option value="1">{t.easy}</option>
                    <option value="2">{t.medium}</option>
                    <option value="3">{t.hard}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.menuPriceEur}</label>
                  <input
                    type="number" inputMode="decimal" step="0.01" min="0" value={menuPrice} onChange={e => setMenuPrice(e.target.value)}
                    className="input"
                    placeholder="12.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.garnishLabel}</label>
                  <input
                    type="text" value={garnish} onChange={e => setGarnish(e.target.value)}
                    className="input"
                    placeholder={t.garnishPlaceholder}
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Ingredients */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t.ingredientsRequired}</label>
                  <button type="button" onClick={addIngredientRow}
                    className="text-xs text-[var(--color-primary)] hover:underline"
                  >
                    + {t.addBtn}
                  </button>
                </div>

                {ingredients.length === 0 && (
                  <p className="text-sm text-[var(--color-textMuted)] text-center py-4">
                    {t.addAtLeastOne}
                  </p>
                )}

                {ingredients.map((ing, idx) => (
                  <div key={ing.key} className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-bgHover)]">
                    <div className="flex flex-col gap-0.5">
                      <button type="button" onClick={() => moveIngredient(ing.key, 'up')}
                        disabled={idx === 0}
                        className="text-xs text-[var(--color-textMuted)] disabled:opacity-30 hover:text-[var(--color-text)]"
                      >
                        ▲
                      </button>
                      <button type="button" onClick={() => moveIngredient(ing.key, 'down')}
                        disabled={idx === ingredients.length - 1}
                        className="text-xs text-[var(--color-textMuted)] disabled:opacity-30 hover:text-[var(--color-text)]"
                      >
                        ▼
                      </button>
                    </div>
                    <input
                      type="text"
                      value={ing.ingredient_name}
                      onChange={e => updateIngredient(ing.key, 'ingredient_name', e.target.value)}
                      placeholder={t.ingredientName}
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-[var(--color-bgCard)] border border-[var(--color-border)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      value={ing.quantity}
                      onChange={e => updateIngredient(ing.key, 'quantity', e.target.value)}
                      placeholder="0"
                      className="w-16 px-2 py-2 rounded-lg bg-[var(--color-bgCard)] border border-[var(--color-border)] text-sm text-right focus:border-[var(--color-primary)] focus:outline-none"
                    />
                    <select
                      value={ing.unit}
                      onChange={e => updateIngredient(ing.key, 'unit', e.target.value)}
                      className="w-24 px-2 py-2 rounded-lg bg-[var(--color-bgCard)] border border-[var(--color-border)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    >
                      {PORTION_UNITS.map(u => (
                        <option key={u} value={u}>{PORTION_LABELS[u]}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => removeIngredient(ing.key)}
                      className="p-1 text-[var(--color-textMuted)] hover:text-[var(--color-danger)]"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                {!editingRecipe && (
                  <button type="button" onClick={() => setMode('preset')} className="btn btn-ghost">
                    {t.back}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving || !name.trim() || ingredients.length === 0}
                  className="btn btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                  {saving ? t.saving : editingRecipe ? t.save : t.createRecipeBtn}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
