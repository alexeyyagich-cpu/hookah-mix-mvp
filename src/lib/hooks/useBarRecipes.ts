'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useBarInventory } from '@/lib/hooks/useBarInventory'
import { PORTION_CONVERSIONS } from '@/data/bar-ingredients'
import type {
  BarRecipe,
  BarRecipeIngredient,
  BarRecipeWithIngredients,
  RecipeCost,
  RecipeCostBreakdown,
} from '@/types/database'

const DEMO_RECIPES: BarRecipeWithIngredients[] = [
  {
    id: 'demo-r1', profile_id: 'demo', name: 'Мохито', name_en: 'Mojito',
    description: 'Освежающий кубинский коктейль', method: 'muddle', glass: 'highball',
    garnish_description: 'Мята, лайм', menu_price: 12, is_on_menu: true, is_favorite: true,
    image_url: null, serving_size_ml: null, prep_time_seconds: 120, difficulty: 1, notes: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    ingredients: [
      { id: 'di1', recipe_id: 'demo-r1', bar_inventory_id: 'b3', ingredient_name: 'Белый ром', quantity: 50, unit: 'ml', is_optional: false, sort_order: 0, created_at: new Date().toISOString() },
      { id: 'di2', recipe_id: 'demo-r1', bar_inventory_id: 'b5', ingredient_name: 'Сок лайма', quantity: 30, unit: 'ml', is_optional: false, sort_order: 1, created_at: new Date().toISOString() },
      { id: 'di3', recipe_id: 'demo-r1', bar_inventory_id: 'b4', ingredient_name: 'Сахарный сироп', quantity: 20, unit: 'ml', is_optional: false, sort_order: 2, created_at: new Date().toISOString() },
      { id: 'di4', recipe_id: 'demo-r1', bar_inventory_id: null, ingredient_name: 'Содовая', quantity: 60, unit: 'ml', is_optional: false, sort_order: 3, created_at: new Date().toISOString() },
      { id: 'di5', recipe_id: 'demo-r1', bar_inventory_id: 'b6', ingredient_name: 'Мята', quantity: 8, unit: 'pcs', is_optional: false, sort_order: 4, created_at: new Date().toISOString() },
    ],
  },
  {
    id: 'demo-r2', profile_id: 'demo', name: 'Негрони', name_en: 'Negroni',
    description: 'Итальянская классика', method: 'stir', glass: 'rocks',
    garnish_description: 'Долька апельсина', menu_price: 14, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 60, difficulty: 1, notes: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    ingredients: [
      { id: 'di6', recipe_id: 'demo-r2', bar_inventory_id: 'b2', ingredient_name: 'Джин', quantity: 30, unit: 'ml', is_optional: false, sort_order: 0, created_at: new Date().toISOString() },
      { id: 'di7', recipe_id: 'demo-r2', bar_inventory_id: null, ingredient_name: 'Кампари', quantity: 30, unit: 'ml', is_optional: false, sort_order: 1, created_at: new Date().toISOString() },
      { id: 'di8', recipe_id: 'demo-r2', bar_inventory_id: null, ingredient_name: 'Сладкий вермут', quantity: 30, unit: 'ml', is_optional: false, sort_order: 2, created_at: new Date().toISOString() },
    ],
  },
  {
    id: 'demo-r3', profile_id: 'demo', name: 'Джин-Тоник', name_en: 'Gin & Tonic',
    description: null, method: 'build', glass: 'highball',
    garnish_description: 'Долька лайма', menu_price: 10, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 30, difficulty: 1, notes: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    ingredients: [
      { id: 'di9', recipe_id: 'demo-r3', bar_inventory_id: 'b2', ingredient_name: 'Джин', quantity: 50, unit: 'ml', is_optional: false, sort_order: 0, created_at: new Date().toISOString() },
      { id: 'di10', recipe_id: 'demo-r3', bar_inventory_id: 'b8', ingredient_name: 'Тоник', quantity: 150, unit: 'ml', is_optional: false, sort_order: 1, created_at: new Date().toISOString() },
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
      .eq('profile_id', user.id)
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
  }, [user, supabase])

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
      .insert({ ...recipe, profile_id: user.id })
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
      .eq('profile_id', user.id)

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
      .eq('profile_id', user.id)

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
