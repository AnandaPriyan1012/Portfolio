import { test, expect, type Page } from '@playwright/test'

const routes = [
  { id: 'home', label: 'Home', path: '/', alt: 'homepage' },
  { id: 'product', label: 'Product', path: '/product', alt: 'Product page' },
  { id: 'workflow', label: 'How it works', path: '/how-it-works', alt: 'How it works page' },
  { id: 'guide', label: 'Try it', path: '/try', alt: 'Guide interface' },
] as const
type Route = typeof routes[number]
type Departure = { top: number; trusted: boolean; source: string | null }
declare global { interface Window { __accuDeparture?: Departure } }
const prototype = 'https://accuflow-premium-ai.netlify.app'
const deck = (page: Page) => page.locator('.accuflow-assembly.accu-route-deck')
const control = (page: Page, route: Route) => deck(page).getByRole('button', { name: `Show AccuFlow ${route.label}`, exact: true })
const caseLink = (page: Page) => page.locator('#accuflow').getByRole('link', { name: 'Project notes', exact: true })

test.beforeEach(async ({ page, request }) => {
  if (process.env.AP_QA_EXPECTED_BUNDLE || process.env.AP_QA_EXPECTED_STYLE) {
    const html = await (await request.get('/work')).text()
    if (process.env.AP_QA_EXPECTED_BUNDLE) expect(html).toContain(process.env.AP_QA_EXPECTED_BUNDLE)
    if (process.env.AP_QA_EXPECTED_STYLE) expect(html).toContain(process.env.AP_QA_EXPECTED_STYLE)
  }
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
})
async function settled(page: Page) {
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family)))
    .toEqual(expect.arrayContaining(['Syne Variable', 'Instrument Sans Variable']))
}
async function work(page: Page) {
  await page.goto('/work'); await settled(page)
  await deck(page).scrollIntoViewIfNeeded()
  await expect(deck(page)).toHaveAttribute('data-route', 'guide')
}
async function choose(page: Page, route: Route, touch = false) {
  const button = control(page, route)
  await button.scrollIntoViewIfNeeded()
  if (touch) await button.tap()
  else { await button.focus(); await page.keyboard.press('Enter') }
  await expect(button).toBeFocused()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(deck(page).locator('button[aria-pressed="true"]')).toHaveCount(1)
  await expect(deck(page)).toHaveAttribute('data-route', route.id)
}
async function source(page: Page, route: Route, width: number) {
  const href = deck(page).locator('.accu-route-source')
  await expect(href).toHaveAttribute('href', `${prototype}${route.path}`)
  await expect(href).toHaveAttribute('target', '_blank')
  await expect(href).toHaveAttribute('rel', /noopener/)
  await expect(deck(page).locator('.accu-route-caption')).toContainText(route.label)
  await expect(deck(page).locator('.accu-route-caption time')).toHaveAttribute('datetime', '2026-11-04')
  const image = deck(page).locator('figure.feature-media img')
  await image.scrollIntoViewIfNeeded()
  await image.evaluate(node => (node as HTMLImageElement).decode())
  await image.evaluate(async node => {
    await Promise.allSettled(node.closest('picture')!.getAnimations().map(animation => animation.finished))
  })
  const mobile = width < 768 && route.id !== 'home'
  const measured = await image.evaluate(node => {
    const img = node as HTMLImageElement, bounds = img.getBoundingClientRect(), style = getComputedStyle(img)
    const picture = img.closest('picture')!.getBoundingClientRect(), frame = img.closest('figure')!.getBoundingClientRect()
    const box = (rect: DOMRect) => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom })
    return { path: new URL(img.currentSrc).pathname, alt: img.alt, natural: [img.naturalWidth, img.naturalHeight],
      fit: style.objectFit, filter: style.filter, width: bounds.width, height: bounds.height,
      layout: [Number.parseFloat(style.width), Number.parseFloat(style.height)], image: box(bounds), picture: box(picture), frame: box(frame) }
  })
  expect(measured.path).toBe(`/media/atlas-accuflow-${route.id}-${mobile ? 'mobile' : 'desktop'}.webp`)
  expect(measured.natural).toEqual([mobile ? 390 : 1440, 1000])
  expect(measured.alt).toContain(route.alt)
  expect(measured.fit).toBe('contain'); expect(measured.filter).toBe('none')
  expect(measured.layout[0] / measured.layout[1]).toBeCloseTo((mobile ? 390 : 1440) / 1000, 2)
  for (const inner of [measured.image, measured.picture]) {
    expect(inner.left).toBeGreaterThanOrEqual(measured.frame.left - 1)
    expect(inner.right).toBeLessThanOrEqual(measured.frame.right + 1)
    expect(inner.top).toBeGreaterThanOrEqual(measured.frame.top - 1)
    expect(inner.bottom).toBeLessThanOrEqual(measured.frame.bottom + 1)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  return measured
}
async function inspect(page: Page, route: Route, width: number, touch: boolean) {
  const opener = deck(page).getByRole('button', { name: `View larger capture: AccuFlow · ${route.label}`, exact: true })
  await opener.scrollIntoViewIfNeeded()
  if (touch) await opener.tap()
  else { await opener.focus(); await page.keyboard.press('Enter') }
  const dialog = page.getByRole('dialog', { name: `AccuFlow · ${route.label}`, exact: true })
  await expect(dialog).toBeVisible()
  const image = dialog.locator('img')
  await image.evaluate(node => (node as HTMLImageElement).decode())
  const format = width < 768 && route.id !== 'home' ? 'mobile' : 'desktop'
  await expect(image).toHaveAttribute('src', `/media/atlas-accuflow-${route.id}-${format}.webp`)
  if (touch) await dialog.getByRole('button', { name: 'Close capture', exact: true }).tap()
  else await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
}
async function enter(page: Page, touch: boolean) {
  const origin = caseLink(page)
  await origin.scrollIntoViewIfNeeded()
  if (!touch) await origin.focus()
  await expect(origin).toBeInViewport()
  await origin.evaluate(node => node.addEventListener('click', event => {
    window.__accuDeparture = { top: scrollY, trusted: event.isTrusted,
      source: document.querySelector('.accu-route-source')?.getAttribute('href') ?? null }
  }, { capture: true, once: true }))
  if (touch) await origin.tap(); else await page.keyboard.press('Enter')
  const departure = await page.evaluate(() => window.__accuDeparture!)
  expect(departure.trusted).toBe(true)
  await expect(page).toHaveURL(/\/projects\/accuflow$/)
  await settled(page); await expect(page.locator('h1')).toBeFocused()
  return departure
}
async function returned(page: Page, route: Route, departure: Departure) {
  await expect(page).toHaveURL(/\/work$/); await settled(page)
  await expect(deck(page)).toHaveAttribute('data-route', route.id)
  await expect(control(page, route)).toHaveAttribute('aria-pressed', 'true')
  await expect(deck(page).locator('.accu-route-source')).toHaveAttribute('href', departure.source!)
  await expect(caseLink(page)).toBeFocused(); await expect(caseLink(page)).toBeInViewport()
  expect(await caseLink(page).getAttribute('tabindex')).toBeNull()
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), departure.top)).toBeLessThan(4)
  await deck(page).locator('figure img').evaluate(node => node.dispatchEvent(new Event('load')))
  await page.waitForTimeout(500)
  await expect(caseLink(page)).toBeFocused()
  expect(Math.abs(await page.evaluate(() => scrollY) - departure.top)).toBeLessThan(4)
}

