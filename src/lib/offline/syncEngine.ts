import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getPendingMutations,
  updateMutationStatus,
  updateMutationMeta,
  removeMutation,
  type SyncQueueEntry,
} from './db'

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
        console.warn(`[sync] Permanently failed after ${MAX_RETRIES} retries:`, entry.table, entry.operation, errorMsg)
      } else {
        await updateMutationStatus(entry.id, 'pending', errorMsg)
      }
      failed++
    }
  }

  console.log(`[sync] Complete: ${synced} synced, ${failed} failed`)
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
// Compound mutations — resumable multi-step operations
// Each step saves progress to entry.meta so retries skip completed steps.
// ---------------------------------------------------------------------------

async function executeCompoundMutation(
  supabase: SupabaseClient,
  entry: SyncQueueEntry
): Promise<void> {
  const { table } = entry

  if (table === 'sessions') {
    await syncSessionCompound(supabase, entry)
    return
  }

  if (table === 'tobacco_inventory') {
    await syncInventoryAdjustment(supabase, entry)
    return
  }

  throw new Error(`Unknown compound mutation table: ${table}`)
}

/**
 * Session compound — resumable:
 *   Step 1: insert session (skip if meta._sessionId exists)
 *   Step 2: insert session_items (skip if meta._itemsInserted)
 *   Step 3: per-item inventory adjustments (skip already-done via meta._adj_N)
 *
 * Idempotency:
 *   - Session insert: no natural key, but checkpoint prevents re-insert
 *   - Items insert: checked via SELECT count before inserting
 *   - Inventory adj: UNIQUE(tobacco_inventory_id, session_id, type) prevents duplicates
 *   - Grams update: atomic RPC (decrement_tobacco_inventory) — safe for concurrent access
 */
async function syncSessionCompound(
  supabase: SupabaseClient,
  entry: SyncQueueEntry
): Promise<void> {
  const meta = entry.meta || {}
  const payload = resolvePayloadIds(entry.payload)
  const entryId = entry.id!

  // --- Step 1: Insert session ---
  let sessionId = meta._sessionId as string | undefined

  if (!sessionId) {
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

    sessionId = session.id as string

    // Track temp → real ID
    if (tempSessionId && typeof tempSessionId === 'string' && (tempSessionId as string).startsWith('offline-')) {
      idMap.set(tempSessionId as string, sessionId)
    }

    // Checkpoint: session created
    await updateMutationMeta(entryId, { _sessionId: sessionId })
  }

  // --- Step 2: Insert session items (with idempotency check) ---
  if (!meta._itemsInserted) {
    const items = (meta.items as Record<string, unknown>[]) || []
    if (items.length > 0) {
      // Idempotency: check if items already exist for this session (partial success + retry)
      const { count } = await supabase
        .from('session_items')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', sessionId)

      if (!count || count === 0) {
        const sessionItems = items.map(item => {
          const resolved: Record<string, unknown> = { ...item, session_id: sessionId }
          if (typeof resolved.id === 'string' && (resolved.id as string).startsWith('offline-')) {
            delete resolved.id
          }
          return resolved
        })

        const { error: itemsError } = await supabase.from('session_items').insert(sessionItems)
        if (itemsError) throw new Error(itemsError.message)
      }
    }

    // Checkpoint: items inserted
    await updateMutationMeta(entryId, { _itemsInserted: true })
  }

  // --- Step 3: Inventory adjustments (per-item checkpoint) ---
  const adjustments = (meta.inventoryAdjustments as Record<string, unknown>[]) || []
  for (let i = 0; i < adjustments.length; i++) {
    const adjKey = `_adj_${i}`
    if (meta[adjKey]) continue // already processed

    const adj = adjustments[i]
    const tobaccoInventoryId = adj.tobacco_inventory_id as string
    if (!tobaccoInventoryId) {
      await updateMutationMeta(entryId, { [adjKey]: true })
      continue
    }

    // Insert transaction — UNIQUE(tobacco_inventory_id, session_id, type) prevents duplicates
    let txAlreadyExists = false
    const { error: txError } = await supabase.from('inventory_transactions').insert({
      profile_id: entry.userId,
      tobacco_inventory_id: tobaccoInventoryId,
      type: 'session',
      quantity_grams: -(adj.grams_used as number),
      session_id: sessionId,
      notes: `Session: ${adj.brand} ${adj.flavor}`,
      ...(adj.organizationId ? { organization_id: adj.organizationId, location_id: adj.locationId } : {}),
    })
    if (txError) {
      // Unique constraint violation = already processed, skip grams decrement
      if (txError.code === '23505' || txError.message.includes('duplicate key') || txError.message.includes('unique constraint')) {
        txAlreadyExists = true
      } else {
        throw new Error(txError.message)
      }
    }

    // Atomic grams decrement via RPC — only if transaction was newly inserted
    if (!txAlreadyExists) {
      const { error: rpcError } = await supabase.rpc('decrement_tobacco_inventory', {
        p_inventory_id: tobaccoInventoryId,
        p_grams_used: adj.grams_used as number,
      })
      if (rpcError) throw new Error(rpcError.message)
    }

    // Checkpoint: this adjustment done
    await updateMutationMeta(entryId, { [adjKey]: true })
  }
}

/**
 * Inventory adjustment compound — transaction-first with idempotency:
 *   1. INSERT transaction with idempotency_key (UNIQUE constraint prevents duplicates)
 *   2. Atomic RPC to adjust grams
 *
 * The UNIQUE index on idempotency_key ensures at-most-once transaction insert.
 * The atomic RPC ensures no read-then-write race on quantity_grams.
 */
async function syncInventoryAdjustment(
  supabase: SupabaseClient,
  entry: SyncQueueEntry
): Promise<void> {
  const meta = entry.meta || {}
  const inventoryId = meta.inventoryId as string
  const delta = meta.delta as number
  const transactionData = meta.transactionData as Record<string, unknown>
  const idempotencyKey = entry.idempotencyKey || ''

  if (!transactionData || !inventoryId) return

  // Step 1: Insert transaction with idempotency_key
  // UNIQUE index on idempotency_key prevents duplicates atomically
  let alreadyProcessed = false

  if (idempotencyKey) {
    const { error: txError } = await supabase.from('inventory_transactions').insert({
      ...transactionData,
      profile_id: entry.userId,
      idempotency_key: idempotencyKey,
    })

    if (txError) {
      // Check if it's a unique constraint violation (already processed)
      if (txError.code === '23505' || txError.message.includes('duplicate key') || txError.message.includes('unique constraint')) {
        alreadyProcessed = true
      } else {
        throw new Error(txError.message)
      }
    }
  } else {
    // No idempotency key — insert without protection (legacy path)
    const { error: txError } = await supabase.from('inventory_transactions').insert({
      ...transactionData,
      profile_id: entry.userId,
    })
    if (txError) throw new Error(txError.message)
  }

  // Step 2: Atomic grams adjustment via RPC (only if transaction was newly inserted)
  if (!alreadyProcessed) {
    if (delta < 0) {
      // Deduction — use decrement RPC
      const { error: rpcError } = await supabase.rpc('decrement_tobacco_inventory', {
        p_inventory_id: inventoryId,
        p_grams_used: Math.abs(delta),
      })
      if (rpcError) throw new Error(rpcError.message)
    } else {
      // Addition (purchase, adjustment +) — use increment RPC or direct atomic update
      const { error: updateError } = await supabase.rpc('decrement_tobacco_inventory', {
        p_inventory_id: inventoryId,
        p_grams_used: -delta, // negative grams_used = increment
      })
      if (updateError) throw new Error(updateError.message)
    }
  }
}
