import { test, expect, type Page, type BrowserContext } from '@playwright/test'

const errors = new WeakMap<Page, string[]>()
declare global {
  interface Window {
    __deskDeparture?: { top: number; trusted: boolean }
    __deskModified?: { trusted: boolean; preventedBeforeHarness: boolean; href: string | null }
  }
}
const destinations = ['/projects/cirs', '/projects/community', '/projects/accuflow', '/studio', '/about#contact']
const objects: readonly { selector: string; path: string; token?: string; hit: readonly [number, number]; excluded: readonly [number, number] }[] = [
  { selector: '.desk-cirs', path: '/projects/cirs', token: 'desk-cirs', hit: [730, 330], excluded: [1180, 200] },
  { selector: '.desk-vallalar', path: '/projects/community', token: 'desk-community', hit: [200, 610], excluded: [360, 575] },
  { selector: '.desk-accuflow', path: '/projects/accuflow', token: 'desk-accuflow', hit: [1430, 440], excluded: [1205, 295] },
  { selector: '.desk-films', path: '/studio', hit: [200, 755], excluded: [575, 692] },
  { selector: '.desk-contact', path: '/about#contact', hit: [1320, 765], excluded: [1460, 714] },
]
// Physical surface coordinates in the selected 1672 × 941 illustration.
// These are independent endpoint checks, not a duplicate projection algorithm.
const planes = {
  cirs: { width: 1600, height: 1000, quad: [[396, 135], [1054, 133], [1065, 502], [413, 538]] },
  community: { width: 600, height: 400, quad: [[60, 563], [274, 549], [368, 636], [90, 657]] },
  accuflow: { width: 1440, height: 1000, quad: [[1272, 310], [1606, 329], [1564, 568], [1218, 537]] },
  signature: { width: 600, height: 350, quad: [[1192, 741], [1409, 717], [1455, 782], [1234, 809]] },
}

