import { test, expect, type Page, type Locator } from '@playwright/test'

type Departure = { top: number; href: string | null }
declare global { interface Window { __historyDeparture?: Departure } }

const variants = [
  { name: 'normal desktop', width: 1440, height: 1000, motion: 'no-preference' as const, touch: false },
  { name: '390px reduced phone', width: 390, height: 844, motion: 'reduce' as const, touch: true },
  { name: '320px reduced phone', width: 320, height: 844, motion: 'reduce' as const, touch: true },
]

async function setup(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('ap-motion', 'on')
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8, configurable: true })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true })
  })
}

async function settledRoute(page: Page, pathname: string, section: string) {
  await expect.poll(() => page.evaluate(() => location.pathname)).toBe(pathname)
  await expect(page.locator('main')).toHaveAttribute('data-page', section)
  // Natural completion: Escape/Skip would be real input and could cancel a
  // pending restoration, obscuring the behavior this regression must exercise.
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
}

async function positionOrigin(page: Page, link: Locator) {
  await link.scrollIntoViewIfNeeded()
  await link.focus()
  await page.waitForTimeout(300)
  await expect(link).toBeFocused()
  await expect(link).toBeInViewport()
  return page.evaluate(() => scrollY)
}

async function enter(page: Page, link: Locator) {
  await link.evaluate(node => node.addEventListener('click', () => {
    // Capture phase precedes App.beforeNavigate(), which removes Home's pin.
    window.__historyDeparture = { top: scrollY, href: node.getAttribute('href') }
  }, { capture: true, once: true }))
  await page.keyboard.press('Enter')
  return page.evaluate(() => window.__historyDeparture!)
}

async function restored(page: Page, origin: Locator, saved: number) {
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), saved)).toBeLessThan(4)
  await expect(origin).toBeFocused()
  await expect(origin).toBeInViewport()
  expect(await origin.getAttribute('tabindex')).toBeNull()
  await page.waitForTimeout(1200)
  expect(await page.evaluate(top => Math.abs(scrollY - top), saved)).toBeLessThan(4)
  await expect(origin).toBeFocused()
  await expect(origin).toBeInViewport()
}

for (const variant of variants) {
  test(`${variant.name}: native Back/Forward restores Home and Studio origins through Contact`, async ({ browser }) => {
    test.setTimeout(60000)
    const context = await browser.newContext({ baseURL: test.info().project.use.baseURL,
      viewport: { width: variant.width, height: variant.height }, reducedMotion: variant.motion,
      hasTouch: variant.touch, isMobile: variant.touch })
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    try {
      await setup(page)
      await page.goto('/')
      await settledRoute(page, '/', 'home')
      await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', variant.touch ? 'static' : 'gsap-lenis')
      const homeStudio = page.locator('.home-directory-pages a[href="/studio"]')
      await positionOrigin(page, homeStudio)
      const home = await enter(page, homeStudio)
      expect(home.top).toBeGreaterThan(1000)
      await settledRoute(page, '/studio', 'studio')
      const studioContact = page.locator('.screening-contact a[href="/about#contact"]')
      const studioTop = await positionOrigin(page, studioContact)
      expect(studioTop).toBeGreaterThan(1000)

      await page.goBack()
      await settledRoute(page, '/', 'home')
      await restored(page, homeStudio, home.top)
      if (!variant.touch) await expect(page.locator('.pin-spacer')).toHaveCount(1)
      await page.goForward()
      await settledRoute(page, '/studio', 'studio')
      await restored(page, studioContact, studioTop)

      const studio = await enter(page, studioContact)
      await settledRoute(page, '/about', 'about')
      await expect(page).toHaveURL(/\/about#contact$/)
      await expect(page.locator('#contact h2')).toBeFocused()
      await expect(page.locator('#contact h2')).toBeInViewport()
      await page.goBack()
      await settledRoute(page, '/studio', 'studio')
      await restored(page, studioContact, studio.top)
      await page.goForward()
      await settledRoute(page, '/about', 'about')
      await expect(page).toHaveURL(/\/about#contact$/)
      await expect(page.locator('#contact h2')).toBeFocused()
      await expect(page.locator('#contact h2')).toBeInViewport()
      await page.waitForTimeout(1200)
      await expect(page.locator('#contact h2')).toBeInViewport()
      await page.keyboard.press('Tab')
      await expect(page.locator('#contact .contact-action')).toBeFocused()
      expect(errors).toEqual([])
    } finally { await context.close() }
  })
}

test('normal desktop reload preserves its saved entry; resize and later real input do not replay an old position', async ({ page }) => {
  test.setTimeout(45000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await setup(page)
  await page.goto('/')
  await settledRoute(page, '/', 'home')
  const origin = page.locator('.home-directory-pages a[href="/studio"]')
  await positionOrigin(page, origin)
  const home = await enter(page, origin)
  await settledRoute(page, '/studio', 'studio')
  await page.goBack()
  await settledRoute(page, '/', 'home')
  await restored(page, origin, home.top)
  await page.reload()
  await settledRoute(page, '/', 'home')
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), home.top)).toBeLessThan(4)
  await page.waitForTimeout(1200)
  expect(await page.evaluate(top => Math.abs(scrollY - top), home.top)).toBeLessThan(4)
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'gsap-lenis')
  await origin.focus()
  await page.setViewportSize({ width: 1440, height: 1050 })
  await expect(origin).toBeFocused()
  await expect(origin).toBeInViewport()
  await page.waitForTimeout(300)
  const afterResize = await page.evaluate(() => scrollY)
  expect(afterResize).toBeGreaterThan(1000)
  await page.mouse.move(3, 500)
  await page.mouse.wheel(0, -220)
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - (top - 220)), afterResize)).toBeLessThan(1)
  const afterWheel = await page.evaluate(() => scrollY)
  await page.keyboard.press('PageUp')
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(afterWheel - 150)
  const afterKey = await page.evaluate(() => scrollY)
  await page.locator('.cirs-browser-image').evaluate(node => node.dispatchEvent(new Event('load')))
  await page.waitForTimeout(400)
  expect(await page.evaluate(() => scrollY)).toBeLessThan(afterWheel - 150)
  expect(Math.abs(await page.evaluate(() => scrollY) - home.top)).toBeGreaterThan(100)
  expect(afterKey).toBeGreaterThanOrEqual(0)
})

