import { test, expect } from '@playwright/test'

for (const width of [1440, 390, 320]) {
  test(`the CIRS scene opens its case and restores its own native origin at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: test.info().project.use.baseURL ?? 'http://127.0.0.1:5173',
      viewport: { width, height: width === 1440 ? 1000 : 844 },
      reducedMotion: width === 1440 ? 'no-preference' : 'reduce',
      ...(width < 768 ? { isMobile: true, hasTouch: true } : {}),
    })
    const page = await context.newPage()
    try {
      await page.goto('/')
      await page.evaluate(() => document.fonts.ready)
      await page.locator('.state-opening').waitFor({ state: 'detached' })
      const origin = page.locator('[data-home-origin="cirs-scene"]')
      if (width === 1440) await page.mouse.wheel(0, 1000)
      await expect(origin).toBeVisible()
      await origin.scrollIntoViewIfNeeded()
      await origin.focus()
      await expect(origin).toBeInViewport()
      expect((await origin.boundingBox())!.height).toBeGreaterThanOrEqual(44)
      await expect(origin).toHaveAttribute('href', '/projects/cirs')
      await origin.evaluate(node => node.addEventListener('click', () => {
        (window as Window & { __sceneDeparture?: number }).__sceneDeparture = scrollY
      }, { capture: true, once: true }))
      await page.keyboard.press('Enter')
      const leftY = await page.evaluate(() => (window as Window & { __sceneDeparture?: number }).__sceneDeparture!)
      await expect(page).toHaveURL(/\/projects\/cirs$/)
      await page.locator('.state-opening').waitFor({ state: 'detached' })
      await expect(page.locator('h1')).toBeFocused()
      await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
      await expect(page).toHaveURL(/\/$/)
      await page.locator('.state-opening').waitFor({ state: 'detached' })
      await expect.poll(() => page.evaluate(y => Math.abs(scrollY - y), leftY)).toBeLessThan(4)
      await expect(origin).toBeFocused()
      await expect(origin).toBeInViewport()
      expect(await origin.getAttribute('tabindex')).toBeNull()
      await expect(page.locator('.cirs-browser-body')).toHaveAttribute('href', 'https://cirschool.org')
    } finally {
      await context.close()
    }
  })
}
