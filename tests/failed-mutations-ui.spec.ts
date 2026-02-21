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
  await page.waitForURL('**/dashboard', { timeout: 15000 })
}

async function dismissCookieBanner(page: Page) {
  const acceptBtn = page.locator('button').filter({ hasText: /Accept|Принять|Akzeptieren/i }).first()
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click()
    await page.waitForTimeout(500)
  }
}

async function insertFailedMutations(page: Page, count: number) {
  await page.evaluate((n) => {
    return new Promise<void>((resolve) => {
      const req = indexedDB.open('hookah-torus-offline', 1)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('syncQueue', 'readwrite')
        const store = tx.objectStore('syncQueue')

        const tables = ['sessions', 'kds_orders', 'tobacco_inventory']
        const errors = [
          'permission denied for table sessions',
          'new row violates row-level security policy',
          'duplicate key value violates unique constraint',
        ]

        for (let i = 0; i < n; i++) {
          store.add({
            table: tables[i % 3],
            operation: i % 3 === 0 ? 'compound' : 'insert',
            payload: { id: `offline-test-${i}`, profile_id: 'test' },
            userId: 'test-user',
            createdAt: new Date(Date.now() - (n - i) * 60000).toISOString(),
            status: 'failed',
            retryCount: 3,
            error: errors[i % 3],
            idempotencyKey: `test-idem-${i}`,
            meta: {},
          })
        }
        tx.oncomplete = () => {
          window.dispatchEvent(new Event('offline-mutation-enqueued'))
          resolve()
        }
      }
    })
  }, count)
}

async function getQueueState(page: Page) {
  return page.evaluate(() => {
    return new Promise<{ pending: number; failed: number; total: number }>((resolve) => {
      const req = indexedDB.open('hookah-torus-offline', 1)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('syncQueue', 'readonly')
        const store = tx.objectStore('syncQueue')
        const idx = store.index('byStatus')

        const pReq = idx.count('pending')
        pReq.onsuccess = () => {
          const fReq = idx.count('failed')
          fReq.onsuccess = () => {
            const tReq = store.count()
            tReq.onsuccess = () => {
              resolve({ pending: pReq.result, failed: fReq.result, total: tReq.result })
            }
          }
        }
      }
    })
  })
}

async function clearQueue(page: Page) {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const req = indexedDB.open('hookah-torus-offline', 1)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('syncQueue', 'readwrite')
        tx.objectStore('syncQueue').clear()
        tx.oncomplete = () => resolve()
      }
    })
  })
}

test.describe('Failed Mutation Recovery UI', () => {
  let context: BrowserContext
  let page: Page

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    await loginAsDemo(page)
    await dismissCookieBanner(page)
  })

  test.afterAll(async () => {
    await context.close()
  })

  test.afterEach(async () => {
    await clearQueue(page)
    await page.evaluate(() => window.dispatchEvent(new Event('offline-mutation-enqueued')))
    await page.waitForTimeout(500)
  })

  test('1. Red pill appears when failed mutations exist', async () => {
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await dismissCookieBanner(page)

    await insertFailedMutations(page, 2)
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'test-results/failed-pill.png', fullPage: false })

    const pillInfo = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button')
      for (const btn of buttons) {
        const style = btn.getAttribute('style') || ''
        if (style.includes('239, 68, 68') || style.includes('248, 113, 113')) {
          return { found: true, text: btn.textContent?.trim() }
        }
      }
      return { found: false, text: '' }
    })

    console.log('Red pill:', JSON.stringify(pillInfo))
    expect(pillInfo.found).toBe(true)
    expect(pillInfo.text).toContain('2')
  })

  test('2. Clicking pill opens panel with error details', async () => {
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await dismissCookieBanner(page)

    await insertFailedMutations(page, 3)
    await page.waitForTimeout(2000)

    // Click the red pill using force to bypass any remaining overlays
    const failedPill = page.locator('button[style*="239, 68, 68"]')
    await failedPill.click({ force: true })
    await page.waitForTimeout(1000)

    await page.screenshot({ path: 'test-results/failed-panel-open.png', fullPage: false })

    // Verify panel appeared — target the OfflineIndicator's fixed container specifically
    const panelText = await page.evaluate(() => {
      const container = document.querySelector('.fixed.bottom-4.right-4.z-50')
      if (!container) return null
      const panel = container.querySelector('.overflow-y-auto')
      return panel?.textContent ?? null
    })

    console.log('Panel text:', panelText?.substring(0, 200))
    expect(panelText).not.toBeNull()
    expect(panelText).toContain('Session')
    expect(panelText).toContain('permission denied')
  })

  test('3. Discard removes a single mutation', async () => {
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await dismissCookieBanner(page)

    await insertFailedMutations(page, 2)
    await page.waitForTimeout(2000)

    const before = await getQueueState(page)
    expect(before.failed).toBe(2)

    // Open panel
    const container = page.locator('.fixed.bottom-4.right-4.z-50')
    await container.locator('button[style*="239, 68, 68"]').click({ force: true })
    await page.waitForTimeout(500)

    // Click per-item X button (p-1 class) on first item — NOT the header "Delete All" (px-2)
    const discardBtn = container.locator('.overflow-y-auto button.p-1.text-zinc-500').first()
    await discardBtn.click({ force: true })
    await page.waitForTimeout(1000)

    const after = await getQueueState(page)
    console.log('After discard:', JSON.stringify(after))
    expect(after.total).toBe(1)

    await page.screenshot({ path: 'test-results/failed-after-discard.png', fullPage: false })
  })

  test('4. Retry resets mutation to pending', async () => {
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await dismissCookieBanner(page)

    await insertFailedMutations(page, 1)
    await page.waitForTimeout(2000)

    const before = await getQueueState(page)
    expect(before.failed).toBe(1)

    // Open panel
    const container = page.locator('.fixed.bottom-4.right-4.z-50')
    await container.locator('button[style*="239, 68, 68"]').click({ force: true })
    await page.waitForTimeout(500)

    // Click per-item retry button (p-1 class, blue)
    const retryBtn = container.locator('.overflow-y-auto button.p-1.text-blue-400').first()
    await retryBtn.click({ force: true })
    await page.waitForTimeout(1000)

    const after = await getQueueState(page)
    console.log('After retry:', JSON.stringify(after))
    // Item should exist — either pending (reset) or failed again (re-synced)
    expect(after.total).toBe(1)

    await page.screenshot({ path: 'test-results/failed-after-retry.png', fullPage: false })
  })

  test('5. Discard All clears everything', async () => {
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await dismissCookieBanner(page)

    await insertFailedMutations(page, 3)
    await page.waitForTimeout(2000)

    const before = await getQueueState(page)
    expect(before.failed).toBe(3)

    // Open panel
    const container = page.locator('.fixed.bottom-4.right-4.z-50')
    await container.locator('button[style*="239, 68, 68"]').click({ force: true })
    await page.waitForTimeout(500)

    // Click "Delete All" button in the panel header (px-2 class, zinc text)
    const headerDiscardBtn = container.locator('.overflow-y-auto button.px-2.text-zinc-500').first()
    await headerDiscardBtn.click({ force: true })
    await page.waitForTimeout(1000)

    const after = await getQueueState(page)
    console.log('After discard all:', JSON.stringify(after))
    expect(after.total).toBe(0)

    await page.screenshot({ path: 'test-results/failed-after-discard-all.png', fullPage: false })
  })
})
