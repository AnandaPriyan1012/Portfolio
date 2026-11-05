import { test, expect } from '@playwright/test'

test('forced colors uses the real still without fetching the decorative hero film', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'no-preference' })
  const requests: string[] = []
  page.on('request', request => {
    if (request.url().includes('/media/amber-architecture-loop.mp4')) requests.push(request.url())
  })
  await page.addInitScript(() => { Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 }); Object.defineProperty(navigator, 'deviceMemory', { value: 8 }) })
  await page.goto('/')
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(page.locator('.hero-ambient-film, .hero-film-toggle')).toHaveCount(0)
  await expect(page.locator('.hero-room img')).toBeVisible()
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.getByRole('button', { name: 'View Work', exact: true })).toBeVisible()
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'static')
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  expect(requests).toEqual([])
})

test('enabling forced colors pauses and removes a running decorative film', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' })
  await page.addInitScript(() => { Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 }); Object.defineProperty(navigator, 'deviceMemory', { value: 8 }) })
  await page.goto('/')
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  const video = page.locator('.hero-ambient-film')
  await expect(video).toHaveCount(1)
  const retained = await video.elementHandle()
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(false)
  await page.emulateMedia({ forcedColors: 'active' })
  await expect(video).toHaveCount(0)
  expect(await retained!.evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
  await expect(page.locator('.hero-room img')).toBeVisible()
  await expect(page.locator('.scroll-opening')).not.toHaveAttribute('data-hero-film', 'active')
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'static')
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
})
