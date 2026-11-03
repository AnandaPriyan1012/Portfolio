import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await use()
    expect(errors, 'No uncaught browser errors during scroll acceptance').toEqual([])
  }, { auto: true }],
})

async function ready(page: Page) {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.hero-room img').evaluate(node => (node as HTMLImageElement).decode())
  await page.locator('.cirs-browser-image').evaluate(node => (node as HTMLImageElement).decode())
  expect(await page.locator('.cirs-browser-image').evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
}

async function wheelTo(page: Page, selector: string, offset = 110) {
  await page.mouse.move(5, 400)
  for (let step = 0; step < 22; step++) {
    const distance = await page.locator(selector).evaluate((node, inset) => node.getBoundingClientRect().top - inset, offset)
    if (Math.abs(distance) < 12) return
    await page.mouse.wheel(0, Math.sign(distance) * Math.min(Math.abs(distance), 650))
    await page.waitForTimeout(180)
  }
  await expect.poll(async () => Math.abs((await page.locator(selector).boundingBox())!.y - offset)).toBeLessThan(12)
}

for (const width of [320, 375, 390, 768, 1024, 1440]) test(`scroll story fits ${width}px with usable navigation and real CIRS media`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 })
  await ready(page)
  const mobile = width < 768
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'static')
  const source = await page.locator('.cirs-browser-image').evaluate(node => (node as HTMLImageElement).currentSrc)
  expect(source).toContain(mobile ? 'cirs-home-mobile.webp' : 'cirs-home-desktop.webp')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  for (const selector of ['.hero-story-copy h1', '.hero-factual-intro', '.view-work-button', '.cirs-visual-frame']) {
    const box = await page.locator(selector).boundingBox()
    expect(box!.x, `${selector} fits left edge`).toBeGreaterThanOrEqual(-1)
    expect(box!.x + box!.width, `${selector} fits right edge`).toBeLessThanOrEqual(width + 1)
  }
  const cta = page.getByRole('button', { name: 'View Work', exact: true })
  await expect(cta).toBeVisible()
  if (mobile) {
    const menu = page.getByRole('button', { name: 'Open menu', exact: true })
    await expect(menu).toContainText('Menu')
    await expect(page.locator('#site-nav')).toBeHidden()
    await expect(page.locator('header .ap-signature')).toBeVisible()
    const menuBox = await menu.boundingBox()
    expect(menuBox!.width).toBeGreaterThanOrEqual(44)
    expect(menuBox!.height).toBeGreaterThanOrEqual(44)
    await menu.click()
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('#site-nav')).toBeHidden()
  } else {
    await expect(page.getByRole('button', { name: 'Open menu', exact: true })).toBeHidden()
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
  }
  await cta.click()
  await expect.poll(async () => (await page.locator('#cirs').boundingBox())!.y).toBeLessThan(160)
  expect((await page.locator('#cirs').boundingBox())!.y).toBeGreaterThanOrEqual(0)
  await page.locator('#accuflow').getByRole('button', { name: 'Quick view', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'AccuFlow', exact: true })
  await expect(dialog).toBeVisible()
  const box = await dialog.boundingBox()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(width)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'AP OS', exact: true }).click()
  const os = page.getByRole('dialog', { name: 'AP OS', exact: true })
  await expect(os.getByRole('navigation', { name: 'Application dock' }).getByRole('button')).toHaveCount(5)
  await expect(os.getByRole('button', { name: 'Open Film', exact: true })).toHaveCount(0)
  expect(await os.evaluate(node => node.scrollWidth)).toBeLessThanOrEqual(width)
  await os.getByRole('button', { name: /Conventional view/ }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
})

