import { test as base, expect, type Page } from '@playwright/test'

type OpeningRecord = {
  route: string
  mode: string
  openedAt: number
  closedAt: number | null
  background: string
  opacity: string
  display: string
  cornersCovered: boolean
  runningAnimations: number
  blackThroughout: boolean
  source: string | null
  strokeMax: number
  strokeMin: number
  paneOpacityMin: number
  paneFractionalFrames: number
  blackSamples: number
}
declare global {
  interface Window { __routeOpeningProbe: { records: OpeningRecord[] } }
}

const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await use()
    expect(errors, 'Page openings must not produce uncaught browser errors').toEqual([])
  }, { auto: true }],
})

async function boot(page: Page, path = '/', options: {
  motion?: 'on' | 'off'
  reducedMotion?: 'reduce' | 'no-preference'
  saveData?: boolean
  cores?: number
  forcedColors?: 'active' | 'none'
} = {}) {
  await page.emulateMedia({ reducedMotion: options.reducedMotion ?? 'no-preference', forcedColors: options.forcedColors ?? 'none' })
  await page.addInitScript(({ motion, saveData, cores }) => {
    // Deliberately mark the old intro as seen: user requested every pathname.
    sessionStorage.setItem('ap-atelier-loader-v4', 'seen')
    localStorage.setItem('ap-motion', motion)
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => cores, configurable: true })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true })
    Object.defineProperty(navigator, 'connection', {
      get: () => ({ saveData, addEventListener() {}, removeEventListener() {} }), configurable: true,
    })
    window.__routeOpeningProbe = { records: [] }
    let previous: Element | null = null
    let previousRoute = ''
    let previousMode = ''
    const snapshot = () => {
      const opening = document.querySelector('.state-opening')
      const records = window.__routeOpeningProbe.records
      const route = opening?.getAttribute('data-route') ?? ''
      const mode = opening?.getAttribute('data-mode') ?? ''
      if (opening === previous && route === previousRoute && mode === previousMode) return
      if (records.length && records[records.length - 1].closedAt === null) records[records.length - 1].closedAt = performance.now()
      previous = opening
      previousRoute = route
      previousMode = mode
      if (!opening || !route || !mode) return
      const style = getComputedStyle(opening)
      const points = [[2, 2], [innerWidth - 2, 2], [2, innerHeight - 2], [innerWidth - 2, innerHeight - 2], [100, 25]]
      const record: OpeningRecord = {
        route, mode, openedAt: performance.now(), closedAt: null,
        background: style.backgroundColor, opacity: style.opacity, display: style.display,
        cornersCovered: points.every(([x, y]) => opening.contains(document.elementFromPoint(x, y))),
        runningAnimations: opening.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length,
        blackThroughout: true,
        source: opening.querySelector('mask image')?.getAttribute('href') ?? null,
        strokeMax: 0,
        strokeMin: 1, paneOpacityMin: 1, paneFractionalFrames: 0, blackSamples: 0,
      }
      records.push(record)
      const sample = () => {
        if (!opening.isConnected || record.closedAt !== null) return
        const frame = getComputedStyle(opening)
        record.blackSamples++
        const pane = opening.querySelector('.state-opening-pane')
        if (pane) {
          const opacity = Number(getComputedStyle(pane).opacity)
          record.paneOpacityMin = Math.min(record.paneOpacityMin, opacity)
          if (opacity > 0 && opacity < .99) record.paneFractionalFrames++
        }
        if (frame.backgroundColor !== 'rgb(0, 0, 0)' || frame.opacity !== '1') record.blackThroughout = false
        const stroke = opening.querySelector('.state-signature-ascender')
        if (stroke) {
          const offset = parseFloat(getComputedStyle(stroke).strokeDashoffset)
          record.strokeMax = Math.max(record.strokeMax, offset)
          record.strokeMin = Math.min(record.strokeMin, offset)
        }
        requestAnimationFrame(sample)
      }
      sample()
    }
    new MutationObserver(snapshot).observe(document, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ['data-route', 'data-mode', 'data-opening'],
    })
    snapshot()
  }, { motion: options.motion ?? 'on', saveData: options.saveData ?? false, cores: options.cores ?? 8 })
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  if (process.env.AP_EXPECT_BUNDLE) await expect(page.locator('script[type="module"]').first()).toHaveAttribute('src', `/assets/${process.env.AP_EXPECT_BUNDLE}`)
}

