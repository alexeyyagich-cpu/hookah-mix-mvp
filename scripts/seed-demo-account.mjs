#!/usr/bin/env node
/**
 * Seed a demo account with realistic data for testing/demos.
 * Usage: node scripts/seed-demo-account.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ── Config ──────────────────────────────────────────────
const DEMO_EMAIL = 'demo@hookahtorus.com'
const DEMO_PASSWORD = 'demo2026!'
const BUSINESS_NAME = 'Torus Demo Lounge'
const OWNER_NAME = 'Алексей Демо'

// ── Helpers ─────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function dateStr(daysAgoN) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgoN)
  return d.toISOString().split('T')[0]
}

// ── Main ────────────────────────────────────────────────
async function main() {
  console.log('🚀 Creating demo account...\n')

  // 1. Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find(u => u.email === DEMO_EMAIL)

  let userId
  if (existing) {
    console.log(`⚠️  User ${DEMO_EMAIL} already exists (${existing.id}). Cleaning up old data...`)
    userId = existing.id

    // Delete old data in correct order (foreign keys)
    await supabase.from('session_items').delete().eq('session_id',
      supabase.from('sessions').select('id').eq('profile_id', userId))
    // Simpler: delete by profile
    const { data: sessions } = await supabase.from('sessions').select('id').eq('profile_id', userId)
    if (sessions?.length) {
      for (const s of sessions) {
        await supabase.from('session_items').delete().eq('session_id', s.id)
      }
    }
    await supabase.from('inventory_transactions').delete().eq('profile_id', userId)
    await supabase.from('sessions').delete().eq('profile_id', userId)
    await supabase.from('saved_mixes').delete().eq('profile_id', userId)
    await supabase.from('tobacco_inventory').delete().eq('profile_id', userId)
    await supabase.from('bowl_types').delete().eq('profile_id', userId)
    await supabase.from('guests').delete().eq('profile_id', userId)
    await supabase.from('reviews').delete().eq('profile_id', userId)
    await supabase.from('notification_settings').delete().eq('profile_id', userId)

    // Update password
    await supabase.auth.admin.updateUserById(userId, { password: DEMO_PASSWORD })
    console.log('  ✅ Old data cleaned, password reset\n')
  } else {
    // Create user
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        business_name: BUSINESS_NAME,
        owner_name: OWNER_NAME,
      },
    })
    if (error) {
      console.error('❌ Failed to create user:', error.message)
      process.exit(1)
    }
    userId = data.user.id
    console.log(`✅ User created: ${userId}\n`)
  }

  // 2. Update profile — mark onboarding complete, set business info
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      business_name: BUSINESS_NAME,
      owner_name: OWNER_NAME,
      phone: '+7 999 123-45-67',
      address: 'ул. Арбат 24, Москва',
      subscription_tier: 'free',
      role: 'owner',
      onboarding_completed: true,
      onboarding_skipped: false,
      onboarding_step: 'complete',
    })
    .eq('id', userId)

  if (profileError) {
    console.error('❌ Failed to update profile:', profileError.message)
    // Profile might not exist yet (trigger delay), retry once
    await new Promise(r => setTimeout(r, 2000))
    const { error: retry } = await supabase.from('profiles').update({
      business_name: BUSINESS_NAME, owner_name: OWNER_NAME,
      phone: '+7 999 123-45-67', address: 'ул. Арбат 24, Москва',
      subscription_tier: 'free', role: 'owner',
      onboarding_completed: true, onboarding_skipped: false, onboarding_step: 'complete',
    }).eq('id', userId)
    if (retry) { console.error('❌ Profile update retry failed:', retry.message); process.exit(1) }
  }
  console.log('✅ Profile updated\n')

  // 3. Bowl types
  const bowls = [
    { id: randomUUID(), profile_id: userId, name: 'Oblako Mono M', capacity_grams: 18, is_default: true },
    { id: randomUUID(), profile_id: userId, name: 'UPG Standard', capacity_grams: 18, is_default: false },
    { id: randomUUID(), profile_id: userId, name: 'Cosmo Bowl Uranus', capacity_grams: 16, is_default: false },
  ]
  const { error: bowlErr } = await supabase.from('bowl_types').insert(bowls)
  if (bowlErr) console.error('❌ Bowl types:', bowlErr.message)
  else console.log(`✅ ${bowls.length} bowl types added`)

  // 4. Tobacco inventory — 15 items from different brands
  const inventory = [
    // Musthave
    { tobacco_id: 'mh1',  brand: 'Musthave', flavor: 'Pinkman',          quantity_grams: 180, purchase_price: 950,  package_grams: 250, purchase_date: dateStr(20) },
    { tobacco_id: 'mh5',  brand: 'Musthave', flavor: 'Lemon',            quantity_grams: 120, purchase_price: 950,  package_grams: 250, purchase_date: dateStr(15) },
    { tobacco_id: 'mh14', brand: 'Musthave', flavor: 'Honey Holls',      quantity_grams: 60,  purchase_price: 400,  package_grams: 125, purchase_date: dateStr(10) },
    { tobacco_id: 'mh3',  brand: 'Musthave', flavor: 'Cookie',           quantity_grams: 200, purchase_price: 950,  package_grams: 250, purchase_date: dateStr(5) },
    // Darkside
    { tobacco_id: 'ds1',  brand: 'Darkside', flavor: 'Supernova',        quantity_grams: 150, purchase_price: 850,  package_grams: 250, purchase_date: dateStr(18) },
    { tobacco_id: 'ds2',  brand: 'Darkside', flavor: 'Bananapapa',       quantity_grams: 90,  purchase_price: 850,  package_grams: 250, purchase_date: dateStr(12) },
    { tobacco_id: 'ds5',  brand: 'Darkside', flavor: 'Wild Forest',      quantity_grams: 75,  purchase_price: 850,  package_grams: 250, purchase_date: dateStr(8) },
    { tobacco_id: 'ds13', brand: 'Darkside', flavor: 'Generis Raspberry', quantity_grams: 220, purchase_price: 850,  package_grams: 250, purchase_date: dateStr(3) },
    // Tangiers
    { tobacco_id: 'tg1',  brand: 'Tangiers', flavor: 'Cane Mint',        quantity_grams: 100, purchase_price: 1200, package_grams: 250, purchase_date: dateStr(25) },
    { tobacco_id: 'tg3',  brand: 'Tangiers', flavor: 'Kashmir Peach',    quantity_grams: 40,  purchase_price: 1200, package_grams: 250, purchase_date: dateStr(22) },
    // Black Burn
    { tobacco_id: 'bb1',  brand: 'Black Burn', flavor: 'Overdose',       quantity_grams: 160, purchase_price: 700,  package_grams: 200, purchase_date: dateStr(14) },
    { tobacco_id: 'bb5',  brand: 'Black Burn', flavor: 'Ice Baby',       quantity_grams: 130, purchase_price: 700,  package_grams: 200, purchase_date: dateStr(7) },
    // Fumari
    { tobacco_id: 'fm1',  brand: 'Fumari', flavor: 'Blueberry Muffin',   quantity_grams: 95,  purchase_price: 600,  package_grams: 100, purchase_date: dateStr(11) },
    // Al Fakher
    { tobacco_id: 'af1',  brand: 'Al Fakher', flavor: 'Double Apple',    quantity_grams: 300, purchase_price: 500,  package_grams: 250, purchase_date: dateStr(30) },
    { tobacco_id: 'af3',  brand: 'Al Fakher', flavor: 'Grape',           quantity_grams: 200, purchase_price: 500,  package_grams: 250, purchase_date: dateStr(28) },
  ].map(item => ({
    id: randomUUID(),
    profile_id: userId,
    ...item,
  }))

  const { error: invErr } = await supabase.from('tobacco_inventory').insert(inventory)
  if (invErr) console.error('❌ Inventory:', invErr.message)
  else console.log(`✅ ${inventory.length} inventory items added`)

  // 5. Sessions — 8 sessions over the last 2 weeks
  const sessionData = [
    { daysAgo: 1,  totalGrams: 18, score: 92, rating: 5, duration: 55, bowl: bowls[0].id,
      items: [
        { tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams: 9, pct: 50 },
        { tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams: 5, pct: 28 },
        { tobacco_id: 'mh5', brand: 'Musthave', flavor: 'Lemon', grams: 4, pct: 22 },
      ]},
    { daysAgo: 2,  totalGrams: 18, score: 88, rating: 4, duration: 50, bowl: bowls[0].id,
      items: [
        { tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', grams: 9, pct: 50 },
        { tobacco_id: 'ds5', brand: 'Darkside', flavor: 'Wild Forest', grams: 5, pct: 28 },
        { tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams: 4, pct: 22 },
      ]},
    { daysAgo: 4,  totalGrams: 18, score: 85, rating: 4, duration: 45, bowl: bowls[1].id,
      items: [
        { tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams: 10, pct: 56 },
        { tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams: 8, pct: 44 },
      ]},
    { daysAgo: 6,  totalGrams: 16, score: 78, rating: 3, duration: 40, bowl: bowls[2].id,
      items: [
        { tobacco_id: 'af1', brand: 'Al Fakher', flavor: 'Double Apple', grams: 8, pct: 50 },
        { tobacco_id: 'af3', brand: 'Al Fakher', flavor: 'Grape', grams: 8, pct: 50 },
      ]},
    { daysAgo: 8,  totalGrams: 18, score: 95, rating: 5, duration: 60, bowl: bowls[0].id,
      items: [
        { tobacco_id: 'ds13', brand: 'Darkside', flavor: 'Generis Raspberry', grams: 7, pct: 39 },
        { tobacco_id: 'mh14', brand: 'Musthave', flavor: 'Honey Holls', grams: 6, pct: 33 },
        { tobacco_id: 'mh5', brand: 'Musthave', flavor: 'Lemon', grams: 5, pct: 28 },
      ]},
    { daysAgo: 10, totalGrams: 18, score: 82, rating: 4, duration: 50, bowl: bowls[0].id,
      items: [
        { tobacco_id: 'bb1', brand: 'Black Burn', flavor: 'Overdose', grams: 9, pct: 50 },
        { tobacco_id: 'bb5', brand: 'Black Burn', flavor: 'Ice Baby', grams: 9, pct: 50 },
      ]},
    { daysAgo: 12, totalGrams: 16, score: 90, rating: 5, duration: 55, bowl: bowls[2].id,
      items: [
        { tobacco_id: 'mh3', brand: 'Musthave', flavor: 'Cookie', grams: 8, pct: 50 },
        { tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', grams: 5, pct: 31 },
        { tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams: 3, pct: 19 },
      ]},
    { daysAgo: 14, totalGrams: 18, score: 75, rating: 3, duration: 35, bowl: bowls[1].id,
      items: [
        { tobacco_id: 'fm1', brand: 'Fumari', flavor: 'Blueberry Muffin', grams: 18, pct: 100 },
      ]},
  ]

  for (const s of sessionData) {
    const sessionId = randomUUID()
    const { error: sErr } = await supabase.from('sessions').insert({
      id: sessionId,
      profile_id: userId,
      bowl_type_id: s.bowl,
      session_date: dateStr(s.daysAgo),
      total_grams: s.totalGrams,
      compatibility_score: s.score,
      rating: s.rating,
      duration_minutes: s.duration,
      notes: null,
    })
    if (sErr) { console.error(`❌ Session (${s.daysAgo}d ago):`, sErr.message); continue }

    const items = s.items.map(it => ({
      id: randomUUID(),
      session_id: sessionId,
      tobacco_inventory_id: inventory.find(inv => inv.tobacco_id === it.tobacco_id)?.id || null,
      tobacco_id: it.tobacco_id,
      brand: it.brand,
      flavor: it.flavor,
      grams_used: it.grams,
      percentage: it.pct,
    }))
    const { error: siErr } = await supabase.from('session_items').insert(items)
    if (siErr) console.error(`  ❌ Session items:`, siErr.message)
  }
  console.log(`✅ ${sessionData.length} sessions with items added`)

  // 6. Saved mixes — 4 favorites
  const savedMixes = [
    {
      name: 'Розовая мята',
      tobaccos: [
        { tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', percent: 50, color: '#EC4899' },
        { tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', percent: 28, color: '#06B6D4' },
        { tobacco_id: 'mh5', brand: 'Musthave', flavor: 'Lemon', percent: 22, color: '#FCD34D' },
      ],
      compatibility_score: 92, is_favorite: true, usage_count: 5, rating: 5,
      notes: 'Легкий ягодный с мятным послевкусием. Идеально на вечер.',
    },
    {
      name: 'Тропический банан',
      tobaccos: [
        { tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', percent: 50, color: '#FACC15' },
        { tobacco_id: 'ds5', brand: 'Darkside', flavor: 'Wild Forest', percent: 28, color: '#EF4444' },
        { tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', percent: 22, color: '#06B6D4' },
      ],
      compatibility_score: 88, is_favorite: true, usage_count: 3, rating: 4,
      notes: 'Фруктовый микс, заходит всем.',
    },
    {
      name: 'Печенье с бананом',
      tobaccos: [
        { tobacco_id: 'mh3', brand: 'Musthave', flavor: 'Cookie', percent: 50, color: '#D97706' },
        { tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', percent: 31, color: '#FACC15' },
        { tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', percent: 19, color: '#06B6D4' },
      ],
      compatibility_score: 90, is_favorite: false, usage_count: 2, rating: 5,
      notes: 'Десертный — для любителей сладкого.',
    },
    {
      name: 'Малина-лимон',
      tobaccos: [
        { tobacco_id: 'ds13', brand: 'Darkside', flavor: 'Generis Raspberry', percent: 39, color: '#EC4899' },
        { tobacco_id: 'mh14', brand: 'Musthave', flavor: 'Honey Holls', percent: 33, color: '#10B981' },
        { tobacco_id: 'mh5', brand: 'Musthave', flavor: 'Lemon', percent: 28, color: '#FCD34D' },
      ],
      compatibility_score: 95, is_favorite: true, usage_count: 4, rating: 5,
      notes: 'Ягодная свежесть. Хит сезона!',
    },
  ]

  const { error: mixErr } = await supabase.from('saved_mixes').insert(
    savedMixes.map(m => ({
      id: randomUUID(),
      profile_id: userId,
      ...m,
    }))
  )
  if (mixErr) console.error('❌ Saved mixes:', mixErr.message)
  else console.log(`✅ ${savedMixes.length} saved mixes added`)

  // 7. Guests — 5 guests with preferences
  const guests = [
    {
      name: 'Иван Петров',
      phone: '+7 916 111-22-33',
      strength_preference: 'medium',
      flavor_profiles: ['fruity', 'fresh'],
      visit_count: 8,
      last_visit_at: daysAgo(1),
      notes: 'Постоянный гость. Любит фруктовые миксы.',
      bonus_balance: 15,
      discount_percent: 5,
      total_spent: 320,
      loyalty_tier: 'silver',
    },
    {
      name: 'Мария Сидорова',
      phone: '+7 926 444-55-66',
      strength_preference: 'light',
      flavor_profiles: ['sweet', 'fruity'],
      visit_count: 5,
      last_visit_at: daysAgo(4),
      notes: 'Предпочитает лёгкие сладкие миксы.',
      bonus_balance: 5,
      discount_percent: 0,
      total_spent: 150,
      loyalty_tier: 'bronze',
    },
    {
      name: 'Дмитрий Козлов',
      phone: '+7 903 777-88-99',
      strength_preference: 'strong',
      flavor_profiles: ['fresh', 'spicy'],
      visit_count: 12,
      last_visit_at: daysAgo(2),
      notes: 'Опытный курильщик. Любит крепкие миксы с мятой.',
      bonus_balance: 40,
      discount_percent: 10,
      total_spent: 680,
      loyalty_tier: 'gold',
    },
    {
      name: 'Анна Волкова',
      phone: null,
      strength_preference: 'medium',
      flavor_profiles: ['citrus', 'fresh'],
      visit_count: 3,
      last_visit_at: daysAgo(8),
      notes: null,
      bonus_balance: 0,
      discount_percent: 0,
      total_spent: 45,
      loyalty_tier: 'bronze',
    },
    {
      name: 'Сергей Морозов',
      phone: '+7 985 000-11-22',
      strength_preference: 'strong',
      flavor_profiles: ['fruity', 'soda'],
      visit_count: 6,
      last_visit_at: daysAgo(6),
      notes: 'Часто приходит с компанией 3-4 человека.',
      bonus_balance: 10,
      discount_percent: 5,
      total_spent: 250,
      loyalty_tier: 'silver',
    },
  ]

  const { error: guestErr } = await supabase.from('guests').insert(
    guests.map(g => ({
      id: randomUUID(),
      profile_id: userId,
      ...g,
    }))
  )
  if (guestErr) console.error('❌ Guests:', guestErr.message)
  else console.log(`✅ ${guests.length} guests added`)

  // 8. Reviews — 4 reviews
  const reviews = [
    { author_name: 'Иван П.', rating: 5, text: 'Лучшая кальянная в районе! Миксы огонь 🔥', is_published: true },
    { author_name: 'Мария С.', rating: 5, text: 'Уютная атмосфера и отличный сервис. Рекомендую!', is_published: true },
    { author_name: 'Дмитрий К.', rating: 4, text: 'Хороший табак и чаши. Приду ещё.', is_published: true },
    { author_name: 'Олег В.', rating: 3, text: 'Нормально, но бывало и лучше.', is_published: false },
  ]

  const { error: revErr } = await supabase.from('reviews').insert(
    reviews.map(r => ({
      id: randomUUID(),
      profile_id: userId,
      ...r,
    }))
  )
  if (revErr) console.error('❌ Reviews:', revErr.message)
  else console.log(`✅ ${reviews.length} reviews added`)

  // ── Done ──────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50))
  console.log('✅ Demo account ready!\n')
  console.log(`  📧 Email:    ${DEMO_EMAIL}`)
  console.log(`  🔑 Password: ${DEMO_PASSWORD}`)
  console.log(`  🏢 Business: ${BUSINESS_NAME}`)
  console.log(`  👤 Owner:    ${OWNER_NAME}`)
  console.log(`  🆔 User ID:  ${userId}`)
  console.log('\n  Data seeded:')
  console.log(`    • ${bowls.length} bowl types`)
  console.log(`    • ${inventory.length} inventory items`)
  console.log(`    • ${sessionData.length} sessions`)
  console.log(`    • ${savedMixes.length} saved mixes`)
  console.log(`    • ${guests.length} guests`)
  console.log(`    • ${reviews.length} reviews`)
  console.log('\n  Login at: https://hookahtorus.com/login')
  console.log('═'.repeat(50))
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
