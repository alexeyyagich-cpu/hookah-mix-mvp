import { test, expect, type Page, type BrowserContext } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const DEMO_EMAIL = 'demo@hookahtorus.com'
const DEMO_PASSWORD = 'demo2026!'

let context: BrowserContext
let page: Page

async function loginAsDemo(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await page.fill('input[type="email"]', DEMO_EMAIL)
  await page.fill('input[type="password"]', DEMO_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 15000 })
}

/** Dismiss cookie consent banner + any toast notifications + install banner */
async function dismissOverlays(page: Page) {
  // Set cookie consent in localStorage so the banner never shows
  await page.evaluate(() => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('pwa-install-dismissed', 'true')
  })

  // Remove any sonner toast sections and cookie/install banners from DOM
  await page.evaluate(() => {
    document.querySelectorAll('[data-sonner-toaster], section[aria-label="Notifications alt+T"]').forEach(el => el.remove())
    document.querySelectorAll('.fixed.bottom-0.left-0.right-0').forEach(el => el.remove())
  })
  await page.waitForTimeout(300)
}

test.describe('Floor Plan — Demo Mode', () => {
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    await loginAsDemo(page)
  })

  test.afterAll(async () => {
    await context.close()
  })

  test('1. Floor page loads with demo tables', async () => {
    await page.goto(`${BASE_URL}/floor`)
    await page.waitForLoadState('networkidle')
    await dismissOverlays(page)

    // Should see 5 demo tables rendered as positioned elements
    const tableButtons = page.locator('[role="button"][id^="table-"]')
    await expect(tableButtons).toHaveCount(5)

    // Verify specific table names on the canvas (scoped to table elements)
    await expect(page.locator('[id="table-1"]')).toContainText('Table 1')
    await expect(page.locator('[id="table-2"]')).toContainText('Table 2')
    await expect(page.locator('[id="table-3"]')).toContainText('VIP')
    await expect(page.locator('[id="table-5"]')).toContainText('Bar counter')

    // Occupied tables show guest names
    await expect(page.locator('[id="table-1"]')).toContainText('Tomasz K.')
    await expect(page.locator('[id="table-5"]')).toContainText('Lena S.')

    // Stats cards should be present
    const statCards = page.locator('.card.p-4')
    await expect(statCards).toHaveCount(4)
  })

  test('2. Click table shows detail panel', async () => {
    await page.goto(`${BASE_URL}/floor`)
    await page.waitForLoadState('networkidle')
    await dismissOverlays(page)

    // Click "Table 2" (available)
    await page.locator('[id="table-2"]').click()
    await page.waitForTimeout(500)

    // Detail panel should appear — it's a .card with border
    // Check that status buttons are visible (Available, Occupied, Reserved, Cleaning)
    const detailPanel = page.locator('.card').filter({ hasText: 'Table 2' }).filter({ hasText: /capacity|seats/i }).first()
      || page.locator('.card[style*="border-width: 2px"]')

    // The panel has a grid of 4 status buttons
    const statusGrid = page.locator('.grid.grid-cols-2.gap-2')
    await expect(statusGrid.last()).toBeVisible()

    // Should show the "By the window" note
    await expect(page.getByText('By the window')).toBeVisible()
  })

  test('3. Edit mode — enter and see edit controls', async () => {
    await page.goto(`${BASE_URL}/floor`)
    await page.waitForLoadState('networkidle')
    await dismissOverlays(page)

    // Find and click the edit/settings button
    const editBtn = page.locator('button').filter({ hasText: /edit/i }).first()
    await editBtn.click()
    await page.waitForTimeout(500)

    // Edit mode help text should appear (mentions drag)
    await expect(page.locator('text=drag')).toBeVisible()

    // "Add Table" / "Add" button should appear in legend area
    const addTableBtn = page.locator('button').filter({ hasText: /add/i })
    await expect(addTableBtn.first()).toBeVisible()
  })

  test('4. Edit mode — add a new table via modal', async () => {
    await page.goto(`${BASE_URL}/floor`)
    await page.waitForLoadState('networkidle')
    await dismissOverlays(page)

    // Enter edit mode
    const editBtn = page.locator('button').filter({ hasText: /edit/i }).first()
    await editBtn.click()
    await page.waitForTimeout(500)

    // Count tables before
    const tablesBefore = await page.locator('[role="button"][id^="table-"]').count()
    expect(tablesBefore).toBe(5)

    // Click "Add Table" button
    const addBtn = page.locator('button').filter({ hasText: /add/i }).first()
    await addBtn.click()
    await page.waitForTimeout(500)

    // Modal should appear
    const modal = page.locator('.fixed.inset-0.z-50')
    await expect(modal).toBeVisible()

    // Fill in the form
    const nameInput = modal.locator('input[type="text"]')
    await nameInput.fill('Terrace')

    // Set capacity to 6
    const capacityInput = modal.locator('input[type="number"]').first()
    await capacityInput.fill('6')

    // Submit the form
    const saveBtn = modal.locator('button[type="submit"]')
    await saveBtn.click({ force: true })
    await page.waitForTimeout(500)

    // Modal should close and new table should appear
    await expect(modal).not.toBeVisible()

    const tablesAfter = await page.locator('[role="button"][id^="table-"]').count()
    expect(tablesAfter).toBe(6)

    // New table name should be visible on the canvas
    await expect(page.locator('[role="button"][id^="table-"]').filter({ hasText: 'Terrace' })).toBeVisible()
  })

  test('5. Edit mode — drag a table to a new position', async () => {
    await page.goto(`${BASE_URL}/floor`)
    await page.waitForLoadState('networkidle')
    await dismissOverlays(page)

    // Enter edit mode
    const editBtn = page.locator('button').filter({ hasText: /edit/i }).first()
    await editBtn.click()
    await page.waitForTimeout(500)

    // Get Table 2's initial bounding box
    const table2 = page.locator('[id="table-2"]')
    const boxBefore = await table2.boundingBox()
    expect(boxBefore).toBeTruthy()

    const startX = boxBefore!.x + boxBefore!.width / 2
    const startY = boxBefore!.y + boxBefore!.height / 2

    // Perform drag: move cursor, press, drag in small steps, release
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    // Small incremental moves to trigger isDragging = true
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(startX + i * 10, startY + i * 5, { steps: 2 })
    }
    await page.mouse.up()
    await page.waitForTimeout(1000) // Wait for React state update

    // Verify table moved — read the inline style (position is set via React state after moveTable)
    const styleLeft = await table2.evaluate(el => el.style.left || getComputedStyle(el).left)
    const styleTop = await table2.evaluate(el => el.style.top || getComputedStyle(el).top)
    console.log('Table 2 position after drag:', styleLeft, styleTop)

    // Original position was 200px, 50px. After dragging ~100px right, 50px down it should differ
    const leftVal = parseInt(styleLeft)
    expect(leftVal).toBeGreaterThan(220) // Was 200, moved right

    await page.screenshot({ path: 'test-results/floor-drag-after.png', fullPage: false })
  })

  test('6. Edit mode — click table opens edit modal, delete table', async () => {
    await page.goto(`${BASE_URL}/floor`)
    await page.waitForLoadState('networkidle')
    await dismissOverlays(page)

    // Enter edit mode
    const editBtn = page.locator('button').filter({ hasText: /edit/i }).first()
    await editBtn.click()
    await page.waitForTimeout(500)

    const tablesBefore = await page.locator('[role="button"][id^="table-"]').count()

    // Click Table 3 (cleaning status, id=4) to open edit modal
    await page.locator('[id="table-4"]').click()
    await page.waitForTimeout(500)

    // Edit modal should appear
    const modal = page.locator('.fixed.inset-0.z-50')
    await expect(modal).toBeVisible()

    // Should have a delete button
    const deleteBtn = modal.locator('button').filter({ hasText: /delete/i })
    await expect(deleteBtn).toBeVisible()

    // Click delete (force to bypass any overlay)
    await deleteBtn.click({ force: true })
    await page.waitForTimeout(500)

    // Modal should close and table count should decrease
    await expect(modal).not.toBeVisible()
    const tablesAfter = await page.locator('[role="button"][id^="table-"]').count()
    expect(tablesAfter).toBe(tablesBefore - 1)
  })

  test('7. Table status change — available to occupied via guest picker', async () => {
    await page.goto(`${BASE_URL}/floor`)
    await page.waitForLoadState('networkidle')
    await dismissOverlays(page)

    // Click Table 2 (available) to open detail panel
    await page.locator('[id="table-2"]').click()
    await page.waitForTimeout(500)

    // Click "Occupied" status button — this opens the guest picker
    const occupiedBtn = page.locator('.grid.grid-cols-2.gap-2').last().locator('button').filter({ hasText: /occupied/i })
    await occupiedBtn.click({ force: true })
    await page.waitForTimeout(500)

    // Guest picker input should appear
    const guestInput = page.locator('input[type="text"][placeholder]').last()
    await expect(guestInput).toBeVisible()
    await guestInput.fill('Test Guest')

    // Click the "Start session" button
    const startBtn = page.locator('button').filter({ hasText: /start/i }).last()
    await startBtn.click({ force: true })
    await page.waitForTimeout(1000)

    // Table 2 should now show "Test Guest"
    const table2 = page.locator('[id="table-2"]')
    await expect(table2).toContainText('Test Guest')
  })

  test('8. Screenshot final state', async () => {
    await page.goto(`${BASE_URL}/floor`)
    await page.waitForLoadState('networkidle')
    await dismissOverlays(page)
    await page.screenshot({ path: 'test-results/floor-plan-final.png', fullPage: true })
  })
})