const opening = (page: Page) => page.locator('.state-opening')
const skip = (page: Page) => opening(page).getByRole('button', { name: /skip/i })

async function expectOpening(page: Page, pathname: string) {
  // One browser observation avoids spending most of a short stage on several
  // protocol round-trips; all visible black/route conditions stay mandatory.
  await expect.poll(() => page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('.state-opening')
    if (!stage) return null
    const style = getComputedStyle(stage), box = stage.getBoundingClientRect()
    return { path: stage.dataset.route, active: document.documentElement.dataset.opening,
      background: style.backgroundColor, opacity: style.opacity,
      visible: style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0 }
  })).toEqual({ path: pathname, active: 'active', background: 'rgb(0, 0, 0)', opacity: '1', visible: true })
}

async function dismiss(page: Page) {
  if (await opening(page).count()) await page.keyboard.press('Escape')
  await expect(opening(page)).toHaveCount(0)
  await expect(page.locator('html')).not.toHaveAttribute('data-opening', 'active')
}

async function records(page: Page) {
  return page.evaluate(() => window.__routeOpeningProbe.records)
}

async function expectOpaqueTopLayerCoverage(page: Page) {
  await expect(opening(page)).toHaveCSS('background-color', 'rgb(0, 0, 0)')
  await expect(opening(page)).toHaveCSS('opacity', '1')
  expect(await opening(page).evaluate(node => [
    [2, 2], [innerWidth - 2, 2], [2, innerHeight - 2], [innerWidth - 2, innerHeight - 2],
    [innerWidth / 2, innerHeight / 2], [100, 25],
  ].every(([x, y]) => node.contains(document.elementFromPoint(x, y)))), 'The black opening must cover the viewport, including the native-dialog centre').toBe(true)
}

test('each main pathname replays on clicks, Back/Forward and reload despite the old seen-session flag', async ({ page }) => {
  await boot(page)
  await expectOpening(page, '/')
  await dismiss(page)
  const navigation = page.getByRole('navigation', { name: 'Main navigation' })
  await page.locator('.desk-work-link').click()
  await expectOpening(page, '/work')
  await dismiss(page)
  await page.locator('a[href="/studio"]:visible').first().click()
  await expectOpening(page, '/studio')
  await dismiss(page)
  await navigation.getByRole('link', { name: 'About', exact: true }).click()
  await expectOpening(page, '/about')
  await dismiss(page)
  await page.goBack()
  await expectOpening(page, '/studio')
  await dismiss(page)
  await page.goForward()
  await expectOpening(page, '/about')
  await dismiss(page)
  expect((await records(page)).map(record => record.route)).toEqual(['/', '/work', '/studio', '/about', '/studio', '/about'])
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expectOpening(page, '/about')
  expect(await page.evaluate(() => sessionStorage.getItem('ap-atelier-loader-v4'))).toBe('seen')
  await dismiss(page)
})

for (const path of ['/projects/cirs', '/not-in-the-story', '/projects/not-a-project']) {
  test(`direct entry at ${path} receives the same exact-AP opening`, async ({ page }) => {
    await boot(page, path)
    await expectOpening(page, path)
    expect((await records(page)).find(record => record.route === path)?.source).toBe('/media/ap-signature.png')
    await dismiss(page)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toBeVisible()
  })
}

test('the full black stage covers corners and header, retains a native Skip pointer and never fades its backdrop', async ({ page }) => {
  await boot(page, '/about')
  await expectOpening(page, '/about')
  const coverage = await opening(page).evaluate(node => {
    const box = node.getBoundingClientRect()
    const points = [[2, 2], [innerWidth - 2, 2], [2, innerHeight - 2], [innerWidth - 2, innerHeight - 2], [100, 25]]
    return { box: box.toJSON(), width: innerWidth, height: innerHeight, covered: points.every(([x, y]) => node.contains(document.elementFromPoint(x, y))) }
  })
  expect(coverage.covered).toBe(true)
  expect(coverage.box.left).toBe(0)
  expect(coverage.box.top).toBe(0)
  expect(coverage.box.width).toBe(coverage.width)
  expect(coverage.box.height).toBe(coverage.height)
  await skip(page).hover()
  expect(await skip(page).evaluate(node => getComputedStyle(node).cursor)).not.toBe('none')
  await expect(opening(page)).toHaveCount(0, { timeout: 2100 })
  const record = (await records(page)).find(record => record.route === '/about')!
  expect(record.blackThroughout).toBe(true)
  expect(record.blackSamples).toBeGreaterThan(10)
  expect(record.paneFractionalFrames, 'Only the inner signature pane fades while the cover remains black').toBeGreaterThan(0)
  expect(record.paneOpacityMin).toBeLessThan(.99)
  await test.info().attach('opaque-cover-and-inner-fade', { body: JSON.stringify(record), contentType: 'application/json' })
})