function monitor(page: Page) {
  if (errors.has(page)) return
  const found: string[] = []
  errors.set(page, found)
  page.on('pageerror', error => found.push(error.message))
}
test.use({ reducedMotion: 'no-preference' })
test.beforeEach(async ({ page }) => monitor(page))
test.afterEach(async ({ page }) => expect(errors.get(page) || []).toEqual([]))
async function capable(context: BrowserContext) {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
}
async function entry(page: Page) {
  if (process.env.AP_EXPECT_BUNDLE) await expect(page.locator('script[type="module"]').first()).toHaveAttribute('src', `/assets/${process.env.AP_EXPECT_BUNDLE}`)
}
async function openingFinished(page: Page, mode: 'wait' | 'animated' | 'dismiss' = 'wait') {
  const stage = page.locator('.state-opening')
  if (mode === 'animated') await expect(stage).toHaveAttribute('data-mode', 'animated', { timeout: 1200 })
  if (mode === 'dismiss') await expect(stage).toHaveAttribute('data-route', new URL(page.url()).pathname, { timeout: 1200 })
  const visible = await page.evaluate(() => {
    const node = document.querySelector<HTMLElement>('.state-opening')
    if (!node) return null
    const style = getComputedStyle(node)
    return { background: style.backgroundColor, opacity: style.opacity, source: node.querySelector('mask image')?.getAttribute('href') }
  })
  if (visible) {
    expect(visible.background).toBe('rgb(0, 0, 0)')
    expect(visible.opacity).toBe('1')
    expect(visible.source).toBe('/media/ap-signature.png')
  }
  if (mode === 'dismiss') await page.keyboard.press('Escape')
  await expect(stage).toHaveCount(0, { timeout: 2100 })
  await expect(page.locator('html')).not.toHaveAttribute('data-opening', 'active')
}
async function ready(page: Page, animated = false) {
  monitor(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await openingFinished(page, animated ? 'animated' : 'wait')
  await page.evaluate(() => document.fonts.ready)
  await entry(page)
  await expect(page.locator('.scene-shell')).toHaveAttribute('data-scene-loaded', 'true')
  await expect(page.locator('.scene-surfaces')).toHaveAttribute('data-projected', 'true')
  for (const image of await page.locator('.scene-visual img').all()) await image.evaluate(node => (node as HTMLImageElement).decode())
}
async function sources(page: Page) {
  return page.locator('.scene-visual img').evaluateAll(nodes => nodes.map(node => {
    const image = node as HTMLImageElement
    return { path: new URL(image.currentSrc).pathname, natural: [image.naturalWidth, image.naturalHeight], project: image.dataset.genuineCapture || null, fit: getComputedStyle(image).objectFit }
  }))
}
async function geometry(page: Page) {
  const layout = await page.locator('.scene-shell').evaluate(node => {
    const rect = (element: Element) => {
      const r = element.getBoundingClientRect()
      return { x: r.x, y: r.y + scrollY, right: r.right, bottom: r.bottom + scrollY, width: r.width, height: r.height }
    }
    const map = node.querySelector('.scene-map')!
    return {
      viewport: innerWidth, overflow: document.documentElement.scrollWidth,
      visual: rect(node.querySelector('.scene-visual')!), map: rect(map), mapPosition: getComputedStyle(map).position,
      objects: [...map.querySelectorAll<HTMLAnchorElement>('.scene-object')].map(a => ({ href: a.getAttribute('href'), token: a.dataset.homeOrigin || null, ...rect(a), label: rect(a.querySelector('.scene-callout')!) })),
    }
  })
  expect(layout.overflow).toBeLessThanOrEqual(layout.viewport)
  for (const object of layout.objects) {
    const label = object.label
    expect(label.x).toBeGreaterThanOrEqual(-1)
    expect(label.right).toBeLessThanOrEqual(layout.viewport + 1)
    expect(label.width).toBeGreaterThanOrEqual(44)
    expect(label.height).toBeGreaterThanOrEqual(44)
  }
  for (let a = 0; a < layout.objects.length; a++) for (let b = a + 1; b < layout.objects.length; b++) {
    const first = layout.objects[a].label, second = layout.objects[b].label
    const x = Math.min(first.right, second.right) - Math.max(first.x, second.x)
    const y = Math.min(first.bottom, second.bottom) - Math.max(first.y, second.y)
    expect(x > 1 && y > 1, 'Distinct native object labels do not obscure one another').toBe(false)
  }
  return layout
}
async function projectedCorners(page: Page) {
  return page.locator('.scene-visual').evaluate((visual, definitions) => {
    const scale = visual.clientWidth / 1672
    return Object.entries(definitions).map(([name, definition]) => {
      const node = visual.querySelector<HTMLElement>(`[data-scene-plane="${name}"]`)!
      const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform)
      const local = [[0, 0], [definition.width, 0], [definition.width, definition.height], [0, definition.height]]
      const measured = local.map(([x, y]) => { const p = new DOMPoint(x, y).matrixTransform(matrix); return [p.x / p.w, p.y / p.w] })
      const expected = definition.quad.map(([x, y]) => [x * scale, y * scale])
      const error = Math.max(...measured.map(([x, y], index) => Math.hypot(x - expected[index][0], y - expected[index][1])))
      return { name, measured, expected, error, transform: getComputedStyle(node).transform }
    })
  }, planes)
}
async function nativeReadingScroll(page: Page) {
  await page.mouse.move(1000, 450)
  await page.mouse.wheel(0, 160)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(60)
}
async function nativePhoneReadingScroll(context: BrowserContext, page: Page) {
  const session = await context.newCDPSession(page)
  const point = (y: number) => ({ x: 170, y, id: 1, radiusX: 5, radiusY: 5, force: 1 })
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(650)] })
  for (const y of [625, 600, 575, 550, 525, 500, 475, 450]) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(y)] })
    await page.waitForTimeout(20)
  }
  // Pause the actual finger before release, then observe settlement before the next tap.
  await page.waitForTimeout(100)
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(60)
  await expect.poll(async () => {
    const top = await page.evaluate(() => scrollY)
    await page.waitForTimeout(80)
    return Math.abs(await page.evaluate(() => scrollY) - top)
  }).toBeLessThan(.1)
  await session.detach()
}
async function captureDeparture(page: Page, selector: string) {
  await page.locator(selector).evaluate(node => node.addEventListener('click', event => {
    window.__deskDeparture = { top: scrollY, trusted: event.isTrusted }
  }, { once: true, capture: true }))
}
async function assertReturned(page: Page, selector: string, departure: { top: number; trusted: boolean }) {
  expect(departure.trusted).toBe(true)
  await expect(page).toHaveURL(/\/$/)
  await openingFinished(page, 'dismiss')
  await expect(page.locator(selector)).toBeFocused()
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - departure.top)).toBeLessThan(4)
  const top = await page.evaluate(() => scrollY)
  await page.waitForTimeout(150)
  await expect(page.locator(selector)).toBeFocused()
  expect(Math.abs(await page.evaluate(() => scrollY) - top)).toBeLessThan(1)
  return top
}

