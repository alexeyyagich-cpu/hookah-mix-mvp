import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'
const OUT = 'public/screenshots'

async function main() {
  const browser = await chromium.launch()

  // Login as demo
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${BASE}/login`)
  await page.waitForLoadState('networkidle')
  await page.fill('input[type="email"]', 'demo@hookahtorus.com')
  await page.fill('input[type="password"]', 'demo2026!')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 15000 })

  // Dismiss overlays
  await page.evaluate(() => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('pwa-install-dismissed', 'true')
  })
  await page.evaluate(() => {
    document.querySelectorAll('[data-sonner-toaster], section[aria-label="Notifications alt+T"]').forEach(el => el.remove())
    document.querySelectorAll('.fixed.bottom-0.left-0.right-0').forEach(el => el.remove())
  })
  await page.waitForTimeout(1000)

  // Phone screenshot — dashboard (360x640 @3x = 1080x1920)
  await page.setViewportSize({ width: 360, height: 640 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/dashboard-narrow.png`, fullPage: false })
  console.log('Captured: dashboard-narrow.png')

  // Phone screenshot — mix calculator
  await page.goto(`${BASE}/mix`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/mix-narrow.png`, fullPage: false })
  console.log('Captured: mix-narrow.png')

  // Desktop screenshot — dashboard (1920x1080)
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto(`${BASE}/dashboard`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/dashboard-wide.png`, fullPage: false })
  console.log('Captured: dashboard-wide.png')

  await browser.close()
  console.log('Done!')
}

main().catch(console.error)
