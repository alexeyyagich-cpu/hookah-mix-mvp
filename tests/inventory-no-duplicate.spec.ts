import { test, expect, type Page, type BrowserContext, type APIRequestContext } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const DEMO_EMAIL = 'demo@hookahtorus.com'
const DEMO_PASSWORD = 'demo2026!'
const SUPABASE_URL = 'https://famjbedwdbolzrbghimx.supabase.co'

// Known demo inventory item (Musthave Pinkman)
const TEST_INVENTORY_ID = '06b2a963-c2a6-443c-b574-db839929f938'

let accessToken: string
let userId: string

async function loginAsDemo(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await page.fill('input[type="email"]', DEMO_EMAIL)
  await page.fill('input[type="password"]', DEMO_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 15000 })
}

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbWpiZWR3ZGJvbHpyYmdoaW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MzQzNzMsImV4cCI6MjA4NjUxMDM3M30.sqw9H1OKCN3Hu8JzV6XJzvRGU6XNlt5ABO-cq_q_sCs'

async function supabaseLogin(request: APIRequestContext): Promise<{ accessToken: string; userId: string }> {
  const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: {
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
    },
    data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`Auth failed: ${JSON.stringify(data)}`)
  return { accessToken: data.access_token, userId: data.user.id }
}

function sbHeaders() {
  return {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

async function sbGet(request: APIRequestContext, path: string) {
  const res = await request.get(`${SUPABASE_URL}/rest/v1/${path}`, { headers: sbHeaders() })
  return res.json()
}

async function sbPost(request: APIRequestContext, path: string, data: unknown) {
  const res = await request.post(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { ...sbHeaders(), 'Prefer': 'return=representation' },
    data,
  })
  return { status: res.status(), data: await res.json() }
}

async function sbDelete(request: APIRequestContext, path: string) {
  await request.delete(`${SUPABASE_URL}/rest/v1/${path}`, { headers: sbHeaders() })
}

async function sbRpc(request: APIRequestContext, fn: string, args: unknown) {
  const res = await request.post(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    headers: sbHeaders(),
    data: args,
  })
  return { status: res.status(), data: await res.json() }
}