test('one cinematic illustration contains genuine surfaces, truthful native destinations and the existing personal identity', async ({ page, context }, testInfo) => {
  await capable(context)
  const ambient: string[] = []
  page.on('request', request => { if (/\.mp4(?:[?#]|$)|atelier-room|amber-architecture|glass-corridor|screening-room-loop|ap-pixelify/.test(request.url())) ambient.push(request.url()) })
  await ready(page, true)
  await expect(page.getByRole('heading', { level: 1, name: /Web work for my school\.\s*Stories for the screen\./ })).toBeVisible()
  await expect(page.locator('.site-header[data-desk] .navigation-caption')).toHaveText('Ananda Priyan')
  await expect(page.locator('.site-header nav,.site-header .menu-button,.site-footer nav,.site-footer .wordmark')).toHaveCount(0)
  await expect(page.locator('.desk-opening')).not.toContainText('Ananda Priyan')
  await expect(page.locator('.scene-map > a')).toHaveCount(5)
  expect(await page.locator('.scene-object').evaluateAll(nodes => nodes.map(a => a.getAttribute('href')))).toEqual(destinations)
  for (const object of objects.slice(0, 3)) await expect(page.locator(`[data-home-origin="${object.token}"]`)).toHaveCount(1)
  await expect(page.locator('.desk-opening canvas,.desk-opening video,.desk-opening iframe,.desk-opening button,.hero-room,.hero-ambient-film,.pin-spacer')).toHaveCount(0)
  const images = await sources(page)
  expect(images).toEqual([
    { path: '/media/cinematic-desk-wide.webp', natural: [1672, 941], project: null, fit: 'contain' },
    { path: '/media/desk-cirs-home-1600.webp', natural: [1600, 1000], project: 'CIRS', fit: 'contain' },
    { path: '/media/vallalar-language-en-desktop.webp', natural: [1440, 500], project: 'Vallalar', fit: 'contain' },
    { path: '/media/atlas-accuflow-guide-desktop.webp', natural: [1440, 1000], project: 'AccuFlow', fit: 'contain' },
    { path: '/media/ap-signature.png', natural: [768, 512], project: null, fit: 'contain' },
  ])
  await expect(page.locator('.desk-vallalar')).toContainText('Voluntary digital work · Website preview')
  await expect(page.locator('.desk-accuflow')).toContainText('Website & guide prototype')
  await expect(page.locator('.desk-source-note')).toContainText('Original desk artwork')
  await expect(page.locator('.desk-opening')).not.toContainText(/available for work|open to work|accepting projects|process hotspot|Gaurav/i)
  const fonts = await page.evaluate(() => ({ heading: getComputedStyle(document.querySelector('#desk-title')!).fontFamily, body: getComputedStyle(document.querySelector('.scene-callout-copy')!).fontFamily, loaded: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family) }))
  expect(fonts.heading).toContain('Fraunces Variable')
  expect(fonts.body).toContain('Instrument Sans Variable')
  expect([...new Set(fonts.loaded)].sort()).toEqual(['Fraunces Variable', 'Instrument Sans Variable'])
  expect(ambient).toEqual([])
  await testInfo.attach('genuine-scene-sources', { body: JSON.stringify({ images, fonts, ambient }), contentType: 'application/json' })
})

for (const width of [320, 390, 768, 1024, 1440, 1920]) test(`${width}px scene keeps the full illustration and five readable native object labels`, async ({ browser, baseURL }, testInfo) => {
  const compact = width <= 900
  const context = await browser.newContext({ baseURL, viewport: { width, height: 1000 }, isMobile: compact, hasTouch: compact, reducedMotion: width === 320 ? 'reduce' : 'no-preference' })
  const page = await context.newPage()
  await ready(page)
  await expect(page.locator('.site-header[data-desk] .navigation-caption')).toHaveCount(1)
  await expect(page.locator('.site-header[data-desk] .navigation-caption')).toBeVisible()
  const images = await sources(page), layout = await geometry(page)
  expect(images[0].path).toBe(width <= 767 ? '/media/cinematic-desk-compact.webp' : '/media/cinematic-desk-wide.webp')
  expect(images[0].natural).toEqual(width <= 767 ? [960, 540] : [1672, 941])
  expect(images.slice(1).map(image => image.natural)).toEqual([[1600, 1000], [1440, 500], [1440, 1000], [768, 512]])
  expect(Math.abs(layout.visual.height / layout.visual.width - 941 / 1672)).toBeLessThan(.002)
  expect(layout.objects.map(object => object.href)).toEqual(destinations)
  expect(layout.mapPosition).toBe(compact ? 'static' : 'absolute')
  if (width === 1920) {
    await page.locator('.desk-work-link').focus()
    for (const object of objects) {
      await page.keyboard.press('Tab')
      await expect(page.locator(object.selector)).toBeFocused()
      const label = await page.locator(`${object.selector} .scene-callout`).boundingBox()
      expect(label, 'The focused physical object has a visible callout').not.toBeNull()
      expect(label!.y).toBeGreaterThanOrEqual(await page.locator('.site-header').evaluate(node => node.getBoundingClientRect().bottom))
      expect(label!.y + label!.height, 'Native Tab exposes the entire focused object label').toBeLessThanOrEqual(1000)
    }
  }
  if (compact) {
    expect(layout.map.y).toBeGreaterThanOrEqual(layout.visual.bottom - 1)
    for (const object of layout.objects) expect(object.height).toBeGreaterThanOrEqual(44)
    await page.locator('.desk-cirs .scene-callout').tap()
    await expect(page).toHaveURL(/\/projects\/cirs$/)
    await openingFinished(page, 'dismiss')
  }
  expect(errors.get(page)).toEqual([])
  await testInfo.attach('responsive-scene-geometry', { body: JSON.stringify({ width, images, layout }), contentType: 'application/json' })
  await context.close()
})

test('native keyboard focus and actual polygon hits agree with the five physical objects', async ({ page }, testInfo) => {
  await ready(page)
  await page.locator('.desk-work-link').focus()
  const samples = []
  for (const object of objects) {
    await page.keyboard.press('Tab')
    const anchor = page.locator(object.selector)
    await expect(anchor).toBeFocused()
    const sample = await anchor.evaluate((node, points) => {
      const visual = document.querySelector('.scene-visual')!.getBoundingClientRect(), scale = visual.width / 1672
      const hit = (point: readonly number[]) => {
        const x = visual.left + point[0] * scale, y = visual.top + point[1] * scale
        const element = document.elementFromPoint(x, y)
        return { x, y, href: element?.closest('a')?.getAttribute('href') || null }
      }
      const label = node.querySelector<HTMLElement>('.scene-callout')!, r = label.getBoundingClientRect()
      const atLabel = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return { inside: hit(points.hit), excluded: hit(points.excluded), labelHit: atLabel?.closest('a')?.getAttribute('href'), outline: parseFloat(getComputedStyle(label).outlineWidth), label: r.toJSON(), headerBottom: document.querySelector('.site-header')!.getBoundingClientRect().bottom, viewport: innerHeight }
    }, { hit: object.hit, excluded: object.excluded })
    expect(sample.inside.href).toBe(object.path)
    expect(sample.excluded.href).not.toBe(object.path)
    expect(sample.labelHit).toBe(object.path)
    expect(sample.outline).toBeGreaterThanOrEqual(2)
    expect(sample.label.top).toBeGreaterThanOrEqual(sample.headerBottom)
    expect(sample.label.bottom).toBeLessThanOrEqual(sample.viewport)
    samples.push({ selector: object.selector, ...sample })
  }
  await page.keyboard.press('Shift+Tab')
  await expect(page.locator('.desk-films')).toBeFocused()
  await testInfo.attach('native-object-hit-and-focus', { body: JSON.stringify(samples), contentType: 'application/json' })
})

test('genuine screen corners stay on the physical surfaces through real resizes and become idle', async ({ page }, testInfo) => {
  await ready(page)
  const observations = []
  for (const width of [1440, 1920, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect.poll(async () => Math.max(...(await projectedCorners(page)).map(result => result.error))).toBeLessThan(.3)
    observations.push({ width, corners: await projectedCorners(page) })
  }
  const idle = await page.locator('.scene-surfaces').evaluate(async node => {
    await new Promise(resolve => setTimeout(resolve, 150))
    let mutations = 0
    const observer = new MutationObserver(records => mutations += records.length)
    observer.observe(node, { attributes: true, subtree: true, attributeFilter: ['style', 'data-projected'] })
    await new Promise(resolve => setTimeout(resolve, 400))
    observer.disconnect()
    return mutations
  })
  expect(idle).toBe(0)
  await expect(page).toHaveURL(/\/$/)
  await testInfo.attach('projected-corners-and-idle', { body: JSON.stringify({ observations, idle }), contentType: 'application/json' })
})

test('all three project objects return to the exact native origin and actual departure position', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 844 })
  const results = []
  for (const object of objects.slice(0, 3)) {
    await ready(page)
    await nativeReadingScroll(page)
    await page.locator(`${object.selector} .scene-callout`).scrollIntoViewIfNeeded()
    await page.locator(object.selector).focus()
    await captureDeparture(page, object.selector)
    await page.keyboard.press('Enter')
    const departure = await page.evaluate(() => window.__deskDeparture!)
    expect(departure.top).toBeGreaterThan(40)
    await expect(page).toHaveURL(new RegExp(`${object.path}$`))
    await openingFinished(page, 'dismiss')
    await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
    const returned = await assertReturned(page, object.selector, departure)
    results.push({ selector: object.selector, departure, returned })
  }
  await testInfo.attach('three-native-scene-origins', { body: JSON.stringify(results), contentType: 'application/json' })
})

test('phone object taps preserve each case origin and browser history returns to the same readable index', async ({ browser, browserName, baseURL }, testInfo) => {
  test.skip(browserName !== 'chromium', 'This native pan uses Chromium CDP touch emulation, not a physical-device claim.')
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await context.newPage(), results = []
  for (const object of objects.slice(0, 3)) {
    await ready(page)
    await nativePhoneReadingScroll(context, page)
    const label = page.locator(`${object.selector} .scene-callout`)
    await label.scrollIntoViewIfNeeded()
    await captureDeparture(page, object.selector)
    await label.tap()
    const departure = await page.evaluate(() => window.__deskDeparture!)
    expect(departure.top).toBeGreaterThan(40)
    await expect(page).toHaveURL(new RegExp(`${object.path}$`))
    await openingFinished(page, 'dismiss')
    if (object.selector === '.desk-accuflow') await page.goBack()
    else await page.getByRole('button', { name: 'Back to portfolio', exact: true }).tap()
    const returned = await assertReturned(page, object.selector, departure)
    results.push({ selector: object.selector, departure, returned })
  }
  expect(errors.get(page)).toEqual([])
  await testInfo.attach('phone-native-scene-origins', { body: JSON.stringify(results), contentType: 'application/json' })
  await context.close()
})

test('film and contact objects retain native modifiers, actual destinations and source history', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 844 })
  await ready(page)
  await nativeReadingScroll(page)
  const film = page.locator('.desk-films .scene-callout')
  await film.scrollIntoViewIfNeeded()
  // Observe component handling, then cancel only browser popup default.
  // This is not a claim about native popup transport in this environment.
  await page.evaluate(() => {
    const listen = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest('.desk-films')
      if (!event.ctrlKey || !anchor) return
      window.__deskModified = { trusted: event.isTrusted, preventedBeforeHarness: event.defaultPrevented, href: anchor.getAttribute('href') }
      event.preventDefault()
      document.removeEventListener('click', listen)
    }
    document.addEventListener('click', listen)
  })
  await film.click({ modifiers: ['Control'] })
  const modified = await page.evaluate(() => window.__deskModified!)
  expect(modified).toEqual({ trusted: true, preventedBeforeHarness: false, href: '/studio' })
  await expect(page).toHaveURL(/\/$/)
  const returns = []
  for (const object of objects.slice(3)) {
    await page.locator(`${object.selector} .scene-callout`).scrollIntoViewIfNeeded()
    await page.locator(object.selector).focus()
    await captureDeparture(page, object.selector)
    await page.keyboard.press('Enter')
    const departure = await page.evaluate(() => window.__deskDeparture!)
    expect(departure.top).toBeGreaterThan(40)
    await expect(page).toHaveURL(new RegExp(`${object.path}$`))
    await openingFinished(page, 'dismiss')
    if (object.path === '/studio') await expect(page.getByRole('heading', { level: 1 })).toHaveText(/The screening\s+room\./)
    else await expect(page.locator('#contact h2')).toBeInViewport()
    await expect(page.locator('#studio video,#studio iframe')).toHaveCount(0)
    await page.goBack()
    const returned = await assertReturned(page, object.selector, departure)
    returns.push({ selector: object.selector, departure, returned })
  }
  await testInfo.attach('scene-destination-history', { body: JSON.stringify({ modified, returns }), contentType: 'application/json' })
})