for (const width of [1440, 390, 320]) test.describe(`${width}px native AccuFlow route deck`, () => {
  const touch = width < 768
  test.use({ viewport: { width, height: touch ? 844 : 1000 }, isMobile: touch, hasTouch: touch,
    reducedMotion: width === 320 ? 'reduce' : 'no-preference' })

  test('all four deliberate routes expose the matching genuine source and exact larger capture', async ({ page }, testInfo) => {
    await work(page)
    await expect(deck(page).locator('.flow-interface-map > li')).toHaveCount(4)
    const figure = deck(page).locator('figure.feature-media')
    expect(await figure.evaluate(node => node.matches('button,a,[role="button"],[tabindex]'))).toBe(false)
    await expect(figure.getByRole('button')).toHaveCount(0)
    const records = []
    for (const route of routes) {
      await choose(page, route, touch)
      expect((await control(page, route).boundingBox())!.height).toBeGreaterThanOrEqual(44)
      records.push({ route: route.id, image: await source(page, route, width) })
      await inspect(page, route, width, touch)
      await expect(deck(page)).toHaveAttribute('data-route', route.id)
    }
    for (const route of ['business', 'about']) {
      const link = deck(page).locator(`a[href="${prototype}/${route}"]`)
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', /noopener/)
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    }
    await expect(page.locator('#accuflow-evidence')).not.toHaveAttribute('open', '')
    await expect(page.locator('#accuflow').getByRole('button', { name: 'Quick view', exact: true })).toHaveCount(1)
    await testInfo.attach('actual-route-and-inspection-sources', { body: JSON.stringify(records, null, 2), contentType: 'application/json' })
  })

  test('manual route survives explicit case Back and browser Back with native opener focus and exact Y', async ({ page }, testInfo) => {
    await work(page)
    const records = []
    for (const [route, browserBack] of [[routes[1], false], [routes[2], true]] as const) {
      await choose(page, route, touch); await source(page, route, width)
      const departure = await enter(page, touch)
      if (browserBack) await page.goBack()
      else {
        const back = page.getByRole('button', { name: 'Back to portfolio', exact: true })
        if (touch) await back.tap(); else { await back.focus(); await page.keyboard.press('Enter') }
      }
      await returned(page, route, departure)
      records.push({ route: route.id, browserBack, departure, returnedTop: await page.evaluate(() => scrollY) })
    }
    await testInfo.attach('native-manual-route-case-returns', { body: JSON.stringify(records, null, 2), contentType: 'application/json' })
  })
})

