import type { SupabaseClient } from '@supabase/supabase-js'
import { getPendingMutations, updateMutationStatus, removeMutation, type SyncQueueEntry } from './db'

const MAX_RETRIES = 3

// Maps temp offline IDs → real server IDs within a single sync batch
let idMap: Map<string, string>

export async function processSyncQueue(
  supabase: SupabaseClient
): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingMutations()
  let synced = 0
  let failed = 0
  idMap = new Map()

  for (const entry of pending) {
    if (!entry.id) continue

    await updateMutationStatus(entry.id, 'syncing')

    try {
      await executeMutation(supabase, entry)
      await removeMutation(entry.id)
      synced++
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'

      if (entry.retryCount + 1 >= MAX_RETRIES) {
        await updateMutationStatus(entry.id, 'failed', errorMsg)
        console.warn(`Sync: permanently failed after ${MAX_RETRIES} retries:`, entry)
      } else {
        await updateMutationStatus(entry.id, 'pending', errorMsg)
      }
      failed++
    }
  }

  return { synced, failed }
}

/** Resolve a single value if it's a temp offline ID that's been synced */
function resolveId(value: unknown): unknown {
  if (typeof value === 'string' && value.startsWith('offline-') && idMap.has(value)) {
    return idMap.get(value)!
  }
  return value
}

/** Replace any temp offline IDs in a payload object with real server IDs */
function resolvePayloadIds(payload: Record<string, unknown>): Record<string, unknown> {
  const resolved = { ...payload }
  for (const [key, value] of Object.entries(resolved)) {
    resolved[key] = resolveId(value)
  }
  return resolved
}

async function executeMutation(
  supabase: SupabaseClient,
  entry: SyncQueueEntry
): Promise<void> {
  const { table, operation, matchColumn = 'id' } = entry
  const payload = resolvePayloadIds(entry.payload)

  switch (operation) {
    case 'insert': {
      const tempId = entry.payload.id
      const insertData = { ...payload }
      if (typeof insertData.id === 'string' && (insertData.id as string).startsWith('offline-')) {
        delete insertData.id
      }
      const { data, error } = await supabase.from(table).insert(insertData).select('id').single()
      if (error) throw new Error(error.message)
      // Track temp → real ID
      if (data?.id && tempId && typeof tempId === 'string' && tempId.startsWith('offline-')) {
        idMap.set(tempId, data.id)
      }
      break
    }

    case 'update': {
      const matchValue = resolveId(payload[matchColumn])
      if (!matchValue) throw new Error(`Missing match column: ${matchColumn}`)
      const updateData = { ...payload }
      delete updateData[matchColumn]
      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq(matchColumn, matchValue as string)
      if (error) throw new Error(error.message)
      break
    }

    case 'delete': {
      const deleteValue = resolveId(payload[matchColumn])
      if (!deleteValue) throw new Error(`Missing match column: ${matchColumn}`)
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(matchColumn, deleteValue as string)
      if (error) throw new Error(error.message)
      break
    }

    case 'upsert': {
      const { error } = await supabase.from(table).upsert(payload)
      if (error) throw new Error(error.message)
      break
    }

    case 'compound': {
      await executeCompoundMutation(supabase, entry)
      break
    }
  }
}

// ---------------------------------------------------------------------------
// Compound mutations — multi-step operations replayed as a unit
// ---------------------------------------------------------------------------

async function executeCompoundMutation(
  supabase: SupabaseClient,
  entry: SyncQueueEntry
): Promise<void> {
  const { table, meta, userId } = entry
  const payload = resolvePayloadIds(entry.payload)

  if (table === 'sessions') {
    await syncSessionCompound(supabase, payload, meta || {}, userId)
    return
  }

  if (table === 'tobacco_inventory') {
    await syncInventoryAdjustment(supabase, meta || {}, userId)
    return
  }

  throw new Error(`Unknown compound mutation table: ${table}`)
}

/**
 * Session compound: insert session → insert session_items → deduct inventory
 */
async function syncSessionCompound(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
  meta: Record<string, unknown>,
  userId: string
): Promise<void> {
  // 1. Insert session
  const sessionData = { ...payload }
  const tempSessionId = sessionData.id
  if (typeof sessionData.id === 'string' && (sessionData.id as string).startsWith('offline-')) {
    delete sessionData.id
  }

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single()
  if (sessionError) throw new Error(sessionError.message)

  // Track temp → real ID
  if (tempSessionId && typeof tempSessionId === 'string' && (tempSessionId as string).startsWith('offline-')) {
    idMap.set(tempSessionId as string, session.id)
  }

  // 2. Insert session items
  const items = (meta.items as Record<string, unknown>[]) || []
  if (items.length > 0) {
    const sessionItems = items.map(item => {
      const resolved: Record<string, unknown> = { ...item, session_id: session.id }
      if (typeof resolved.id === 'string' && (resolved.id as string).startsWith('offline-')) {
        delete resolved.id
      }
      return resolved
    })

    const { error: itemsError } = await supabase.from('session_items').insert(sessionItems)
    if (itemsError) {
      // Rollback session
      await supabase.from('sessions').delete().eq('id', session.id)
      throw new Error(itemsError.message)
    }
  }

  // 3. Inventory adjustments
  const adjustments = (meta.inventoryAdjustments as Record<string, unknown>[]) || []
  for (const adj of adjustments) {
    const tobaccoInventoryId = adj.tobacco_inventory_id as string
    if (!tobaccoInventoryId) continue

    const { data: inv } = await supabase
      .from('tobacco_inventory')
      .select('quantity_grams')
      .eq('id', tobaccoInventoryId)
      .single()

    if (inv) {
      await supabase
        .from('tobacco_inventory')
        .update({
          quantity_grams: Math.max(0, inv.quantity_grams - (adj.grams_used as number)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', tobaccoInventoryId)

      await supabase.from('inventory_transactions').insert({
        profile_id: userId,
        tobacco_inventory_id: tobaccoInventoryId,
        type: 'session',
        quantity_grams: -(adj.grams_used as number),
        session_id: session.id,
        notes: `Session: ${adj.brand} ${adj.flavor}`,
        ...(adj.organizationId ? { organization_id: adj.organizationId, location_id: adj.locationId } : {}),
      })
    }
  }
}

/**
 * Inventory adjustment compound: read current → apply delta → insert transaction
 */
async function syncInventoryAdjustment(
  supabase: SupabaseClient,
  meta: Record<string, unknown>,
  userId: string
): Promise<void> {
  const inventoryId = meta.inventoryId as string
  const delta = meta.delta as number
  const transactionData = meta.transactionData as Record<string, unknown>
  const orgId = meta.organizationId as string | undefined

  const { data: inv } = await supabase
    .from('tobacco_inventory')
    .select('quantity_grams')
    .eq('id', inventoryId)
    .single()

  if (!inv) throw new Error('Inventory item not found')

  const newQuantity = Math.max(0, inv.quantity_grams + delta)
  const { error: updateError } = await supabase
    .from('tobacco_inventory')
    .update({ quantity_grams: newQuantity, updated_at: new Date().toISOString() })
    .eq('id', inventoryId)
    .eq(
      orgId ? 'organization_id' : 'profile_id',
      orgId || userId,
    )

  if (updateError) throw new Error(updateError.message)

  if (transactionData) {
    await supabase.from('inventory_transactions').insert({
      ...transactionData,
      profile_id: userId,
    })
  }
}
