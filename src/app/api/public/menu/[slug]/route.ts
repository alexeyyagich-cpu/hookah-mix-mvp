import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Find profile by venue_slug
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, business_name, business_type, logo_url, venue_slug')
    .eq('venue_slug', slug)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
  }

  // Fetch bar recipes where is_on_menu = true
  const { data: recipes } = await supabase
    .from('bar_recipes')
    .select('id, name, name_en, description, method, glass, garnish_description, menu_price')
    .eq('profile_id', profile.id)
    .eq('is_on_menu', true)
    .order('name', { ascending: true })

  // Fetch ingredient names for all recipes
  const recipeIds = (recipes || []).map(r => r.id)
  let ingredientMap: Record<string, string[]> = {}

  if (recipeIds.length > 0) {
    const { data: ingredients } = await supabase
      .from('bar_recipe_ingredients')
      .select('recipe_id, ingredient_name')
      .in('recipe_id', recipeIds)
      .order('sort_order', { ascending: true })

    for (const ing of ingredients || []) {
      if (!ingredientMap[ing.recipe_id]) {
        ingredientMap[ing.recipe_id] = []
      }
      ingredientMap[ing.recipe_id].push(ing.ingredient_name)
    }
  }

  const barRecipes = (recipes || []).map(r => ({
    ...r,
    ingredients: ingredientMap[r.id] || [],
  }))

  return NextResponse.json({
    venue: {
      name: profile.business_name,
      business_type: profile.business_type,
      logo_url: profile.logo_url,
      slug: profile.venue_slug,
    },
    barRecipes,
  })
}
