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
    // Try finding by lounge_profiles slug as fallback
    const { data: loungeBySlug } = await supabase
      .from('lounge_profiles')
      .select('id, profile_id, slug, name, description, logo_url, cover_image_url, city, address, latitude, longitude, phone, email, website, instagram, telegram, working_hours, features, is_published, show_menu, show_prices, show_popular_mixes, rating, reviews_count, created_at, updated_at, profiles!lounge_profiles_profile_id_fkey(id, business_name, business_type, logo_url, venue_slug)')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()

    if (!loungeBySlug) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    // Use the lounge profile's owner for data lookups
    const ownerProfile = (loungeBySlug as Record<string, unknown>).profiles as { id: string; business_name: string; business_type: string; logo_url: string | null; venue_slug: string | null } | null
    if (!ownerProfile) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    // Fetch bar recipes, tobacco, tables for this owner
    const [recipesRes, tobaccosRes, tablesRes] = await Promise.all([
      supabase.from('bar_recipes')
        .select('id, name, name_en, description, method, glass, garnish_description, menu_price')
        .eq('profile_id', ownerProfile.id).eq('is_on_menu', true).order('name'),
      supabase.from('tobacco_inventory')
        .select('brand, flavor, quantity_grams')
        .eq('profile_id', ownerProfile.id).gt('quantity_grams', 0).order('brand'),
      supabase.from('floor_tables')
        .select('id, name')
        .eq('profile_id', ownerProfile.id).order('name'),
    ])

    const rIds = (recipesRes.data || []).map(r => r.id)
    let iMap: Record<string, string[]> = {}
    if (rIds.length > 0) {
      const { data: ings } = await supabase
        .from('bar_recipe_ingredients').select('recipe_id, ingredient_name')
        .in('recipe_id', rIds).order('sort_order')
      for (const ing of ings || []) {
        if (!iMap[ing.recipe_id]) iMap[ing.recipe_id] = []
        iMap[ing.recipe_id].push(ing.ingredient_name)
      }
    }

    const tMap: Record<string, string[]> = {}
    for (const t of tobaccosRes.data || []) {
      if (!tMap[t.brand]) tMap[t.brand] = []
      if (!tMap[t.brand].includes(t.flavor)) tMap[t.brand].push(t.flavor)
    }

    return NextResponse.json({
      venue: {
        name: ownerProfile.business_name,
        business_type: ownerProfile.business_type,
        logo_url: ownerProfile.logo_url,
        slug: ownerProfile.venue_slug,
      },
      loungeProfile: loungeBySlug,
      barRecipes: (recipesRes.data || []).map(r => ({ ...r, ingredients: iMap[r.id] || [] })),
      tobaccoMenu: Object.entries(tMap).map(([brand, flavors]) => ({ brand, flavors: flavors.sort() })),
      tables: tablesRes.data || [],
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
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

  // Fetch tobacco inventory (brand + flavor for public menu)
  const { data: tobaccos } = await supabase
    .from('tobacco_inventory')
    .select('brand, flavor, quantity_grams')
    .eq('profile_id', profile.id)
    .gt('quantity_grams', 0)
    .order('brand', { ascending: true })

  // Group tobaccos by brand
  const tobaccoMap: Record<string, string[]> = {}
  for (const t of tobaccos || []) {
    if (!tobaccoMap[t.brand]) tobaccoMap[t.brand] = []
    if (!tobaccoMap[t.brand].includes(t.flavor)) {
      tobaccoMap[t.brand].push(t.flavor)
    }
  }
  const tobaccoMenu = Object.entries(tobaccoMap).map(([brand, flavors]) => ({
    brand,
    flavors: flavors.sort(),
  }))

  // Fetch floor tables for QR ordering
  const { data: tables } = await supabase
    .from('floor_tables')
    .select('id, name')
    .eq('profile_id', profile.id)
    .order('name', { ascending: true })

  // Fetch lounge profile if exists
  const { data: loungeProfile } = await supabase
    .from('lounge_profiles')
    .select('id, profile_id, slug, name, description, logo_url, cover_image_url, city, address, latitude, longitude, phone, email, website, instagram, telegram, working_hours, features, is_published, show_menu, show_prices, show_popular_mixes, rating, reviews_count, created_at, updated_at')
    .eq('profile_id', profile.id)
    .eq('is_published', true)
    .maybeSingle()

  return NextResponse.json({
    venue: {
      name: profile.business_name,
      business_type: profile.business_type,
      logo_url: profile.logo_url,
      slug: profile.venue_slug,
    },
    loungeProfile: loungeProfile || null,
    barRecipes,
    tobaccoMenu,
    tables: tables || [],
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
