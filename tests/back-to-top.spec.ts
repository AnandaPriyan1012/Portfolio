import { test, expect, type Locator, type Page } from '@playwright/test'

const routes = ['/', '/work', '/studio', '/about'] as const
const variants = [
  { width: 1440, height: 1000, touch: false, motion: 'no-preference' as const },
  { width: 390, height: 844, touch: true, motion: 'reduce' as const },
  { width: 320, height: 844, touch: true, motion: 'reduce' as const },
]
declare global { interface Window { __backTopEvents?: string[] } }

async function ready(page: Page, route: string) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
  await page.goto(route)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  const loaded = await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family))
  expect(loaded).toContain('Syne Variable')
  expect(loaded).toContain('Instrument Sans Variable')
}

async function firstPageAction(page: Page, route: string): Promise<Locator> {
  if (route === '/') {
    const filmControl = page.locator('.hero-film-toggle')
    return await filmControl.count() ? filmControl : page.getByRole('button', { name: 'View Work', exact: true })
  }
  if (route === '/work') return page.locator('.work-index-cirs')
  if (route === '/studio') return page.getByRole('button', { name: 'Play selected film: CCK trailer', exact: true })
  const signature = page.locator('.about-identity-signature button')
  return await signature.count() ? signature : page.getByRole('tab', { name: 'Builder', exact: true })
}

async function recordNavigation(page: Page) {
  return page.evaluate(() => {
    window.__backTopEvents = []
    for (const event of ['hashchange', 'popstate', 'ap:pathnamechange', 'ap:openingchange'])
      window.addEventListener(event, () => window.__backTopEvents!.push(event), { once: true })
    return { url: location.href, length: history.length, state: history.state }
  })
}

async function activate(page: Page) {
  const link = page.getByRole('link', { name: 'Back to top', exact: true })
  await expect(link).toHaveAttribute('href', '#')
  await link.focus()
  await expect(link).toBeInViewport()
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(500)
  await page.keyboard.press('Enter')
  const destination = page.locator('main:focus, main h1:focus')
  await expect(destination).toHaveCount(1)
  return destination
}

for (const variant of variants) test.describe(`${variant.width}px ${variant.motion} Back to top`, () => {
  test.use({ viewport: { width: variant.width, height: variant.height }, hasTouch: variant.touch,
    isMobile: variant.touch, reducedMotion: variant.motion })
  for (const route of routes) test(`${route} returns focus with the viewport and continues natively in both directions`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await ready(page, route)
    const before = await recordNavigation(page)
    const heading = await activate(page)
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(4)
    await expect(heading).toBeInViewport()
    await page.keyboard.press('Tab')
    const first = await firstPageAction(page, route)
    await expect(first).toBeFocused()
    await expect(first).toBeInViewport()
    await page.waitForTimeout(950)
    await expect(first).toBeFocused()
    await expect(first).toBeInViewport()

    await activate(page)
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(4)
    await page.keyboard.press('Shift+Tab')
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('.site-header')))).toBe(true)
    expect(await page.evaluate(() => scrollY)).toBeLessThan(4)
    expect(await page.evaluate(() => ({ url: location.href, length: history.length, state: history.state }))).toEqual(before)
    expect(await page.evaluate(() => window.__backTopEvents)).toEqual([])
    await expect(page.locator('.state-opening')).toHaveCount(0)
    expect(errors).toEqual([])
    await testInfo.attach('native-back-top-position-focus-history', { body: JSON.stringify({ before, position: await page.evaluate(() => scrollY), previous: await page.evaluate(() => document.activeElement?.outerHTML) }, null, 2), contentType: 'application/json' })
    if (route === '/work') await page.screenshot({ path: `/workspace/cycle-twelve-audit/accessibility/fixed-back-top-work-${variant.width}.png` })
  })
})

test.describe('normal desktop immediate keyboard continuation', () => {
  test.use({ reducedMotion: 'no-preference' })
  for (const route of routes) test(`${route} never refocuses the heading after the visitor continues`, async ({ page }) => {
    await ready(page, route)
    await activate(page)
    // Continue immediately, before any later work could reclaim focus.
    await page.keyboard.press('Tab')
    const first = await firstPageAction(page, route)
    await expect(first).toBeFocused()
    await page.waitForTimeout(1100)
    await expect(first).toBeFocused()
    await expect(first).toBeInViewport()
    expect(await first.evaluate(node => node.closest('footer'))).toBeNull()
  })
})

test.describe('normal desktop pointer return', () => {
  test.use({ reducedMotion: 'no-preference' })
  for (const route of routes) test(`${route} preserves its smooth return and meaningful native focus`, async ({ page }) => {
    await ready(page, route)
    const link = page.getByRole('link', { name: 'Back to top', exact: true })
    await link.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(500)
    await link.click()
    // A real pointer click retains the existing animated path.
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(4)
    await expect(page.locator('main:focus, main h1:focus')).toHaveCount(1)
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(4)
    await page.keyboard.press('Tab')
    const element = await page.evaluateHandle(() => document.activeElement)
    const state = await element.evaluate(node => {
      const target = node as HTMLElement, box = target.getBoundingClientRect()
      return { tag: target.tagName, inMain: Boolean(target.closest('main')), top: box.top, bottom: box.bottom }
    })
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(state.tag)
    expect(state.inMain).toBe(true)
    expect(state.top).toBeGreaterThanOrEqual(0)
    expect(state.bottom).toBeLessThanOrEqual(1001)
    await page.waitForTimeout(1100)
    expect(await element.evaluate(node => node === document.activeElement)).toBe(true)
  })
})

for (const route of ['/work', '/about'] as const) for (const method of ['modified', 'middle'] as const)
  test(`${route} keeps native ${method} Back-to-top opening`, async ({ page, context }) => {
    await ready(page, route)
    const link = page.getByRole('link', { name: 'Back to top', exact: true })
    await link.focus()
    const before = await page.evaluate(() => ({ url: location.href, length: history.length, top: scrollY }))
    const [popup] = await Promise.all([context.waitForEvent('page'), link.click(method === 'middle' ? { button: 'middle' } : { modifiers: ['ControlOrMeta'] })])
    await popup.waitForLoadState('domcontentloaded')
    await expect(popup).toHaveURL(new RegExp(`${route}#$`))
    expect(await page.evaluate(() => ({ url: location.href, length: history.length, top: scrollY }))).toEqual(before)
    await expect(link).toBeFocused()
    await popup.close()
  })

test('saved Motion off keeps the instant return and native continuation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => localStorage.setItem('ap-motion', 'off'))
  await ready(page, '/work')
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'static')
  await activate(page)
  expect(await page.evaluate(() => scrollY)).toBe(0)
  await page.keyboard.press('Tab')
  await expect(await firstPageAction(page, '/work')).toBeFocused()
})

test('an existing fragment, history entry and selected project survive the top action', async ({ page }) => {
  await ready(page, '/work#community')
  const before = await recordNavigation(page)
  await activate(page)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(4)
  await expect(page.locator('main h1')).toBeFocused()
  expect(await page.evaluate(() => ({ url: location.href, length: history.length, state: history.state }))).toEqual(before)
  expect(await page.evaluate(() => window.__backTopEvents)).toEqual([])
})
