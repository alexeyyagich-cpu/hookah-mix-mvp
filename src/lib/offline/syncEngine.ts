import type { SupabaseClient } from '@supabase/supabase-js'
import { getPendingMutations, updateMutationStatus, removeMutation, type SyncQueueEntry } from './db'

const MAX_RETRIES = 3

export async function processSyncQueue(
  supabase: SupabaseClient
): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingMutations()
  let synced = 0
  let failed = 0

  for (const entry of pending) {
    if (!entry.id) continue

    await updateMutationStatus(entry.id, 'syncing')

    try {
      await executeMutation(supabase, entry)
      await removeMutation(entry.id)
      synced++
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      await updateMutationStatus(entry.id, 'failed', errorMsg)

      // Remove permanently failed entries
      if (entry.retryCount + 1 >= MAX_RETRIES) {
        console.warn(`Sync: permanently failed after ${MAX_RETRIES} retries:`, entry)
      } else {
        // Reset to pending for retry
        await updateMutationStatus(entry.id, 'pending', errorMsg)
      }
      failed++
    }
  }

  return { synced, failed }
}

async function executeMutation(
  supabase: SupabaseClient,
  entry: SyncQueueEntry
): Promise<void> {
  const { table, operation, payload, matchColumn = 'id' } = entry

  switch (operation) {
    case 'insert': {
      // Remove temporary offline IDs
      const insertData = { ...payload }
      if (typeof insertData.id === 'string' && (insertData.id as string).startsWith('offline-')) {
        delete insertData.id
      }
      const { error } = await supabase.from(table).insert(insertData)
      if (error) throw new Error(error.message)
      break
    }

    case 'update': {
      const matchValue = payload[matchColumn]
      if (!matchValue) throw new Error(`Missing match column: ${matchColumn}`)
      const updateData = { ...payload }
      delete updateData[matchColumn]
      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq(matchColumn, matchValue)
      if (error) throw new Error(error.message)
      break
    }

    case 'delete': {
      const deleteValue = payload[matchColumn]
      if (!deleteValue) throw new Error(`Missing match column: ${matchColumn}`)
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(matchColumn, deleteValue)
      if (error) throw new Error(error.message)
      break
    }

    case 'upsert': {
      const { error } = await supabase.from(table).upsert(payload)
      if (error) throw new Error(error.message)
      break
    }
  }
}