test('the exact PNG alpha draws progressively and closes within a short bound without a media gate', async ({ page }) => {
  await boot(page)
  await expectOpening(page, '/')
  const drawing = opening(page).locator('.state-signature-drawing')
  await expect(drawing.locator('mask image')).toHaveAttribute('href', '/media/ap-signature.png')
  await expect(opening(page)).toHaveCount(0, { timeout: 2100 })
  const record = (await records(page)).find(item => item.route === '/')!
  expect(record.strokeMax).toBeGreaterThan(0)
  expect(record.strokeMin).toBeLessThan(record.strokeMax)
  expect(record.mode).toBe('animated')
  expect(record.closedAt).not.toBeNull()
  expect(record.closedAt! - record.openedAt).toBeLessThan(2050)
  await expect(page.locator('h1')).toBeVisible()
})

test('same-page Work and Contact hashes retain their anchors without replaying the opening', async ({ page }) => {
  await boot(page, '/work')
  await expectOpening(page, '/work')
  await dismiss(page)
  await page.getByRole('navigation', { name: 'Explore selected projects' }).locator('a[href="#cirs"]').click()
  await expect(page).toHaveURL(/\/work#cirs$/)
  await expect(opening(page)).toHaveCount(0)
  expect((await records(page)).map(item => item.route)).toEqual(['/work'])
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact', exact: true }).click()
  await expectOpening(page, '/about')
  await dismiss(page)
  await expect(page.locator('#contact h2')).toBeFocused()
  await expect(page.locator('#contact h2')).toBeInViewport()
  const before = (await records(page)).length
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(page).toHaveURL(/\/about#contact$/)
  await expect(opening(page)).toHaveCount(0)
  expect((await records(page)).length).toBe(before)
  await expect(page.locator('#contact h2')).toBeFocused()
})

test('Escape and keyboard Skip preserve the normal-motion About case origin and exact saved position', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 720 })
  await boot(page, '/about')
  await expectOpening(page, '/about')
  await dismiss(page)
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'static')
  const origin = page.getByRole('link', { name: 'Read the CIRS project', exact: true })
  await origin.scrollIntoViewIfNeeded()
  await origin.focus()
  const saved = await page.evaluate(() => scrollY)
  expect(saved).toBeGreaterThan(200)
  await page.keyboard.press('Enter')
  await expectOpening(page, '/projects/cirs')
  await expect(page.locator('h1')).toBeFocused()
  await dismiss(page)
  await expect(page.locator('h1')).toBeFocused()
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expectOpening(page, '/about')
  await expect(origin).toBeFocused()
  await expect.poll(() => page.evaluate(y => Math.abs(scrollY - y), saved)).toBeLessThan(4)
  await skip(page).focus()
  await page.keyboard.press('Enter')
  await expect(opening(page)).toHaveCount(0)
  await expect(origin).toBeFocused()
  await expect(origin).toBeInViewport()
  expect(await origin.getAttribute('tabindex')).toBeNull()
  await page.waitForTimeout(1100)
  expect(await page.evaluate(y => Math.abs(scrollY - y), saved)).toBeLessThan(4)
})

test('Tab dismisses the stage and preserves the native page focus order without a trap', async ({ page }) => {
  await boot(page, '/work')
  await expectOpening(page, '/work')
  await skip(page).focus()
  await page.keyboard.press('Space')
  await expect(opening(page)).toHaveCount(0)
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('.state-opening')))).toBe(false)
  await expect(page.locator('h1')).toBeInViewport()
  await page.keyboard.press('Tab')
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('BODY')
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact', exact: true }).click()
  await expectOpening(page, '/about')
  await expect(page.locator('#contact h2')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(opening(page)).toHaveCount(0)
  await expect(page.locator('#contact .contact-action')).toBeFocused()
})

