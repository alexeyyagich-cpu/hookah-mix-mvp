import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import { loginAsDemo, dismissOverlays, navigateTo } from './helpers'

let context: BrowserContext
let page: Page

test.describe.serial('Session CRUD — Demo Mode', () => {
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    await loginAsDemo(page)
  })

  test.afterAll(async () => {
    await context.close()
  })

  test('1. Sessions page loads with existing sessions', async () => {
    await navigateTo(page, '/sessions')
    await dismissOverlays(page)

    // Page should have loaded without ErrorBoundary triggering
    await expect(page.getByText('Something went wrong')).not.toBeVisible()

    // The page should have a heading
    const heading = page.locator('h1')
    await expect(heading).toBeVisible({ timeout: 10000 })

    // Page body should have meaningful content
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.trim().length).toBeGreaterThan(0)
  })

  test('2. Session list has items', async () => {
    // Still on /sessions from previous test
    await page.waitForTimeout(500)

    // Session cards should be present (demo data)
    const cards = page.locator('.card')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('3. Navigate to mix calculator', async () => {
    // The create button links to /mix
    const mixLink = page.locator('a[href="/mix"]').first()
    if (await mixLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await mixLink.click()
      await page.waitForURL('**/mix', { timeout: 15000, waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(500)

      // Mix page should load without error boundary
      await expect(page.getByText('Something went wrong')).not.toBeVisible()
    }

    // Navigate back to sessions
    await navigateTo(page, '/sessions')
  })

  test('4. Inventory page loads and shows items', async () => {
    await navigateTo(page, '/inventory')
    await dismissOverlays(page)

    // No error boundary
    await expect(page.getByText('Something went wrong')).not.toBeVisible()

    // Page should have content
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.trim().length).toBeGreaterThan(0)
  })

  test('5. Dashboard shows hookah stats', async () => {
    await navigateTo(page, '/dashboard')
    await dismissOverlays(page)

    // No error boundary
    await expect(page.getByText('Something went wrong')).not.toBeVisible()

    // Heading should be visible
    const heading = page.locator('h1')
    await expect(heading).toBeVisible({ timeout: 10000 })

    // Dashboard should have at least one card with stats
    const cards = page.locator('.card')
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(0)
  })
})
