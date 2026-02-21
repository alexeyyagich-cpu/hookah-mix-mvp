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
 * On partial failure, progress is persisted. Retry resumes from last checkpoint.
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
      idMap.set(tempSessionId as string, sessionId!)
    }

    // Checkpoint: session created
    await updateMutationMeta(entryId, { _sessionId: sessionId })
  }

  // --- Step 2: Insert session items ---
  if (!meta._itemsInserted) {
    const items = (meta.items as Record<string, unknown>[]) || []
    if (items.length > 0) {
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

    // Transaction-first: insert transaction, then recalculate grams
    // Idempotency: check if this session's deduction already exists
    const { data: existingTx } = await supabase
      .from('inventory_transactions')
      .select('id')
      .eq('tobacco_inventory_id', tobaccoInventoryId)
      .eq('session_id', sessionId!)
      .eq('type', 'session')
      .limit(1)

    if (!existingTx?.length) {
      // Insert transaction first (source of truth)
      const { error: txError } = await supabase.from('inventory_transactions').insert({
        profile_id: entry.userId,
        tobacco_inventory_id: tobaccoInventoryId,
        type: 'session',
        quantity_grams: -(adj.grams_used as number),
        session_id: sessionId,
        notes: `Session: ${adj.brand} ${adj.flavor}`,
        ...(adj.organizationId ? { organization_id: adj.organizationId, location_id: adj.locationId } : {}),
      })
      if (txError) throw new Error(txError.message)
    }

    // Recalculate grams from current value + delta (safe even on retry)
    const { data: inv } = await supabase
      .from('tobacco_inventory')
      .select('quantity_grams')
      .eq('id', tobaccoInventoryId)
      .single()

    if (inv && !existingTx?.length) {
      await supabase
        .from('tobacco_inventory')
        .update({
          quantity_grams: Math.max(0, inv.quantity_grams - (adj.grams_used as number)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', tobaccoInventoryId)
    }

    // Checkpoint: this adjustment done
    await updateMutationMeta(entryId, { [adjKey]: true })
  }
}

/**
 * Inventory adjustment compound — transaction-first with idempotency:
 *   1. Check if transaction with same idempotencyKey already exists
 *   2. Insert transaction (source of truth)
 *   3. Recalculate grams from current value + delta
 */
async function syncInventoryAdjustment(
  supabase: SupabaseClient,
  entry: SyncQueueEntry
): Promise<void> {
  const meta = entry.meta || {}
  const inventoryId = meta.inventoryId as string
  const delta = meta.delta as number
  const transactionData = meta.transactionData as Record<string, unknown>
  const orgId = meta.organizationId as string | undefined
  const idempotencyKey = entry.idempotencyKey || ''

  // Step 1: Check for existing transaction (idempotency via notes suffix)
  const idempotencyTag = `[idem:${idempotencyKey}]`
  let alreadyProcessed = false

  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('inventory_transactions')
      .select('id')
      .eq('tobacco_inventory_id', inventoryId)
      .like('notes', `%${idempotencyTag}%`)
      .limit(1)

    alreadyProcessed = !!(existing?.length)
  }

  if (!alreadyProcessed && transactionData) {
    // Step 2: Insert transaction first (source of truth)
    const txNotes = transactionData.notes
      ? `${transactionData.notes} ${idempotencyTag}`
      : idempotencyTag

    const { error: txError } = await supabase.from('inventory_transactions').insert({
      ...transactionData,
      profile_id: entry.userId,
      notes: txNotes,
    })
    if (txError) throw new Error(txError.message)

    // Step 3: Update grams (only if transaction was newly inserted)
    const { data: inv } = await supabase
      .from('tobacco_inventory')
      .select('quantity_grams')
      .eq('id', inventoryId)
      .single()

    if (inv) {
      const newQuantity = Math.max(0, inv.quantity_grams + delta)
      const { error: updateError } = await supabase
        .from('tobacco_inventory')
        .update({ quantity_grams: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', inventoryId)
        .eq(
          orgId ? 'organization_id' : 'profile_id',
          orgId || entry.userId,
        )

      if (updateError) throw new Error(updateError.message)
    }
  }
}