test('a real desktop wheel gesture dismisses the stage immediately and scrolls the revealed page', async ({ page }) => {
  await boot(page, '/work')
  await expectOpening(page, '/work')
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'static')
  const before = await page.evaluate(() => scrollY)
  await page.mouse.move(30, 500)
  await page.mouse.wheel(0, 420)
  await expect(opening(page)).toHaveCount(0, { timeout: 500 })
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 100)
  await expect(page).toHaveURL(/\/work$/)
  await expect(page.locator('html')).not.toHaveAttribute('data-opening', 'active')
})

test('Chromium CDP touch emulation retains the stage on touchstart/tap and dismisses it for a real native pan', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'This uses Chromium CDP touch emulation, not a claim of physical-device testing.')
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await boot(page, '/work')
    await expectOpening(page, '/work')
    const cdp = await context.newCDPSession(page)
    const point = (y: number) => ({ x: 65, y, id: 1, radiusX: 5, radiusY: 5, force: 1 })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(680)] })
    await expect(opening(page)).toBeVisible()
    await expect(page).toHaveURL(/\/work$/)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(opening(page)).toBeVisible()
    await expect(page).toHaveURL(/\/work$/)
    expect(await page.evaluate(() => scrollY)).toBe(0)
    const before = await page.evaluate(() => scrollY)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(680)] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(620)] })
    await expect(opening(page)).toHaveCount(0, { timeout: 500 })
    for (const y of [550, 470, 370, 260]) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(y)] })
      await page.waitForTimeout(20)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 100)
    await expect(page).toHaveURL(/\/work$/)
    expect(errors).toEqual([])
  } finally { await context.close() }
})

test('native quick-view to full case and history Back close the dialog before the black opening covers its top layer', async ({ page }) => {
  await boot(page, '/about')
  await expectOpening(page, '/about')
  await dismiss(page)
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Work', exact: true }).click()
  await expectOpening(page, '/work')
  await dismiss(page)
  await page.locator('#cirs').getByRole('button', { name: 'Quick view', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.locator('dialog[open]')).toHaveCount(1)
  await dialog.getByRole('link', { name: 'Explore the full case study', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expectOpening(page, '/projects/cirs')
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await expectOpaqueTopLayerCoverage(page)
  await dismiss(page)
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
  await expectOpening(page, '/work')
  await dismiss(page)
  await page.locator('#cirs').getByRole('button', { name: 'Quick view', exact: true }).click()
  await expect(dialog).toBeVisible()
  await page.goBack()
  await expectOpening(page, '/projects/cirs')
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await expectOpaqueTopLayerCoverage(page)
  await dismiss(page)
})

test('phone menu changes and Back/Forward show fitting black stages while same-page Contact stays native', async ({ browser }) => {
  for (const width of [320, 390]) {
    const context = await browser.newContext({ baseURL: test.info().project.use.baseURL, viewport: { width, height: 844 }, hasTouch: true, isMobile: true })
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    try {
      await boot(page)
      await expectOpening(page, '/')
      const box = (await skip(page).boundingBox())!
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
      await skip(page).tap()
      await expect(opening(page)).toHaveCount(0)
      await page.locator('.desk-films').tap()
      await expectOpening(page, '/studio')
      const mark = (await opening(page).locator('.state-opening-mark').boundingBox())!
      expect(mark.x).toBeGreaterThanOrEqual(0)
      expect(mark.x + mark.width).toBeLessThanOrEqual(width)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      await skip(page).tap()
      await page.getByRole('button', { name: 'Open menu', exact: true }).tap()
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About', exact: true }).tap()
      await expectOpening(page, '/about')
      await skip(page).tap()
      await page.goBack()
      await expectOpening(page, '/studio')
      await skip(page).tap()
      await page.goForward()
      await expectOpening(page, '/about')
      await skip(page).tap()
      const count = (await records(page)).length
      await page.getByRole('button', { name: 'Open menu', exact: true }).tap()
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact', exact: true }).tap()
      await expect(page).toHaveURL(/\/about#contact$/)
      await expect(opening(page)).toHaveCount(0)
      expect((await records(page)).length).toBe(count)
      await expect(page.locator('#contact h2')).toBeFocused()
      await expect(page.locator('#contact h2')).toBeInViewport()
      expect(errors).toEqual([])
    } finally { await context.close() }
  }
})

for (const mode of ['reduced', 'forced-colors', 'motion-off', 'save-data', 'low-power'] as const) {
  test(`${mode} receives a brief opaque static opening instead of animation or a session bypass`, async ({ page }) => {
    // Static timing is a JavaScript budget, not a machine-load benchmark. Freeze
    // before navigation, then exercise the actual 120ms dismissal deterministically.
    await page.clock.install({ time: new Date('2026-11-04T00:00:00Z') })
    await page.clock.pauseAt(new Date('2026-11-04T00:00:10Z'))
    await boot(page, '/work', {
      reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference',
      forcedColors: mode === 'forced-colors' ? 'active' : 'none',
      motion: mode === 'motion-off' ? 'off' : 'on', saveData: mode === 'save-data', cores: mode === 'low-power' ? 2 : 8,
    })
    await expect.poll(async () => (await records(page)).some(item => item.route === '/work' && item.mode === 'static')).toBe(true)
    await page.clock.runFor(119)
    await expect(opening(page)).toBeVisible()
    await page.clock.runFor(1)
    await expect(opening(page)).toHaveCount(0, { timeout: 900 })
    const record = (await records(page)).find(item => item.route === '/work' && item.mode === 'static')!
    expect(record.background).toBe('rgb(0, 0, 0)')
    expect(record.opacity).toBe('1')
    expect(record.display).not.toBe('none')
    expect(record.cornersCovered).toBe(true)
    expect(record.runningAnimations).toBe(0)
    expect(record.closedAt).not.toBeNull()
    expect(record.closedAt! - record.openedAt).toBeLessThan(650)
    await expect(page.locator('h1')).toBeVisible()
  })
}

test('a failed or unresolved exact-logo request never holds the black opening indefinitely', async ({ page }) => {
  await page.route('**/media/ap-signature.png', route => route.abort())
  await boot(page, '/work')
  await expectOpening(page, '/work')
  await expect(opening(page).locator('.state-signature-fallback')).toHaveText('Ananda Priyan')
  await expect(opening(page)).toHaveCount(0, { timeout: 2100 })
  await expect(page.locator('h1')).toBeVisible()
  await page.unroute('**/media/ap-signature.png')
  await page.route('**/media/ap-signature.png', () => { /* Intentionally unresolved; no test media is fabricated. */ })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expectOpening(page, '/work')
  await expect(opening(page)).toHaveCount(0, { timeout: 2100 })
  await expect(page.locator('h1')).toBeVisible()
})

test('synthetic persisted-pageshow replays the BFCache event branch and invalidates an old cycle timer', async ({ page }) => {
  // This exercises the handler contract, not a claim that Chromium used BFCache.
  await boot(page, '/work')
  await expectOpening(page, '/work')
  await page.waitForTimeout(850)
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })))
  await page.waitForTimeout(850)
  await expectOpening(page, '/work')
  await dismiss(page)
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false })))
  await expect(opening(page)).toHaveCount(0)
})


