import { test, expect } from '@playwright/test'
import { BASE_URL } from './helpers'

test.describe('Public Pages', () => {
  test('Landing page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')

    // Page should have a title containing the brand name
    const title = await page.title()
    expect(title).toContain('Hookah Torus')

    // Wait for React hydration — landing page is a client component
    const firstLink = page.locator('a').first()
    await expect(firstLink).toBeVisible({ timeout: 15000 })

    // Should contain at least one link (navigation, CTA, etc.)
    const links = page.locator('a')
    expect(await links.count()).toBeGreaterThan(0)
  })

  test('Landing page has SEO meta tags', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('domcontentloaded')

    // og:title
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /Hookah Torus/)

    // og:description
    const ogDescription = page.locator('meta[property="og:description"]')
    await expect(ogDescription).toHaveAttribute('content', /.+/)

    // viewport
    const viewport = page.locator('meta[name="viewport"]')
    await expect(viewport).toHaveAttribute('content', /width/)
  })

  test('Pricing page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`)
    await page.waitForLoadState('domcontentloaded')

    // Should display plan names — Trial, Core, Multi, Enterprise
    const body = page.locator('body')
    await expect(body).toContainText('Core')
    await expect(body).toContainText('Multi')
    await expect(body).toContainText('Enterprise')
  })

  test('Legal pages load', async ({ page }) => {
    const legalPages = [
      { path: '/legal/terms', expectedText: /terms|conditions|nutzungsbedingungen|положения/i },
      { path: '/legal/privacy', expectedText: /privacy|data|datenschutz|конфиденциальност/i },
      { path: '/legal/impressum', expectedText: /impressum|imprint|contact|kontakt/i },
    ]

    for (const { path, expectedText } of legalPages) {
      await page.goto(`${BASE_URL}${path}`)
      await page.waitForLoadState('networkidle')
      // Wait for React hydration
      await page.waitForTimeout(1000)

      const textContent = await page.locator('body').innerText()
      expect(textContent.length).toBeGreaterThan(100)
      expect(textContent).toMatch(expectedText)
    }
  })

  test('Health API returns ok', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`)

    expect(response.status()).toBe(200)

    const json = await response.json()
    expect(json).toHaveProperty('status')
    expect(['ok', 'degraded']).toContain(json.status)
    expect(json).toHaveProperty('timestamp')
  })

  test('Mix calculator loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/mix`)
    await page.waitForLoadState('networkidle')

    // Mix page should have interactive elements — buttons or inputs
    const buttons = page.locator('button')
    await expect(buttons.first()).toBeVisible({ timeout: 10000 })
    expect(await buttons.count()).toBeGreaterThan(0)
  })

  test('Recommend page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/recommend`)
    await page.waitForLoadState('networkidle')

    // Wait for the preference selection UI to render
    const strengthLabel = page.getByText(/Strength|strength|Крепость/i).first()
    await expect(strengthLabel).toBeVisible({ timeout: 15000 })

    // Should have interactive elements (buttons for strength/flavor selection)
    const buttons = page.locator('button')
    expect(await buttons.count()).toBeGreaterThan(0)
  })

  test('Unauthenticated user visiting /dashboard redirects to /login', async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies()

    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')

    // AuthGuard redirects to /login after 2s grace period
    await page.waitForURL('**/login**', { timeout: 30000 })
    expect(page.url()).toContain('/login')
  })
})