test('controlled capture and artwork failures stay honest and never block the five project destinations', async ({ page }, testInfo) => {
  await page.route('**/desk-cirs-home-1600.webp', route => route.abort())
  await page.goto('/')
  await openingFinished(page)
  await entry(page)
  await expect(page.locator('[data-scene-plane="cirs"] .scene-capture-unavailable')).toContainText('CIRS capture unavailable.')
  await expect(page.locator('.scene-object')).toHaveCount(5)
  await page.locator('.desk-cirs .scene-callout').click()
  await expect(page).toHaveURL(/\/projects\/cirs$/)
  await openingFinished(page, 'dismiss')
  await page.unroute('**/desk-cirs-home-1600.webp')
  await page.route('**/cinematic-desk-*.webp', route => route.abort())
  const fallbackLayouts = []
  for (const width of [1440, 1024]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    await openingFinished(page)
    await entry(page)
    await expect(page.locator('.scene-art-unavailable')).toHaveText('The desk artwork could not load. All project links are available below.')
    await expect(page.locator('.scene-surfaces')).toHaveCount(0)
    const layout = await geometry(page)
    expect(layout.mapPosition).toBe('static')
    expect(layout.objects.map(object => object.href)).toEqual(destinations)
    expect(await page.locator('.desk-vallalar .scene-callout').evaluate(node => getComputedStyle(node).transform)).toBe('none')
    fallbackLayouts.push({ width, layout })
  }
  await page.locator('.desk-films .scene-callout').click()
  await expect(page).toHaveURL(/\/studio$/)
  await openingFinished(page, 'dismiss')
  await testInfo.attach('controlled-scene-failure', { body: JSON.stringify({ injected: ['desk-cirs-home-1600.webp aborted', 'cinematic-desk-*.webp aborted'], fallbackLayouts }), contentType: 'application/json' })
})

