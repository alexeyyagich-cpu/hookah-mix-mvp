'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { useBarInventory } from '@/lib/hooks/useBarInventory'
import { getCachedData, setCachedData } from '@/lib/offline/db'
import { PORTION_CONVERSIONS } from '@/data/bar-ingredients'
import type {
  BarInventoryItem,
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
  // === CLASSICS ===
  {
    id: 'demo-r1', profile_id: 'demo', name: 'Mojito', name_en: 'Mojito',
    description: 'Refreshing Cuban cocktail with mint and lime', method: 'muddle', glass: 'highball',
    garnish_description: 'Mint, lime', menu_price: 9, is_on_menu: true, is_favorite: true,
    image_url: null, serving_size_ml: null, prep_time_seconds: 120, difficulty: 1, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di1', 'demo-r1', 'White Rum', 50, 'ml', 0, 'b3'),
      ing('di2', 'demo-r1', 'Lime Juice', 30, 'ml', 1, 'b5'),
      ing('di3', 'demo-r1', 'Simple Syrup', 20, 'ml', 2, 'b4'),
      ing('di4', 'demo-r1', 'Soda Water', 60, 'ml', 3),
      ing('di5', 'demo-r1', 'Mint', 8, 'pcs', 4, 'b6'),
    ],
  },
  {
    id: 'demo-r2', profile_id: 'demo', name: 'Negroni', name_en: 'Negroni',
    description: 'Italian classic with a bitter aftertaste', method: 'stir', glass: 'rocks',
    garnish_description: 'Orange wedge', menu_price: 11, is_on_menu: true, is_favorite: true,
    image_url: null, serving_size_ml: null, prep_time_seconds: 60, difficulty: 1, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di6', 'demo-r2', 'Gin', 30, 'ml', 0, 'b2'),
      ing('di7', 'demo-r2', 'Campari', 30, 'ml', 1),
      ing('di8', 'demo-r2', 'Sweet Vermouth', 30, 'ml', 2),
    ],
  },
  {
    id: 'demo-r3', profile_id: 'demo', name: 'Gin & Tonic', name_en: 'Gin & Tonic',
    description: 'Light long drink with botanicals', method: 'build', glass: 'highball',
    garnish_description: 'Lime wedge, rosemary', menu_price: 8, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 30, difficulty: 1, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di9', 'demo-r3', 'Gin', 50, 'ml', 0, 'b2'),
      ing('di10', 'demo-r3', 'Tonic Water', 150, 'ml', 1, 'b8'),
    ],
  },
  {
    id: 'demo-r4', profile_id: 'demo', name: 'Aperol Spritz', name_en: 'Aperol Spritz',
    description: 'Italian aperitif — bitter, fresh, perfect on the terrace', method: 'build', glass: 'wine',
    garnish_description: 'Orange wedge', menu_price: 9, is_on_menu: true, is_favorite: true,
    image_url: null, serving_size_ml: null, prep_time_seconds: 30, difficulty: 1, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di11', 'demo-r4', 'Aperol', 60, 'ml', 0),
      ing('di12', 'demo-r4', 'Prosecco', 90, 'ml', 1),
      ing('di13', 'demo-r4', 'Soda Water', 30, 'ml', 2),
    ],
  },
  {
    id: 'demo-r5', profile_id: 'demo', name: 'Margarita', name_en: 'Margarita',
    description: 'Classic Mexican cocktail with tequila and lime', method: 'shake', glass: 'coupe',
    garnish_description: 'Salt rim, lime', menu_price: 10, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 90, difficulty: 2, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di14', 'demo-r5', 'Tequila Blanco', 50, 'ml', 0),
      ing('di15', 'demo-r5', 'Triple Sec', 20, 'ml', 1),
      ing('di16', 'demo-r5', 'Lime Juice', 25, 'ml', 2, 'b5'),
    ],
  },
  {
    id: 'demo-r6', profile_id: 'demo', name: 'Whiskey Sour', name_en: 'Whiskey Sour',
    description: 'Bourbon with lemon and velvety foam', method: 'shake', glass: 'rocks',
    garnish_description: 'Cherry, lemon wedge', menu_price: 11, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 90, difficulty: 2, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di17', 'demo-r6', 'Bourbon', 50, 'ml', 0, 'b1'),
      ing('di18', 'demo-r6', 'Lemon Juice', 25, 'ml', 1),
      ing('di19', 'demo-r6', 'Simple Syrup', 15, 'ml', 2, 'b4'),
      ing('di20', 'demo-r6', 'Egg White', 1, 'pcs', 3),
    ],
  },
  {
    id: 'demo-r7', profile_id: 'demo', name: 'Espresso Martini', name_en: 'Espresso Martini',
    description: 'Coffee cocktail with vodka — energy and flavor', method: 'shake', glass: 'coupe',
    garnish_description: 'Three coffee beans', menu_price: 11, is_on_menu: true, is_favorite: true,
    image_url: null, serving_size_ml: null, prep_time_seconds: 120, difficulty: 2, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di21', 'demo-r7', 'Vodka', 40, 'ml', 0),
      ing('di22', 'demo-r7', 'Coffee Liqueur', 20, 'ml', 1),
      ing('di23', 'demo-r7', 'Espresso', 30, 'ml', 2),
      ing('di24', 'demo-r7', 'Simple Syrup', 10, 'ml', 3, 'b4'),
    ],
  },
  // === SIGNATURE ===
  {
    id: 'demo-r8', profile_id: 'demo', name: 'Leipzig Sour', name_en: 'Leipzig Sour',
    description: 'Signature sour with sea buckthorn and honey — our bestseller', method: 'shake', glass: 'coupe',
    garnish_description: 'Sea buckthorn, thyme', menu_price: 12, is_on_menu: true, is_favorite: true,
    image_url: null, serving_size_ml: null, prep_time_seconds: 120, difficulty: 3, notes: 'Signature cocktail',
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di25', 'demo-r8', 'Gin', 45, 'ml', 0, 'b2'),
      ing('di26', 'demo-r8', 'Sea Buckthorn Syrup', 20, 'ml', 1),
      ing('di27', 'demo-r8', 'Honey Syrup', 15, 'ml', 2),
      ing('di28', 'demo-r8', 'Lemon Juice', 25, 'ml', 3),
      ing('di29', 'demo-r8', 'Egg White', 1, 'pcs', 4),
    ],
  },
  {
    id: 'demo-r9', profile_id: 'demo', name: 'Smoke & Honey', name_en: 'Smoke & Honey',
    description: 'Smoky Old Fashioned with honey and orange', method: 'stir', glass: 'rocks',
    garnish_description: 'Orange peel, cinnamon', menu_price: 13, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 90, difficulty: 3, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di30', 'demo-r9', 'Bourbon', 60, 'ml', 0, 'b1'),
      ing('di31', 'demo-r9', 'Honey Syrup', 15, 'ml', 1),
      ing('di32', 'demo-r9', 'Angostura Bitters', 2, 'dash', 2),
    ],
  },
  {
    id: 'demo-r10', profile_id: 'demo', name: 'Tropical Hookah', name_en: 'Tropical Hookah',
    description: 'Non-alcoholic tropical cocktail — perfect with hookah', method: 'shake', glass: 'highball',
    garnish_description: 'Pineapple, umbrella', menu_price: 7, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 60, difficulty: 1, notes: 'Non-alcoholic',
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di33', 'demo-r10', 'Pineapple Juice', 100, 'ml', 0),
      ing('di34', 'demo-r10', 'Passion Fruit Puree', 30, 'ml', 1),
      ing('di35', 'demo-r10', 'Coconut Syrup', 15, 'ml', 2),
      ing('di36', 'demo-r10', 'Lime Juice', 15, 'ml', 3, 'b5'),
    ],
  },
  // === LONG DRINKS ===
  {
    id: 'demo-r11', profile_id: 'demo', name: 'Moscow Mule', name_en: 'Moscow Mule',
    description: 'Vodka with ginger beer and lime in a copper mug', method: 'build', glass: 'copper_mug',
    garnish_description: 'Lime, ginger', menu_price: 9, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 30, difficulty: 1, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di37', 'demo-r11', 'Vodka', 50, 'ml', 0),
      ing('di38', 'demo-r11', 'Ginger Beer', 120, 'ml', 1),
      ing('di39', 'demo-r11', 'Lime Juice', 15, 'ml', 2, 'b5'),
    ],
  },
  {
    id: 'demo-r12', profile_id: 'demo', name: 'Cuba Libre', name_en: 'Cuba Libre',
    description: 'Rum, cola, and lime — a Caribbean classic', method: 'build', glass: 'highball',
    garnish_description: 'Lime wedge', menu_price: 8, is_on_menu: true, is_favorite: false,
    image_url: null, serving_size_ml: null, prep_time_seconds: 30, difficulty: 1, notes: null,
    created_at: ts, updated_at: ts,
    ingredients: [
      ing('di40', 'demo-r12', 'Gold Rum', 50, 'ml', 0),
      ing('di41', 'demo-r12', 'Cola', 120, 'ml', 1),
      ing('di42', 'demo-r12', 'Lime Juice', 10, 'ml', 2, 'b5'),
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

export function useBarRecipes(inventoryOverride?: BarInventoryItem[]): UseBarRecipesReturn {
  const [recipes, setRecipes] = useState<BarRecipeWithIngredients[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isDemoMode } = useAuth()
  const { organizationId } = useOrganizationContext()
  const { inventory: ownInventory } = useBarInventory()
  const barInventory = inventoryOverride ?? ownInventory
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

    const cached = await getCachedData<BarRecipeWithIngredients>('bar_recipes', user.id)
    if (cached) { setRecipes(cached.data); setLoading(false) }
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    if (!cached) setLoading(true)
    setError(null)

    try {
      const { data: recipesData, error: fetchError } = await supabase
        .from('bar_recipes')
        .select('*')
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
        .order('name', { ascending: true })

      if (fetchError) {
        if (!cached) { setError(fetchError.message); setRecipes([]) }
        setLoading(false)
        return
      }

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
      await setCachedData('bar_recipes', user.id, recipesWithIngredients)
    } catch {
      // Network error — keep cache
    }

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
