import { test, expect } from '@playwright/test'

for (const width of [320, 390]) {
  test(`${width}px mobile menu holds the timed tour and owns the first Escape`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width, height: 844 },
      hasTouch: true,
      isMobile: true,
      reducedMotion: 'no-preference',
    })
    try {
      const page = await context.newPage()
      // Keep this a normal-motion tour while avoiding unrelated ambient media.
      await page.addInitScript(() => Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 }))
      await page.goto('/')
      await page.evaluate(() => document.fonts.ready)
      await page.locator('.state-opening').waitFor({ state: 'detached' })
      await page.clock.install()
      const launcher = page.getByRole('button', { name: 'Take the 60-second tour', exact: true })
      await launcher.focus()
      await page.keyboard.press('Enter')
      const tour = page.locator('.tour-panel')
      await expect(tour.locator('h3')).toBeFocused()
      const resume = tour.getByRole('button', { name: 'Resume tour', exact: true })
      await resume.focus()
      await page.keyboard.press('Enter')
      await expect(tour).toHaveAttribute('data-manual', 'false')
      await expect(tour).toHaveAttribute('data-playing', 'true')
      await page.clock.runFor(2_200)

      const menu = page.locator('.atelier-navigation .menu-button')
      await menu.tap()
      await expect(menu).toHaveAttribute('aria-expanded', 'true')
      await expect(tour).toBeVisible()
      await expect(tour).toHaveAttribute('data-playing', 'false')
      const chapter = await tour.locator('.tour-chapter').textContent()
      const progress = await tour.locator('.tour-progress i').first().getAttribute('style')
      await page.clock.runFor(13_000)
      await expect(tour.locator('.tour-chapter')).toHaveText(chapter!)
      await expect(tour.locator('.tour-progress i').first()).toHaveAttribute('style', progress!)

      await page.keyboard.press('Escape')
      await expect(menu).toHaveAttribute('aria-expanded', 'false')
      await expect(menu).toBeFocused()
      await expect(tour).toBeVisible()
      await expect(tour.locator('.tour-chapter')).toHaveText(chapter!)
      await expect(tour).toHaveAttribute('data-playing', 'true')
      await page.clock.runFor(12_000)
      await expect(tour.locator('.tour-chapter')).toContainText('02 / 05')

      // A later Escape may close the tour, preserving the unrelated menu focus.
      await page.keyboard.press('Escape')
      await expect(tour).toHaveCount(0)
      await expect(menu).toBeFocused()
    } finally {
      await context.close()
    }
  })
}
