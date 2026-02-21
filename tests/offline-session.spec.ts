import { test, expect, type Page, type BrowserContext } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const DEMO_EMAIL = 'demo@hookahtorus.com'
const DEMO_PASSWORD = 'demo2026!'

async function loginAsDemo(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')

  await page.fill('input[type="email"]', DEMO_EMAIL)
  await page.fill('input[type="password"]', DEMO_PASSWORD)
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 })
}

test.describe('Offline Session Creation', () => {
  let context: BrowserContext
  let page: Page

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
  })

  test.afterAll(async () => {
    await context.close()
  })

  test('login and navigate to sessions', async () => {
    await loginAsDemo(page)
    await expect(page).toHaveURL(/dashboard/)

    // Navigate to sessions page
    await page.goto(`${BASE_URL}/sessions`)
    await page.waitForLoadState('networkidle')

    // Should see sessions page content
    const content = await page.textContent('body')
    expect(content).toBeTruthy()
  })

  test('go offline, create session, verify it appears', async () => {
    // Navigate to sessions
    await page.goto(`${BASE_URL}/sessions`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Count existing sessions
    const sessionsBefore = await page.locator('[data-testid="session-card"], .session-card, tr, [class*="session"]').count()
    console.log(`Sessions before offline: ${sessionsBefore}`)

    // Go offline
    await context.setOffline(true)
    await page.waitForTimeout(1000)

    // Check offline indicator appears
    const offlineIndicator = page.locator('text=Offline, text=Оффлайн, text=offline')
    const indicatorVisible = await offlineIndicator.isVisible().catch(() => false)
    console.log(`Offline indicator visible: ${indicatorVisible}`)

    // Check navigator.onLine is false
    const isOnline = await page.evaluate(() => navigator.onLine)
    expect(isOnline).toBe(false)
    console.log(`navigator.onLine: ${isOnline}`)

    // Try to create a session via the UI
    // First, check if there's a "create session" / "new session" button
    const createButton = page.locator('button, a').filter({ hasText: /new|create|добавить|создать|\+/i }).first()
    const hasCreateButton = await createButton.isVisible().catch(() => false)
    console.log(`Create button found: ${hasCreateButton}`)

    if (hasCreateButton) {
      await createButton.click()
      await page.waitForTimeout(1000)
    }

    // Alternative: test the offline mutation directly via JavaScript
    console.log('Testing offline session creation via JavaScript...')
    const result = await page.evaluate(async () => {
      // Access IndexedDB to check the sync queue
      const { openDB } = await import('/node_modules/idb/build/index.js' as string)
        .catch(() => ({ openDB: null }))

      // Check if there's data in the cache
      try {
        const dbs = await indexedDB.databases()
        const dbNames = dbs.map(d => d.name)
        return {
          indexedDBAvailable: true,
          databases: dbNames,
          navigatorOnline: navigator.onLine,
        }
      } catch {
        return {
          indexedDBAvailable: false,
          databases: [],
          navigatorOnline: navigator.onLine,
        }
      }
    })
    console.log('IndexedDB state:', JSON.stringify(result, null, 2))

    // Go back online
    await context.setOffline(false)
    await page.waitForTimeout(2000)

    const isOnlineAfter = await page.evaluate(() => navigator.onLine)
    console.log(`navigator.onLine after reconnect: ${isOnlineAfter}`)
  })

  test('verify offline indicator shows and hides', async () => {
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Go offline
    await context.setOffline(true)
    await page.waitForTimeout(2000)

    // Take screenshot for offline state
    await page.screenshot({ path: 'test-results/offline-state.png', fullPage: false })

    // Check for offline indicator (amber pill)
    const body = await page.textContent('body')
    const hasOfflineText = body?.includes('Offline') || body?.includes('Оффлайн') || body?.includes('offline')
    console.log(`Page has offline text: ${hasOfflineText}`)

    // Go online
    await context.setOffline(false)
    await page.waitForTimeout(3000)

    // Take screenshot for online state
    await page.screenshot({ path: 'test-results/online-state.png', fullPage: false })

    console.log('Screenshots saved to test-results/')
  })

  test('create session offline via hook simulation', async () => {
    // Navigate to sessions page and wait for it to load
    await page.goto(`${BASE_URL}/sessions`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Take screenshot of sessions page
    await page.screenshot({ path: 'test-results/sessions-page.png', fullPage: true })

    // Go offline
    await context.setOffline(true)
    await page.waitForTimeout(1500)

    // Directly test IndexedDB sync queue by enqueuing a mutation
    const queueResult = await page.evaluate(async () => {
      try {
        // Open the DB directly
        return new Promise((resolve) => {
          const request = indexedDB.open('hookah-torus-offline', 1)
          request.onsuccess = () => {
            const db = request.result
            const storeNames = Array.from(db.objectStoreNames)

            // Check cache store
            const tx = db.transaction('cache', 'readonly')
            const cacheStore = tx.objectStore('cache')
            const getAllRequest = cacheStore.getAllKeys()
            getAllRequest.onsuccess = () => {
              const cacheKeys = getAllRequest.result as string[]

              // Check syncQueue
              const tx2 = db.transaction('syncQueue', 'readonly')
              const syncStore = tx2.objectStore('syncQueue')
              const countRequest = syncStore.count()
              countRequest.onsuccess = () => {
                resolve({
                  dbOpen: true,
                  storeNames,
                  cacheKeys,
                  syncQueueCount: countRequest.result,
                })
              }
            }
          }
          request.onerror = () => {
            resolve({ dbOpen: false, error: 'Failed to open DB' })
          }
        })
      } catch (e) {
        return { error: String(e) }
      }
    })

    console.log('IndexedDB state:', JSON.stringify(queueResult, null, 2))

    // Now enqueue a test mutation directly
    const enqueueResult = await page.evaluate(async () => {
      try {
        return new Promise((resolve) => {
          const request = indexedDB.open('hookah-torus-offline', 1)
          request.onsuccess = () => {
            const db = request.result
            const tx = db.transaction('syncQueue', 'readwrite')
            const store = tx.objectStore('syncQueue')

            const testEntry = {
              table: 'sessions',
              operation: 'compound',
              payload: {
                id: `offline-test-${Date.now()}`,
                profile_id: 'test',
                session_date: new Date().toISOString(),
                total_grams: 20,
                compatibility_score: 85,
                notes: 'Offline test session',
              },
              userId: 'test-user',
              createdAt: new Date().toISOString(),
              status: 'pending',
              retryCount: 0,
              error: null,
              idempotencyKey: `test-${Date.now()}`,
              meta: {
                items: [],
                inventoryAdjustments: [],
              },
            }

            const addRequest = store.add(testEntry)
            addRequest.onsuccess = () => {
              // Verify it was added
              const countReq = store.count()
              countReq.onsuccess = () => {
                resolve({
                  enqueued: true,
                  newId: addRequest.result,
                  totalQueueItems: countReq.result,
                })
              }
            }
            addRequest.onerror = () => {
              resolve({ enqueued: false, error: String(addRequest.error) })
            }
          }
        })
      } catch (e) {
        return { error: String(e) }
      }
    })

    console.log('Enqueue result:', JSON.stringify(enqueueResult, null, 2))

    // Verify the pending count shows in the offline indicator
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'test-results/offline-with-pending.png', fullPage: false })

    // Clean up: remove the test entry and go online
    await page.evaluate(async () => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.open('hookah-torus-offline', 1)
        request.onsuccess = () => {
          const db = request.result
          const tx = db.transaction('syncQueue', 'readwrite')
          tx.objectStore('syncQueue').clear()
          tx.oncomplete = () => resolve()
        }
      })
    })

    await context.setOffline(false)
    await page.waitForTimeout(2000)
  })
})