test('desktop wheel scrolling expands and reverses the real CIRS scene and captures all stages', async ({ page, browserName }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page)
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'gsap-lenis')
  await expect(page.locator('.scroll-opening')).toHaveAttribute('data-progress', '0.000')
  const initial = (await page.locator('.cirs-visual-frame').boundingBox())!
  const prefix = browserName === 'chromium' ? 'refinement-regression-scroll-desktop' : `refinement-regression-scroll-${browserName}-desktop`
  await page.mouse.move(1410, 950)
  await page.screenshot({ path: `docs/${prefix}-start.png` })
  await page.mouse.wheel(0, 850)
  await expect.poll(async () => (await page.locator('.cirs-visual-frame').boundingBox())!.width).toBeGreaterThan(initial.width + 300)
  await expect.poll(async () => page.evaluate(() => scrollY)).toBeGreaterThan(830)
  const expanded = (await page.locator('.cirs-visual-frame').boundingBox())!
  expect(expanded.x).toBeLessThan(initial.x - 300)
  expect(expanded.height).toBeGreaterThan(initial.height + 70)
  await expect(page.locator('.cirs-scene-captions')).toBeVisible()
  await expect.poll(() => page.locator('.cirs-scene-captions').evaluate(node => Number(getComputedStyle(node).opacity))).toBeGreaterThan(.95)
  await page.screenshot({ path: `docs/${prefix}-middle.png` })
  await page.mouse.wheel(0, -850)
  await expect.poll(async () => page.evaluate(() => scrollY)).toBeLessThan(2)
  await expect.poll(async () => Math.abs((await page.locator('.cirs-visual-frame').boundingBox())!.width - initial.width)).toBeLessThan(2)
  await wheelTo(page, '#community')
  await expect(page.locator('#community')).toContainText('Social Media & Technology Head')
  await page.screenshot({ path: `docs/${prefix}-community.png` })
  await wheelTo(page, '#accuflow')
  await wheelTo(page, '#accuflow [data-flow-stage]:first-child', 180)
  await expect(page.locator('#accuflow [data-flow-stage]').first()).toBeVisible()
  await expect(page.locator('#accuflow')).toContainText('prototype')
  await page.screenshot({ path: `docs/${prefix}-end.png` })
  await testInfo.attach('measured-cirs-expansion', { body: JSON.stringify({ initial, expanded, verifiedAsset: 'cirs-home-desktop.webp' }, null, 2), contentType: 'application/json' })
})

test('mobile retains native scrolling and captures school, community and AccuFlow stages', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page)
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'gsap-native')
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  expect(await page.locator('.cirs-visual-frame').evaluate(node => getComputedStyle(node).position)).toBe('absolute')
  expect(await page.locator('.hero-room img').evaluate(node => (node as HTMLImageElement).currentSrc)).toContain('atelier-room-portrait.webp')
  const prefix = browserName === 'chromium' ? 'refinement-regression-scroll-mobile' : `refinement-regression-scroll-${browserName}-mobile`
  await page.screenshot({ path: `docs/${prefix}-start.png` })
  await wheelTo(page, '#community', 88)
  await page.screenshot({ path: `docs/${prefix}-middle.png` })
  await wheelTo(page, '#accuflow', 88)
  await page.screenshot({ path: `docs/${prefix}-end.png` })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test('reduced motion removes pins and expansion while retaining the actual content', async ({ page }) => {
  await ready(page)
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'static')
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  const before = (await page.locator('.cirs-visual-frame').boundingBox())!
  await page.mouse.wheel(0, 850)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(800)
  const after = (await page.locator('.cirs-visual-frame').boundingBox())!
  expect(after.width).toBe(before.width)
  expect(after.x).toBe(before.x)
  await expect(page.locator('.transition-glass')).toBeHidden()
  await expect(page.locator('#accuflow [data-flow-stage]').first()).toBeVisible()
})

test('a failed real screenshot yields a usable static fallback instead of a pinned empty scene', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.route('**/media/cirs-home-*.webp', route => route.abort())
  await page.goto('/')
  await expect(page.locator('.cirs-image-fallback')).toBeVisible()
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'static')
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Visit the official CIRS website' })).toHaveAttribute('href', 'https://cirschool.org')
})

test('direct anchors and full case-study navigation clean up scroll pins and restore a single scene', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/#community')
  await page.locator('.cirs-browser-image').evaluate(node => (node as HTMLImageElement).decode())
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'gsap-lenis')
  await expect.poll(async () => Math.abs((await page.locator('#community').boundingBox())!.y)).toBeLessThan(180)
  await page.locator('#community').getByRole('link', { name: 'Read the case study', exact: true }).click()
  await expect(page).toHaveURL(/\/projects\/community$/)
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  expect(await page.locator('html').getAttribute('class')).not.toContain('lenis-smooth')
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'gsap-lenis')
  await expect(page.locator('.pin-spacer')).toHaveCount(1)
})

