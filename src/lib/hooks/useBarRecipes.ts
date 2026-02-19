'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { useBarInventory } from '@/lib/hooks/useBarInventory'
import { PORTION_CONVERSIONS } from '@/data/bar-ingredients'
import type {
  BarRecipe,
  BarRecipeIngredient,
  BarRecipeWithIngredients,
  RecipeCost,
  RecipeCostBreakdown,
} from '@/types/database'

// Demo recipes — Leipzig hookah lounge bar menu
const ts = new Date().toISOString()
const ing = (id: string, rid: string, name: string, qty: number, unit: string, order: number, invId: string | null = null): BarRecipeIngredient => ({
  id, recipe_id: rid, bar_inventory_id: invId, ingredient_name: name,
  quantity: qty, unit: unit as BarRecipeIngredient['unit'], is_optional: false, sort_order: order, created_at: ts,
})

const DEMO_RECIPES: BarRecipeWithIngredients[] = [
  // === КЛАССИКА ===
  {
    id: 'demo-r1', profile_id: 'demo', name: 'Мохито', name_en: 'Mojito',
    description: 'Освежающий кубинский коктейль с мятой и лаймом', method: 'muddle', glass: 'highball',
    garnish_description: 'Мята, лайм', menu_price: 9, is_on_menu: true, is_favorite: true,
    image_url: null, serving_size_ml: null, prep_time_seconds: 120, difficulty: 1, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di1', 'demo-r1', 'Белый ром', 50, 'ml', 0, 'b3'),
      ing('di2', 'demo-r1', 'Сок лайма', 30, 'ml', 1, 'b5'),
      ing('di3', 'demo-r1', 'Сахарный сироп', 20, 'ml', 2, 'b4'),
      ing('di4', 'demo-r1', 'Содовая', 60, 'ml', 3),
      ing('di5', 'demo-r1', 'Мята', 8, 'pcs', 4, 'b6'),
    ],
  },
  {
    id: 'demo-r2', profile_id: 'demo', name: 'Негрони', name_en: 'Negroni',
    description: 'Итальянская классика с горьковатым послевкусием', method: 'stir', glass: 'rocks',
    garnish_description: 'Долька апельсина', menu_price: 11, is_on_menu: true, is_favorite: true,
    image_url: null, serving_size_ml: null, prep_time_seconds: 60, difficulty: 1, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di6', 'demo-r2', 'Джин', 30, 'ml', 0, 'b2'),
      ing('di7', 'demo-r2', 'Кампари', 30, 'ml', 1),
      ing('di8', 'demo-r2', 'Сладкий вермут', 30, 'ml', 2),
    ],
  },
  {
    id: 'demo-r3', profile_id: 'demo', name: 'Джин-Тоник', name_en: 'Gin & Tonic',
    description: 'Лёгкий лонг-дринк с ботаникой', method: 'build', glass: 'highball',
    garnish_description: 'Долька лайма, розмарин', menu_price: 8, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 30, difficulty: 1, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di9', 'demo-r3', 'Джин', 50, 'ml', 0, 'b2'),
      ing('di10', 'demo-r3', 'Тоник', 150, 'ml', 1, 'b8'),
    ],
  },
  {
    id: 'demo-r4', profile_id: 'demo', name: 'Апероль Шприц', name_en: 'Aperol Spritz',
    description: 'Итальянский аперитив — горький, свежий, идеальный на террасе', method: 'build', glass: 'wine',
    garnish_description: 'Долька апельсина', menu_price: 9, is_on_menu: true, is_favorite: true,
    image_url: null, serving_size_ml: null, prep_time_seconds: 30, difficulty: 1, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di11', 'demo-r4', 'Апероль', 60, 'ml', 0),
      ing('di12', 'demo-r4', 'Просекко', 90, 'ml', 1),
      ing('di13', 'demo-r4', 'Содовая', 30, 'ml', 2),
    ],
  },
  {
    id: 'demo-r5', profile_id: 'demo', name: 'Маргарита', name_en: 'Margarita',
    description: 'Классический мексиканский коктейль с текилой и лаймом', method: 'shake', glass: 'coupe',
    garnish_description: 'Соль на ободке, лайм', menu_price: 10, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 90, difficulty: 2, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di14', 'demo-r5', 'Текила бланко', 50, 'ml', 0),
      ing('di15', 'demo-r5', 'Трипл Сек', 20, 'ml', 1),
      ing('di16', 'demo-r5', 'Сок лайма', 25, 'ml', 2, 'b5'),
    ],
  },
  {
    id: 'demo-r6', profile_id: 'demo', name: 'Виски Сауэр', name_en: 'Whiskey Sour',
    description: 'Бурбон с лимоном и бархатной пеной', method: 'shake', glass: 'rocks',
    garnish_description: 'Вишня, долька лимона', menu_price: 11, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 90, difficulty: 2, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di17', 'demo-r6', 'Бурбон', 50, 'ml', 0, 'b1'),
      ing('di18', 'demo-r6', 'Сок лимона', 25, 'ml', 1),
      ing('di19', 'demo-r6', 'Сахарный сироп', 15, 'ml', 2, 'b4'),
      ing('di20', 'demo-r6', 'Яичный белок', 1, 'pcs', 3),
    ],
  },
  {
    id: 'demo-r7', profile_id: 'demo', name: 'Эспрессо Мартини', name_en: 'Espresso Martini',
    description: 'Кофейный коктейль с водкой — энергия и вкус', method: 'shake', glass: 'coupe',
    garnish_description: 'Три зерна кофе', menu_price: 11, is_on_menu: true, is_favorite: true,
    image_url: null, serving_size_ml: null, prep_time_seconds: 120, difficulty: 2, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di21', 'demo-r7', 'Водка', 40, 'ml', 0),
      ing('di22', 'demo-r7', 'Кофейный ликёр', 20, 'ml', 1),
      ing('di23', 'demo-r7', 'Эспрессо', 30, 'ml', 2),
      ing('di24', 'demo-r7', 'Сахарный сироп', 10, 'ml', 3, 'b4'),
    ],
  },
  // === АВТОРСКИЕ ===
  {
    id: 'demo-r8', profile_id: 'demo', name: 'Leipzig Sour', name_en: 'Leipzig Sour',
    description: 'Авторский сауэр с облепихой и мёдом — наш бестселлер', method: 'shake', glass: 'coupe',
    garnish_description: 'Облепиха, тимьян', menu_price: 12, is_on_menu: true, is_favorite: true,
    image_url: null, serving_size_ml: null, prep_time_seconds: 120, difficulty: 3, notes: 'Signature cocktail',
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di25', 'demo-r8', 'Джин', 45, 'ml', 0, 'b2'),
      ing('di26', 'demo-r8', 'Облепиховый сироп', 20, 'ml', 1),
      ing('di27', 'demo-r8', 'Медовый сироп', 15, 'ml', 2),
      ing('di28', 'demo-r8', 'Сок лимона', 25, 'ml', 3),
      ing('di29', 'demo-r8', 'Яичный белок', 1, 'pcs', 4),
    ],
  },
  {
    id: 'demo-r9', profile_id: 'demo', name: 'Smoke & Honey', name_en: 'Smoke & Honey',
    description: 'Дымный Old Fashioned с мёдом и апельсином', method: 'stir', glass: 'rocks',
    garnish_description: 'Апельсиновая цедра, корица', menu_price: 13, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 90, difficulty: 3, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di30', 'demo-r9', 'Бурбон', 60, 'ml', 0, 'b1'),
      ing('di31', 'demo-r9', 'Медовый сироп', 15, 'ml', 1),
      ing('di32', 'demo-r9', 'Ангостура биттерс', 2, 'dash', 2),
    ],
  },
  {
    id: 'demo-r10', profile_id: 'demo', name: 'Tropical Hookah', name_en: 'Tropical Hookah',
    description: 'Безалкогольный тропический коктейль — идеально к кальяну', method: 'shake', glass: 'highball',
    garnish_description: 'Ананас, зонтик', menu_price: 7, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 60, difficulty: 1, notes: 'Non-alcoholic',
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di33', 'demo-r10', 'Ананасовый сок', 100, 'ml', 0),
      ing('di34', 'demo-r10', 'Маракуйя пюре', 30, 'ml', 1),
      ing('di35', 'demo-r10', 'Кокосовый сироп', 15, 'ml', 2),
      ing('di36', 'demo-r10', 'Сок лайма', 15, 'ml', 3, 'b5'),
    ],
  },
  // === ЛОНГ ДРИНКИ ===
  {
    id: 'demo-r11', profile_id: 'demo', name: 'Московский мул', name_en: 'Moscow Mule',
    description: 'Водка с имбирным пивом и лаймом в медной кружке', method: 'build', glass: 'copper_mug',
    garnish_description: 'Лайм, имбирь', menu_price: 9, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 30, difficulty: 1, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di37', 'demo-r11', 'Водка', 50, 'ml', 0),
      ing('di38', 'demo-r11', 'Имбирное пиво', 120, 'ml', 1),
      ing('di39', 'demo-r11', 'Сок лайма', 15, 'ml', 2, 'b5'),
    ],
  },
  {
    id: 'demo-r12', profile_id: 'demo', name: 'Куба Либре', name_en: 'Cuba Libre',
    description: 'Ром, кола и лайм — классика Карибов', method: 'build', glass: 'highball',
    garnish_description: 'Долька лайма', menu_price: 8, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 30, difficulty: 1, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di40', 'demo-r12', 'Золотой ром', 50, 'ml', 0),
      ing('di41', 'demo-r12', 'Кола', 120, 'ml', 1),
      ing('di42', 'demo-r12', 'Сок лайма', 10, 'ml', 2, 'b5'),
    ],
  },
]