test('reload keeps an updated Forward entry and different Studio visits retain their own positions', async ({ page }) => {
  test.setTimeout(90000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await setup(page)
  await page.goto('/')
  await settledRoute(page, '/', 'home')
  const homeStudio = page.locator('.home-directory-pages a[href="/studio"]')
  await positionOrigin(page, homeStudio)
  const home = await enter(page, homeStudio)
  await settledRoute(page, '/studio', 'studio')
  const footer = page.locator('.screening-contact a[href="/about#contact"]')
  await positionOrigin(page, footer)
  const oldStudio = await enter(page, footer)
  await settledRoute(page, '/about', 'about')
  await page.goBack()
  await settledRoute(page, '/studio', 'studio')
  await restored(page, footer, oldStudio.top)

  // Change the visited Studio entry after its earlier native state was saved.
  // This updated value must survive losing App's in-memory map on reload.
  await page.mouse.move(3, 500)
  await page.mouse.wheel(0, -585)
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - (top - 585)), oldStudio.top)).toBeLessThan(1)
  const updatedStudio = await page.evaluate(() => scrollY)
  expect(oldStudio.top - updatedStudio).toBeGreaterThan(500)
  await page.goBack()
  await settledRoute(page, '/', 'home')
  await restored(page, homeStudio, home.top)
  await page.reload()
  await settledRoute(page, '/', 'home')
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), home.top)).toBeLessThan(4)
  await page.goForward()
  await settledRoute(page, '/studio', 'studio')
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), updatedStudio)).toBeLessThan(4)
  await page.waitForTimeout(1200)
  expect(await page.evaluate(top => Math.abs(scrollY - top), updatedStudio)).toBeLessThan(4)

  // A later Studio visit is a separate history entry, despite the same path.
  const navigation = page.getByRole('navigation', { name: 'Main navigation' })
  await navigation.getByRole('link', { name: 'About', exact: true }).click()
  await settledRoute(page, '/about', 'about')
  await navigation.getByRole('link', { name: 'Studio', exact: true }).click()
  await settledRoute(page, '/studio', 'studio')
  await page.mouse.move(3, 500)
  await page.mouse.wheel(0, 240)
  await expect.poll(() => page.evaluate(() => Math.abs(scrollY - 240))).toBeLessThan(1)
  const newerStudio = await page.evaluate(() => scrollY)
  await navigation.getByRole('link', { name: 'About', exact: true }).click()
  await settledRoute(page, '/about', 'about')
  await page.goBack()
  await settledRoute(page, '/studio', 'studio')
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), newerStudio)).toBeLessThan(4)
  await page.goBack()
  await settledRoute(page, '/about', 'about')
  await page.goBack()
  await settledRoute(page, '/studio', 'studio')
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), updatedStudio)).toBeLessThan(4)
  await page.waitForTimeout(1200)
  expect(await page.evaluate(top => Math.abs(scrollY - top), updatedStudio)).toBeLessThan(4)
  expect(Math.abs(updatedStudio - newerStudio)).toBeGreaterThan(300)
})

for (const motion of ['no-preference', 'reduce'] as const) {
  test(`${motion}: nonzero case reload stays exact while fresh and next case routes start at the top`, async ({ page }) => {
    test.setTimeout(45000)
    await page.emulateMedia({ reducedMotion: motion })
    await page.setViewportSize({ width: 1440, height: 1000 })
    await setup(page)
    await page.goto('/projects/cirs')
    await expect(page).toHaveURL(/\/projects\/cirs$/)
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('h1')).toContainText('CIRS Website')
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
    await expect(page.locator('h1')).toBeInViewport()

    await page.mouse.move(3, 500)
    await page.mouse.wheel(0, 1230)
    await expect.poll(() => page.evaluate(() => Math.abs(scrollY - 1230))).toBeLessThan(1)
    const saved = await page.evaluate(() => scrollY)
    expect(saved).toBeGreaterThan(1000)
    await page.reload()
    await expect(page).toHaveURL(/\/projects\/cirs$/)
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    await page.evaluate(() => document.fonts.ready)
    await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), saved)).toBeLessThan(4)
    await page.waitForTimeout(1200)
    expect(await page.evaluate(top => Math.abs(scrollY - top), saved)).toBeLessThan(4)

    // The reload position belongs to CIRS, not to the next project entry.
    const next = page.locator('a.case-next-story[href="/projects/community"]')
    await next.scrollIntoViewIfNeeded()
    await next.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/projects\/community$/)
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    await expect(page.locator('h1')).toContainText('Vallalar Sathya Dharmasalai')
    await expect(page.locator('h1')).toBeFocused()
    await expect(page.locator('h1')).toBeInViewport()
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
    await page.waitForTimeout(1200)
    expect(await page.evaluate(() => scrollY)).toBe(0)
  })
}