async function syntheticFilms(page: Page) {
  const film = await readFile('tests/fixtures/synthetic-film.webm')
  const poster = await readFile('tests/fixtures/synthetic-poster.svg')
  await page.route('**/src/content.ts*', async route => {
    const response = await route.fetch()
    const source = await response.text()
    await route.fulfill({ response, body: `${source}\n;creativeMedia.slice(0,3).forEach((item,index)=>{item.videoUrl='/test-film.webm';item.posterUrl='/test-poster.svg';item.credits='Synthetic playback fixture — not Ananda’s work';item.caption='Synthetic test-only fixture '+index;});\n` })
  })
  await page.route('**/test-film.webm', route => route.fulfill({ status: 200, contentType: 'video/webm', body: film }))
  await page.route('**/test-poster.svg', route => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: poster }))
}

test('test-only ready film fixtures activate scroll-driven studio and an explicit muted player', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await syntheticFilms(page)
  await ready(page)
  await expect(page.locator('#studio .reel-frame')).toHaveCount(3)
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Studio', exact: true })).toBeVisible()
  await expect(page.locator('video')).toHaveCount(0)
  await wheelTo(page, '#studio', 800)
  const before = await page.locator('.studio-reel').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41)
  await page.mouse.wheel(0, 650)
  await expect.poll(() => page.locator('.studio-reel').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41)).toBeLessThan(before - 30)
  await page.locator('.reel-frame').first().click()
  const player = page.locator('dialog video')
  await expect(player).toHaveAttribute('controls', '')
  await expect(page.getByRole('dialog')).toContainText('Synthetic playback fixture — not Ananda’s work')
  expect(await player.evaluate(node => (node as HTMLVideoElement).muted)).toBe(true)
  expect(await player.evaluate(node => (node as HTMLVideoElement).autoplay)).toBe(false)
  await expect.poll(() => player.evaluate(node => (node as HTMLVideoElement).readyState)).toBeGreaterThan(0)
  expect(await player.evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
  await player.evaluate(node => (node as HTMLVideoElement).play())
  await expect.poll(() => player.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeGreaterThan(0)
  expect(await player.evaluate(node => (node as HTMLVideoElement).error)).toBeNull()
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await page.getByRole('button', { name: 'AP OS', exact: true }).click()
  const os = page.getByRole('dialog', { name: 'AP OS', exact: true })
  await expect(os.getByRole('navigation', { name: 'Application dock' }).getByRole('button')).toHaveCount(6)
  await expect(os.getByRole('button', { name: 'Open Film', exact: true })).toBeVisible()
})

test('test-only ready film fixtures keep a static grid on phones and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await syntheticFilms(page)
  await ready(page)
  await expect(page.locator('#studio .reel-frame')).toHaveCount(3)
  expect(await page.locator('.studio-reel').evaluate(node => getComputedStyle(node).display)).toBe('grid')
  expect(await page.locator('.studio-reel').evaluate(node => getComputedStyle(node).transform)).toBe('none')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'static')
  expect(await page.locator('.studio-reel').evaluate(node => getComputedStyle(node).transform)).toBe('none')
})

test('an actual coarse-pointer phone uses native scrolling and switches to static reduced motion', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'This check uses Chromium mobile-device emulation, not a claim of physical-device testing.')
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' })
  const phone = await context.newPage()
  const errors: string[] = []
  phone.on('pageerror', error => errors.push(error.message))
  try {
    await ready(phone)
    expect(await phone.evaluate(() => matchMedia('(hover: none) and (pointer: coarse)').matches)).toBe(true)
    await expect(phone.locator('main')).toHaveAttribute('data-scroll-engine', 'gsap-native')
    await expect(phone.locator('.pin-spacer, .glass-cursor')).toHaveCount(0)
    expect((await phone.locator('html').getAttribute('class')) ?? '').not.toContain('lenis-smooth')
    await phone.emulateMedia({ reducedMotion: 'reduce' })
    await expect(phone.locator('main')).toHaveAttribute('data-scroll-engine', 'static')
    await expect(phone.locator('.pin-spacer')).toHaveCount(0)
    expect(errors).toEqual([])
  } finally { await context.close() }
})