test('hover, focus and wheel input do not select a route or transform its native controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await work(page)
  await choose(page, routes[1]); await source(page, routes[1], 1440)
  await control(page, routes[0]).scrollIntoViewIfNeeded(); await control(page, routes[0]).focus()
  for (const route of routes.slice(1)) {
    await page.keyboard.press('Tab')
    await expect(control(page, route)).toBeFocused()
    await expect(deck(page)).toHaveAttribute('data-route', 'product')
  }
  await page.keyboard.press('Tab')
  await expect(deck(page).locator('.accu-route-source')).toBeFocused()
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab')
  const other = control(page, routes[2])
  await expect(other).toBeFocused()
  await other.scrollIntoViewIfNeeded(); await other.hover(); await other.focus()
  await page.mouse.move(4, 450); await page.mouse.wheel(0, 180)
  await expect(other).toBeFocused()
  await expect(deck(page)).toHaveAttribute('data-route', 'product')
  await expect(control(page, routes[1])).toHaveAttribute('aria-pressed', 'true')
  const transforms = await deck(page).locator('.flow-interface-map > li').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).transform))
  expect(transforms.every(value => value === 'none' || value === 'matrix(1, 0, 0, 1, 0, 0)')).toBe(true)
})

for (const mode of ['reduced', 'motion-off', 'forced', 'tablet'] as const) test(`${mode} preserves native choices and legible contained sources`, async ({ browser, baseURL }) => {
  const width = mode === 'tablet' ? 768 : 1440
  const context = await browser.newContext({ baseURL, viewport: { width, height: 1000 },
    reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference', forcedColors: mode === 'forced' ? 'active' : 'none',
    isMobile: mode === 'tablet', hasTouch: mode === 'tablet' })
  await context.addInitScript(off => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
    if (off) localStorage.setItem('ap-motion', 'off')
  }, mode === 'motion-off')
  const page = await context.newPage()
  try {
    await work(page); await choose(page, routes[2], mode === 'tablet')
    const measured = await source(page, routes[2], width)
    expect(measured.width).toBeGreaterThan(500)
    if (mode !== 'tablet') expect(await deck(page).locator('.project-media-picture').evaluate(node => getComputedStyle(node).animationName)).toBe('none')
    await inspect(page, routes[2], width, mode === 'tablet')
  } finally { await context.close() }
})

test('a focused manual route remains stable through reduced-motion changes in both directions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await work(page)
  await choose(page, routes[1]); await source(page, routes[1], 1440)
  await control(page, routes[1]).scrollIntoViewIfNeeded(); await control(page, routes[1]).focus()
  for (const motion of ['reduce', 'no-preference'] as const) {
    await page.emulateMedia({ reducedMotion: motion })
    await expect(control(page, routes[1])).toBeFocused()
    await expect(deck(page)).toHaveAttribute('data-route', 'product')
    await expect(deck(page).locator('.accu-route-source')).toHaveAttribute('href', `${prototype}/product`)
  }
})

for (const width of [1440, 390]) test(`${width}px a failed selected image keeps its source and other choices usable`, async ({ browser, baseURL }) => {
  const touch = width < 768, failed = touch ? routes[1] : routes[3]
  const context = await browser.newContext({ baseURL, viewport: { width, height: 1000 }, reducedMotion: 'reduce', isMobile: touch, hasTouch: touch })
  const page = await context.newPage()
  await page.route(new RegExp(`/media/atlas-accuflow-${failed.id}-${touch ? 'mobile' : 'desktop'}\\.webp$`), route => route.abort())
  try {
    await work(page)
    if (touch) await choose(page, failed, true)
    await expect(deck(page).locator('.accu-route-unavailable')).toContainText(`The ${failed.label} capture could not load.`)
    await expect(deck(page)).toHaveAttribute('data-route', failed.id)
    await expect(deck(page).locator('.accu-route-source')).toHaveAttribute('href', `${prototype}${failed.path}`)
    await expect(caseLink(page)).toHaveAttribute('href', '/projects/accuflow')
    await expect(deck(page).getByRole('button', { name: `View larger capture: AccuFlow · ${failed.label}`, exact: true })).toHaveCount(0)
    await choose(page, routes[0], touch); await source(page, routes[0], width)
    await inspect(page, routes[0], width, touch)
  } finally { await context.close() }
})

test('the optional four-view Atlas remains an independent native details exploration', async ({ page }) => {
  await work(page); await choose(page, routes[1])
  const drawer = page.locator('#accuflow-evidence'), summary = drawer.locator(':scope > summary')
  await expect(drawer).not.toHaveAttribute('open', '')
  await summary.scrollIntoViewIfNeeded(); await summary.focus(); await page.keyboard.press('Enter')
  const atlas = drawer.locator('.interface-atlas[data-project="accuflow"]')
  await expect(atlas.getByRole('tab')).toHaveCount(4)
  await atlas.getByRole('tab').first().focus(); await page.keyboard.press('End')
  await expect(atlas.getByRole('tab', { name: 'The guide', exact: true })).toBeFocused()
  await expect(deck(page)).toHaveAttribute('data-route', 'product')
  await summary.focus(); await page.keyboard.press('Space')
  await expect(drawer).not.toHaveAttribute('open', '')
  await expect(summary).toBeFocused()
})