test.describe('Inventory Deduplication on Retry', () => {
  let context: BrowserContext
  let page: Page

  test.beforeAll(async ({ browser, request }) => {
    // Login to Supabase API for direct DB access
    const auth = await supabaseLogin(request)
    accessToken = auth.accessToken
    userId = auth.userId
    console.log('Logged in as:', userId)

    // Also login in browser for UI tests
    context = await browser.newContext()
    page = await context.newPage()
    await loginAsDemo(page)
  })

  test.afterAll(async () => {
    await context.close()
  })

  test('1. UNIQUE constraint blocks duplicate inventory_transaction', async ({ request }) => {
    // Step 1: Read current grams
    const invBefore = await sbGet(request, `tobacco_inventory?id=eq.${TEST_INVENTORY_ID}&select=quantity_grams`)
    const gramsBefore = invBefore[0].quantity_grams
    console.log('Grams before:', gramsBefore)

    // Step 2: Create a test session (FK target)
    const { data: sessData } = await sbPost(request, 'sessions', {
      profile_id: userId,
      total_grams: 10,
      session_date: new Date().toISOString(),
      notes: '__TEST_DEDUP_1__',
    })
    const testSessionId = sessData[0].id
    console.log('Test session:', testSessionId)

    // Step 3: First INSERT — should succeed (201)
    const { status: s1 } = await sbPost(request, 'inventory_transactions', {
      profile_id: userId,
      tobacco_inventory_id: TEST_INVENTORY_ID,
      type: 'session',
      quantity_grams: -5,
      session_id: testSessionId,
      notes: '__TEST_DEDUP_1__ first',
    })
    console.log('First insert status:', s1)
    expect(s1).toBe(201)

    // Step 4: Second INSERT with same (tobacco_inventory_id, session_id, type)
    // Should FAIL with 409 (unique constraint violation)
    const { status: s2, data: d2 } = await sbPost(request, 'inventory_transactions', {
      profile_id: userId,
      tobacco_inventory_id: TEST_INVENTORY_ID,
      type: 'session',
      quantity_grams: -5,
      session_id: testSessionId,
      notes: '__TEST_DEDUP_1__ duplicate',
    })
    console.log('Second insert status:', s2, 'message:', JSON.stringify(d2).substring(0, 100))
    expect(s2).toBe(409)

    // Step 5: Verify only 1 transaction exists
    const txCount = await sbGet(request, `inventory_transactions?tobacco_inventory_id=eq.${TEST_INVENTORY_ID}&session_id=eq.${testSessionId}&select=id`)
    console.log('Transaction count:', txCount.length)
    expect(txCount.length).toBe(1)

    // Cleanup
    await sbDelete(request, `inventory_transactions?session_id=eq.${testSessionId}`)
    await sbDelete(request, `sessions?id=eq.${testSessionId}`)
  })

  test('2. Atomic RPC prevents lost update on concurrent decrements', async ({ request }) => {
    // Read current grams
    const invBefore = await sbGet(request, `tobacco_inventory?id=eq.${TEST_INVENTORY_ID}&select=quantity_grams`)
    const gramsBefore = invBefore[0].quantity_grams
    console.log('Grams before:', gramsBefore)

    // Fire TWO concurrent decrements of 3g each
    const [r1, r2] = await Promise.all([
      sbRpc(request, 'decrement_tobacco_inventory', { p_inventory_id: TEST_INVENTORY_ID, p_grams_used: 3 }),
      sbRpc(request, 'decrement_tobacco_inventory', { p_inventory_id: TEST_INVENTORY_ID, p_grams_used: 3 }),
    ])
    console.log('RPC results:', r1.data, r2.data)

    // Read grams after
    const invAfter = await sbGet(request, `tobacco_inventory?id=eq.${TEST_INVENTORY_ID}&select=quantity_grams`)
    const gramsAfter = invAfter[0].quantity_grams
    console.log('Grams after:', gramsAfter, '| Expected:', gramsBefore - 6)

    // Both decrements must be applied (total -6g, no lost update)
    const expected = Math.max(0, gramsBefore - 6)
    expect(Math.abs(gramsAfter - expected)).toBeLessThan(0.01)

    // Restore
    await sbRpc(request, 'decrement_tobacco_inventory', { p_inventory_id: TEST_INVENTORY_ID, p_grams_used: -6 })
    const invRestored = await sbGet(request, `tobacco_inventory?id=eq.${TEST_INVENTORY_ID}&select=quantity_grams`)
    console.log('Restored to:', invRestored[0].quantity_grams)
  })

  test('3. Sync engine retry: UNIQUE blocks double deduction', async ({ request }) => {
    // Read baseline
    const invBefore = await sbGet(request, `tobacco_inventory?id=eq.${TEST_INVENTORY_ID}&select=quantity_grams`)
    const gramsBefore = invBefore[0].quantity_grams

    // Create test session
    const { data: sessData } = await sbPost(request, 'sessions', {
      profile_id: userId,
      total_grams: 8,
      session_date: new Date().toISOString(),
      notes: '__TEST_RETRY_3__',
    })
    const sessionId = sessData[0].id

    // === FIRST SYNC RUN ===
    // Insert transaction
    const { status: txS1 } = await sbPost(request, 'inventory_transactions', {
      profile_id: userId,
      tobacco_inventory_id: TEST_INVENTORY_ID,
      type: 'session',
      quantity_grams: -8,
      session_id: sessionId,
      notes: '__TEST_RETRY_3__',
    })
    expect(txS1).toBe(201)

    // Atomic decrement
    await sbRpc(request, 'decrement_tobacco_inventory', { p_inventory_id: TEST_INVENTORY_ID, p_grams_used: 8 })

    const invMid = await sbGet(request, `tobacco_inventory?id=eq.${TEST_INVENTORY_ID}&select=quantity_grams`)
    const gramsMid = invMid[0].quantity_grams
    console.log(`First run: ${gramsBefore} → ${gramsMid} (expected ${gramsBefore - 8})`)
    expect(Math.abs(gramsMid - (gramsBefore - 8))).toBeLessThan(0.01)

    // === RETRY (same mutation replayed) ===
    // Insert same transaction → BLOCKED by UNIQUE
    const { status: txS2 } = await sbPost(request, 'inventory_transactions', {
      profile_id: userId,
      tobacco_inventory_id: TEST_INVENTORY_ID,
      type: 'session',
      quantity_grams: -8,
      session_id: sessionId,
      notes: '__TEST_RETRY_3__ retry',
    })
    console.log('Retry insert status:', txS2)
    expect(txS2).toBe(409)

    // Since insert was blocked, sync engine skips RPC.
    // Verify grams unchanged after retry:
    const invAfter = await sbGet(request, `tobacco_inventory?id=eq.${TEST_INVENTORY_ID}&select=quantity_grams`)
    const gramsAfter = invAfter[0].quantity_grams
    console.log(`After retry: ${gramsAfter} (should equal ${gramsMid})`)
    expect(Math.abs(gramsAfter - gramsMid)).toBeLessThan(0.01)

    // Only 1 transaction row
    const txRows = await sbGet(request, `inventory_transactions?session_id=eq.${sessionId}&select=id`)
    expect(txRows.length).toBe(1)

    // Cleanup
    await sbDelete(request, `inventory_transactions?session_id=eq.${sessionId}`)
    await sbDelete(request, `sessions?id=eq.${sessionId}`)
    await sbRpc(request, 'decrement_tobacco_inventory', { p_inventory_id: TEST_INVENTORY_ID, p_grams_used: -8 })
  })

  test('4. Idempotency key blocks duplicate standalone adjustment', async ({ request }) => {
    const invBefore = await sbGet(request, `tobacco_inventory?id=eq.${TEST_INVENTORY_ID}&select=quantity_grams`)
    const gramsBefore = invBefore[0].quantity_grams

    const testKey = crypto.randomUUID()

    // First insert with idempotency_key
    const { status: s1 } = await sbPost(request, 'inventory_transactions', {
      profile_id: userId,
      tobacco_inventory_id: TEST_INVENTORY_ID,
      type: 'adjustment',
      quantity_grams: -10,
      session_id: null,
      notes: '__TEST_IDEM_4__',
      idempotency_key: testKey,
    })
    console.log('First insert:', s1)
    expect(s1).toBe(201)

    // Decrement via RPC
    await sbRpc(request, 'decrement_tobacco_inventory', { p_inventory_id: TEST_INVENTORY_ID, p_grams_used: 10 })

    // Retry with SAME idempotency_key → BLOCKED
    const { status: s2 } = await sbPost(request, 'inventory_transactions', {
      profile_id: userId,
      tobacco_inventory_id: TEST_INVENTORY_ID,
      type: 'adjustment',
      quantity_grams: -10,
      session_id: null,
      notes: '__TEST_IDEM_4__ retry',
      idempotency_key: testKey,
    })
    console.log('Retry insert:', s2)
    expect(s2).toBe(409)

    // Verify grams only deducted once
    const invAfter = await sbGet(request, `tobacco_inventory?id=eq.${TEST_INVENTORY_ID}&select=quantity_grams`)
    console.log(`Grams: ${gramsBefore} → ${invAfter[0].quantity_grams} (expected ${gramsBefore - 10})`)
    expect(Math.abs(invAfter[0].quantity_grams - (gramsBefore - 10))).toBeLessThan(0.01)

    // Only 1 transaction
    const txRows = await sbGet(request, `inventory_transactions?idempotency_key=eq.${testKey}&select=id`)
    expect(txRows.length).toBe(1)

    // Cleanup
    await sbDelete(request, `inventory_transactions?idempotency_key=eq.${testKey}`)
    await sbRpc(request, 'decrement_tobacco_inventory', { p_inventory_id: TEST_INVENTORY_ID, p_grams_used: -10 })
  })

  test('5. Server grams restored — no drift after all tests', async ({ request }) => {
    // Verify the inventory item is back to its original value (169.6g)
    const inv = await sbGet(request, `tobacco_inventory?id=eq.${TEST_INVENTORY_ID}&select=quantity_grams`)
    const serverGrams = inv[0].quantity_grams
    console.log('Final server grams:', serverGrams)

    // Verify no test transactions left behind
    const orphanTxs = await sbGet(request, `inventory_transactions?tobacco_inventory_id=eq.${TEST_INVENTORY_ID}&notes=like.*__TEST_*&select=id,notes`)
    console.log('Orphan test transactions:', orphanTxs.length)

    // Grams should be unchanged from the original value (all tests cleaned up)
    expect(Math.abs(serverGrams - 169.6)).toBeLessThan(0.1)
    expect(orphanTxs.length).toBe(0)

    // Navigate to inventory and take screenshot for visual verification
    await page.goto(`${BASE_URL}/inventory`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/inventory-after-dedup-tests.png', fullPage: false })
  })
})