type RecipeInput = Omit<BarRecipe, 'id' | 'profile_id' | 'created_at' | 'updated_at' | 'is_on_menu' | 'is_favorite'>
type IngredientInput = Omit<BarRecipeIngredient, 'id' | 'recipe_id' | 'created_at'>

interface UseBarRecipesReturn {
  recipes: BarRecipeWithIngredients[]
  loading: boolean
  error: string | null
  addRecipe: (recipe: RecipeInput, ingredients: IngredientInput[]) => Promise<BarRecipe | null>
  updateRecipe: (id: string, updates: Partial<BarRecipe>, ingredients?: IngredientInput[]) => Promise<boolean>
  deleteRecipe: (id: string) => Promise<boolean>
  toggleOnMenu: (id: string) => Promise<boolean>
  toggleFavorite: (id: string) => Promise<boolean>
  calculateCost: (recipe: BarRecipeWithIngredients) => RecipeCost
  refresh: () => Promise<void>
}

export function useBarRecipes(): UseBarRecipesReturn {
  const [recipes, setRecipes] = useState<BarRecipeWithIngredients[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isDemoMode } = useAuth()
  const { organizationId } = useOrganizationContext()
  const { inventory: barInventory } = useBarInventory()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  useEffect(() => {
    if (isDemoMode && user) {
      setRecipes(DEMO_RECIPES)
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchRecipes = useCallback(async () => {
    if (!user || !supabase) {
      setRecipes([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data: recipesData, error: fetchError } = await supabase
      .from('bar_recipes')
      .select('*')
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setRecipes([])
      setLoading(false)
      return
    }

    // Fetch ingredients for all recipes
    const recipeIds = (recipesData || []).map(r => r.id)
    let ingredientsData: BarRecipeIngredient[] = []
    if (recipeIds.length > 0) {
      const { data: ings } = await supabase
        .from('bar_recipe_ingredients')
        .select('*')
        .in('recipe_id', recipeIds)
        .order('sort_order', { ascending: true })
      ingredientsData = ings || []
    }

    const recipesWithIngredients: BarRecipeWithIngredients[] = (recipesData || []).map(r => ({
      ...r,
      ingredients: ingredientsData.filter(i => i.recipe_id === r.id),
    }))

    setRecipes(recipesWithIngredients)
    setLoading(false)
  }, [user, supabase, organizationId])

  useEffect(() => {
    if (!isDemoMode) fetchRecipes()
  }, [fetchRecipes, isDemoMode])

  const calculateCost = useCallback((recipe: BarRecipeWithIngredients): RecipeCost => {
    const ingredientCosts: RecipeCostBreakdown[] = recipe.ingredients.map(ing => {
      // Find inventory item
      const inventoryItem = ing.bar_inventory_id
        ? barInventory.find(i => i.id === ing.bar_inventory_id)
        : null

      // Convert recipe unit to base unit
      const conversion = PORTION_CONVERSIONS[ing.unit]
      const baseQuantity = conversion ? ing.quantity * conversion.value : ing.quantity

      // Calculate cost per base unit from inventory
      let unitCost = 0
      if (inventoryItem && inventoryItem.purchase_price && inventoryItem.package_size > 0) {
        unitCost = inventoryItem.purchase_price / inventoryItem.package_size
      }

      const totalCost = baseQuantity * unitCost

      return {
        ingredient_name: ing.ingredient_name,
        quantity: ing.quantity,
        unit: ing.unit,
        unit_cost: unitCost,
        total_cost: totalCost,
        in_stock: inventoryItem ? inventoryItem.quantity >= baseQuantity : false,
      }
    })

    const totalCost = ingredientCosts.reduce((sum, ic) => sum + ic.total_cost, 0)
    const menuPrice = recipe.menu_price
    const margin = menuPrice && menuPrice > 0
      ? ((menuPrice - totalCost) / menuPrice) * 100
      : null

    return {
      recipe_id: recipe.id,
      total_cost: totalCost,
      menu_price: menuPrice,
      margin,
      ingredients: ingredientCosts,
      all_in_stock: ingredientCosts.every(ic => ic.in_stock),
    }
  }, [barInventory])

  const addRecipe = async (recipe: RecipeInput, ingredients: IngredientInput[]): Promise<BarRecipe | null> => {
    if (!user) return null

    if (isDemoMode || !supabase) {
      const newRecipe: BarRecipeWithIngredients = {
        ...recipe,
        id: `demo-${Date.now()}`,
        profile_id: 'demo',
        is_on_menu: false,
        is_favorite: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ingredients: ingredients.map((ing, i) => ({
          ...ing,
          id: `demo-ing-${Date.now()}-${i}`,
          recipe_id: `demo-${Date.now()}`,
          created_at: new Date().toISOString(),
        })),
      }
      setRecipes(prev => [...prev, newRecipe])
      return newRecipe
    }

    const { data, error: insertError } = await supabase
      .from('bar_recipes')
      .insert({
        ...recipe,
        profile_id: user.id,
        ...(organizationId ? { organization_id: organizationId } : {}),
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return null
    }

    if (ingredients.length > 0) {
      await supabase.from('bar_recipe_ingredients').insert(
        ingredients.map((ing, i) => ({
          ...ing,
          recipe_id: data.id,
          sort_order: ing.sort_order ?? i,
        }))
      )
    }

    await fetchRecipes()
    return data
  }

  const updateRecipe = async (id: string, updates: Partial<BarRecipe>, ingredients?: IngredientInput[]): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setRecipes(prev => prev.map(r =>
        r.id === id
          ? {
              ...r,
              ...updates,
              updated_at: new Date().toISOString(),
              ingredients: ingredients
                ? ingredients.map((ing, i) => ({
                    ...ing,
                    id: `demo-ing-${Date.now()}-${i}`,
                    recipe_id: id,
                    created_at: new Date().toISOString(),
                  }))
                : r.ingredients,
            }
          : r
      ))
      return true
    }

    const { error: updateError } = await supabase
      .from('bar_recipes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    // Replace ingredients if provided
    if (ingredients) {
      await supabase
        .from('bar_recipe_ingredients')
        .delete()
        .eq('recipe_id', id)

      if (ingredients.length > 0) {
        await supabase.from('bar_recipe_ingredients').insert(
          ingredients.map((ing, i) => ({
            ...ing,
            recipe_id: id,
            sort_order: ing.sort_order ?? i,
          }))
        )
      }
    }

    await fetchRecipes()
    return true
  }

  const deleteRecipe = async (id: string): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setRecipes(prev => prev.filter(r => r.id !== id))
      return true
    }

    // Ingredients cascade-deleted by FK
    const { error: deleteError } = await supabase
      .from('bar_recipes')
      .delete()
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    await fetchRecipes()
    return true
  }

  const toggleOnMenu = async (id: string): Promise<boolean> => {
    const recipe = recipes.find(r => r.id === id)
    if (!recipe) return false
    return updateRecipe(id, { is_on_menu: !recipe.is_on_menu })
  }

  const toggleFavorite = async (id: string): Promise<boolean> => {
    const recipe = recipes.find(r => r.id === id)
    if (!recipe) return false
    return updateRecipe(id, { is_favorite: !recipe.is_favorite })
  }

  return {
    recipes,
    loading,
    error,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleOnMenu,
    toggleFavorite,
    calculateCost,
    refresh: fetchRecipes,
  }
}
