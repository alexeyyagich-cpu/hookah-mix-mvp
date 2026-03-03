import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import { BASE_URL, loginAsDemo, dismissOverlays, navigateTo } from './helpers'

const ERROR_BOUNDARY_TEXT = 'Something went wrong'

let context: BrowserContext
let page: Page

test.describe.serial('Dashboard Navigation', () => {
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    await loginAsDemo(page)
    await dismissOverlays(page)
  })

  test.afterAll(async () => {
    await context.close()
  })

  /**
   * Navigate to a dashboard page via client-side routing and verify common assertions.
   */
  async function navigateAndVerify(path: string) {
    await navigateTo(page, path)
    await dismissOverlays(page)

    // No error boundary should be rendered
    const errorBoundary = page.locator(`text=${ERROR_BOUNDARY_TEXT}`)
    await expect(errorBoundary).toHaveCount(0)

    // Page should have rendered some content
    await page.waitForTimeout(500)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.trim().length).toBeGreaterThan(0)
  }

  // ── 1. Dashboard Home ──────────────────────────────────────────────

  test('Dashboard home loads at /dashboard', async () => {
    // Already on /dashboard from loginAsDemo
    await page.waitForTimeout(1000)

    // Dashboard should have content (greeting, stats, etc.)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.trim().length).toBeGreaterThan(0)

    // No error boundary
    const errorBoundary = page.locator(`text=${ERROR_BOUNDARY_TEXT}`)
    await expect(errorBoundary).toHaveCount(0)
  })

  // ── 2. Inventory ───────────────────────────────────────────────────

  test('Inventory page loads at /inventory', async () => {
    await navigateAndVerify('/inventory')
  })

  // ── 3. Sessions ────────────────────────────────────────────────────

  test('Sessions page loads at /sessions', async () => {
    await navigateAndVerify('/sessions')
  })

  // ── 4. Bowls ───────────────────────────────────────────────────────

  test('Bowls page loads at /bowls', async () => {
    await navigateAndVerify('/bowls')
  })

  // ── 5. Guests ──────────────────────────────────────────────────────

  test('Guests page loads at /guests', async () => {
    await navigateAndVerify('/guests')
  })

  // ── 6. Bar Inventory ───────────────────────────────────────────────

  test('Bar Inventory page loads at /bar/inventory', async () => {
    await navigateAndVerify('/bar/inventory')
  })

  // ── 7. Bar Sales ───────────────────────────────────────────────────

  test('Bar Sales page loads at /bar/sales', async () => {
    await navigateAndVerify('/bar/sales')
  })

  // ── 8. Floor Plan ──────────────────────────────────────────────────

  test('Floor Plan page loads at /floor', async () => {
    await navigateAndVerify('/floor')
  })

  // ── 9. KDS ─────────────────────────────────────────────────────────

  test('KDS page loads at /kds', async () => {
    await navigateAndVerify('/kds')
  })

  // ── 10. Shifts ─────────────────────────────────────────────────────

  test('Shifts page loads at /shifts', async () => {
    await navigateAndVerify('/shifts')
  })

  // ── 11. Reports ────────────────────────────────────────────────────

  test('Reports page loads at /reports', async () => {
    await navigateAndVerify('/reports')
  })

  // ── 12. Statistics ─────────────────────────────────────────────────

  test('Statistics page loads at /statistics', async () => {
    await navigateAndVerify('/statistics')
  })

  // ── 13. Settings ───────────────────────────────────────────────────

  test('Settings page loads at /settings', async () => {
    await navigateAndVerify('/settings')
  })

  // ── 14. Team ───────────────────────────────────────────────────────

  test('Team page loads at /settings/team', async () => {
    await navigateAndVerify('/settings/team')
  })

  // ── 15. Reviews ────────────────────────────────────────────────────

  test('Reviews page loads at /reviews', async () => {
    await navigateAndVerify('/reviews')
  })
})