test('changing to reduced motion during the drawing switches to a short opaque static opening', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-05T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-05T00:00:10Z'))
  await boot(page, '/work')
  await expectOpening(page, '/work')
  await expect(opening(page)).toHaveAttribute('data-mode', 'animated')
  await page.clock.runFor(300)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(opening(page)).toHaveAttribute('data-mode', 'static')
  await expectOpaqueTopLayerCoverage(page)
  expect(await opening(page).evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0)
  await page.clock.runFor(119)
  await expect(opening(page)).toBeVisible()
  await page.clock.runFor(1)
  await expect(opening(page)).toHaveCount(0)
  const staticRecord = (await records(page)).find(record => record.route === '/work' && record.mode === 'static')!
  expect(staticRecord.blackThroughout).toBe(true)
  expect(staticRecord.closedAt! - staticRecord.openedAt).toBeLessThan(650)
})

test('the actual Motion setting persists and changes the next route opening without a session bypass', async ({ page }) => {
  await boot(page, '/work')
  await expectOpening(page, '/work')
  await dismiss(page)
  await page.getByRole('button', { name: 'Motion on', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Motion off', exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ap-motion'))).toBe('off')
  await page.clock.install({ time: new Date('2026-11-05T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-05T00:00:10Z'))
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About', exact: true }).click()
  await expect(opening(page)).toHaveAttribute('data-mode', 'static')
  await expectOpaqueTopLayerCoverage(page)
  await page.clock.runFor(119)
  await expect(opening(page)).toBeVisible()
  await page.clock.runFor(1)
  await expect(opening(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Motion off', exact: true }).click()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ap-motion'))).toBe('on')
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Work', exact: true }).click()
  await expectOpening(page, '/work')
  await expect(opening(page)).toHaveAttribute('data-mode', 'animated')
  await dismiss(page)
})
