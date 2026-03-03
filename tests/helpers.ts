import { expect, type Page } from '@playwright/test'

export const BASE_URL = 'http://localhost:3000'
export const DEMO_EMAIL = 'demo@hookahtorus.com'
export const DEMO_PASSWORD = 'demo2026!'

export async function loginAsDemo(page: Page) {
  // Dismiss cookie consent before login to avoid overlay blocking clicks
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('domcontentloaded')
  await page.evaluate(() => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('pwa-install-dismissed', 'true')
  })
  await page.reload()
  await page.waitForLoadState('domcontentloaded')

  // Prefer "Enter demo mode" button (works when Supabase is not configured)
  const demoButton = page.locator('button.btn-primary').filter({ hasText: /demo/i })
  if (await demoButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await demoButton.click()
  } else {
    // Fallback: real Supabase login (when configured)
    await page.fill('input[type="email"]', DEMO_EMAIL)
    await page.fill('input[type="password"]', DEMO_PASSWORD)
    await page.click('button[type="submit"]')
  }

  // Wait for dashboard URL
  await page.waitForURL('**/dashboard', { timeout: 45000, waitUntil: 'domcontentloaded' })

  // Wait for dashboard content to render (AuthGuard passed, React hydrated)
  await page.waitForTimeout(2000)
}

/**
 * Navigate to a dashboard page via client-side routing (preserves demo mode state).
 * Clicks the sidebar link which triggers Next.js client-side navigation.
 */
export async function navigateTo(page: Page, path: string) {
  // Sidebar links exist in both mobile and desktop sidebars.
  // The mobile sidebar is display:none at >=1024px, so clicking .first() fails.
  // Use JS to click the first visible link, or create a temporary one for client-side nav.
  await page.evaluate((p) => {
    // Try clicking an existing visible link first (triggers Next.js client-side navigation)
    const links = document.querySelectorAll<HTMLAnchorElement>(`a[href="${p}"]`)
    for (const link of links) {
      if (link.offsetParent !== null || link.getClientRects().length > 0) {
        link.click()
        return
      }
    }
    // Fallback: create a temporary link
    const a = document.createElement('a')
    a.href = p
    document.body.appendChild(a)
    a.click()
    a.remove()
  }, path)

  await page.waitForURL(`**${path}`, { timeout: 30000, waitUntil: 'domcontentloaded' })
  // Wait for content to render
  await page.waitForTimeout(1000)
}

/** Dismiss cookie consent banner + any toast notifications + install banner */
export async function dismissOverlays(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('pwa-install-dismissed', 'true')
  })

  await page.evaluate(() => {
    document.querySelectorAll('[data-sonner-toaster], section[aria-label="Notifications alt+T"]').forEach(el => el.remove())
    document.querySelectorAll('.fixed.bottom-0.left-0.right-0').forEach(el => el.remove())
  })
  await page.waitForTimeout(300)
}
