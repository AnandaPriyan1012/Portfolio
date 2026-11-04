import { test, expect } from '@playwright/test'

for (const width of [320, 390]) {
  for (const project of ['cirs', 'community', 'accuflow']) {
    test(`${project} at ${width}px keeps project and evidence links comfortably tappable`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.goto(`/projects/${project}`)
      await page.locator('.state-opening').waitFor({ state: 'detached' })
      await page.evaluate(() => document.fonts.ready)
      const targets = page.locator('.case-passport-strip a, .case-media figcaption a, .case-admissions > a')
      expect(await targets.count()).toBeGreaterThan(0)
      for (const link of await targets.all()) {
        await link.scrollIntoViewIfNeeded()
        await expect(link).toBeInViewport()
        const box = await link.boundingBox()
        expect(box!.height).toBeGreaterThanOrEqual(44)
        expect(box!.width).toBeGreaterThanOrEqual(44)
        const href = await link.getAttribute('href')
        expect(href).toMatch(/^https:\/\//)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    })
  }
}