test('quiet modes retain the full scene, native keyboard links and fixed-camera behavior', async ({ browser, baseURL }, testInfo) => {
  const modes = []
  for (const mode of ['reduced', 'forced', 'off', 'save-data'] as const) {
    const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 }, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference', forcedColors: mode === 'forced' ? 'active' : 'none' })
    if (mode === 'off') await context.addInitScript(() => localStorage.setItem('ap-motion', 'off'))
    if (mode === 'save-data') await context.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }))
    const page = await context.newPage()
    await ready(page)
    await expect(page.locator('.scene-object')).toHaveCount(5)
    await expect(page.locator('.desk-opening canvas,.desk-opening video,.pin-spacer,.hero-ambient-film,.glass-arrow-cursor')).toHaveCount(0)
    await page.locator('.desk-work-link').focus()
    await page.keyboard.press('Tab')
    await expect(page.locator('.desk-cirs')).toBeFocused()
    expect(await page.locator('.desk-cirs .scene-callout').evaluate(node => parseFloat(getComputedStyle(node).outlineWidth))).toBeGreaterThanOrEqual(2)
    const before = await projectedCorners(page)
    await page.mouse.move(800, 350)
    await page.mouse.wheel(0, 240)
    await expect(page).toHaveURL(/\/$/)
    const after = await projectedCorners(page)
    expect(after.map(plane => plane.transform)).toEqual(before.map(plane => plane.transform))
    expect(errors.get(page)).toEqual([])
    modes.push({ mode, corners: after })
    await context.close()
  }
  await testInfo.attach('quiet-fixed-camera-scene', { body: JSON.stringify(modes), contentType: 'application/json' })
})
