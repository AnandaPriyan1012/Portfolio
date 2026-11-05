import { test, expect, type Page } from '@playwright/test'

const chapters = [
  { id: 'cirs', label: 'CIRS' }, { id: 'community', label: 'Vallalar' }, { id: 'accuflow', label: 'AccuFlow' },
] as const
type Chapter = typeof chapters[number]
type Departure = { top: number; hash: string; view: string | null; trusted: boolean }
declare global { interface Window { __workRailDeparture?: Departure } }
const rail = (page: Page) => page.locator('.work-chapter-rail')
const nav = (page: Page) => rail(page).locator('nav')
const link = (page: Page, chapter: Chapter) => nav(page).getByRole('link', { name: chapter.label, exact: true })
const notes = (page: Page) => page.locator('#accuflow').getByRole('link', { name: 'Project notes', exact: true })

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
async function loaded(page: Page) {
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family)))
    .toEqual(expect.arrayContaining(['Syne Variable', 'Instrument Sans Variable']))
}
async function work(page: Page) { await page.goto('/work'); await loaded(page) }
async function wheelTo(page: Page, wanted: number) {
  const target = await page.evaluate(wanted => Math.max(0, Math.min(wanted, document.documentElement.scrollHeight - innerHeight)), wanted)
  await page.mouse.move(2, 400)
  await page.mouse.wheel(0, target - await page.evaluate(() => scrollY))
  await expect.poll(() => page.evaluate(target => Math.abs(scrollY - target), target)).toBeLessThan(4)
}
async function scrollSettled(page: Page) {
  let previous = await page.evaluate(() => scrollY), stable = 0
  await expect.poll(async () => {
    const next = await page.evaluate(() => scrollY)
    stable = Math.abs(next - previous) < .5 ? stable + 1 : 0
    previous = next
    return stable
  }, { intervals: [100] }).toBeGreaterThanOrEqual(4)
}
async function show(page: Page) {
  const top = await page.locator('.work-project-index').evaluate(node => node.getBoundingClientRect().bottom + scrollY - document.querySelector('.site-header')!.getBoundingClientRect().bottom + 90)
  await wheelTo(page, top)
  await expect(rail(page)).toHaveAttribute('data-visible', 'true')
  await expect(nav(page)).not.toHaveAttribute('aria-hidden', 'true')
  await expect(nav(page)).not.toHaveAttribute('inert', '')
}
async function current(page: Page, chapter: Chapter) {
  await expect(link(page, chapter)).toHaveAttribute('aria-current', 'location')
  await expect(nav(page).locator('[aria-current="location"]')).toHaveCount(1)
}
async function aligned(page: Page, chapter: Chapter) {
  const position = () => page.locator(`#${chapter.id}`).evaluate(node => {
    const bounds = node.getBoundingClientRect(), r = document.querySelector('.work-chapter-rail')!.getBoundingClientRect()
    const header = document.querySelector('.site-header')!.getBoundingClientRect()
    return { top: bounds.top, railTop: r.top, railBottom: r.bottom, railHeight: r.height, headerBottom: header.bottom }
  })
  await expect.poll(async () => { const p = await position(); return p.top - p.railBottom }).toBeGreaterThanOrEqual(-1)
  await expect.poll(async () => { const p = await position(); return p.top - p.railBottom }).toBeLessThan(42)
  const measured = await position()
  expect(measured.railTop).toBeGreaterThanOrEqual(measured.headerBottom - 1)
  expect(measured.railHeight).toBeGreaterThanOrEqual(44)
  await current(page, chapter)
  return measured
}
async function jump(page: Page, chapter: Chapter, touch = false) {
  const origin = link(page, chapter)
  await expect(origin).toHaveAttribute('href', `#${chapter.id}`)
  await expect(origin).toBeInViewport()
  if (touch) await origin.tap()
  else { await origin.focus(); await page.keyboard.press('Enter') }
  await expect(page).toHaveURL(new RegExp(`/work#${chapter.id}$`))
  return aligned(page, chapter)
}
async function returnToDeck(page: Page, departure: Departure) {
  await expect(page).toHaveURL(/\/work#accuflow$/); await loaded(page)
  await expect(page.locator('.accu-route-deck')).toHaveAttribute('data-route', departure.view!)
  await current(page, chapters[2])
  await expect(notes(page)).toBeFocused(); await expect(notes(page)).toBeInViewport()
  expect(await notes(page).getAttribute('tabindex')).toBeNull()
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), departure.top)).toBeLessThan(4)
  await page.locator('.accu-route-deck figure img').evaluate(node => node.dispatchEvent(new Event('load')))
  await page.waitForTimeout(400)
  await expect(notes(page)).toBeFocused()
  expect(Math.abs(await page.evaluate(() => scrollY) - departure.top)).toBeLessThan(4)
}

for (const width of [1440, 390, 320]) test.describe(`${width}px Work chapter rail`, () => {
  const touch = width < 768
  test.use({ viewport: { width, height: touch ? 844 : 1000 }, isMobile: touch, hasTouch: touch,
    reducedMotion: width === 320 ? 'reduce' : 'no-preference' })

  test('native jumps expose one actual current chapter below the header and preserve keyboard continuation', async ({ page }, testInfo) => {
    await work(page)
    await expect(rail(page)).toHaveAttribute('data-visible', 'false')
    await expect(nav(page)).toHaveAttribute('aria-hidden', 'true')
    await expect(nav(page)).toHaveAttribute('inert', '')
    const initial = await page.evaluate(() => ({ length: history.length, hash: location.hash }))
    await show(page)
    expect(await page.evaluate(() => ({ length: history.length, hash: location.hash }))).toEqual(initial)
    const records = []
    for (const chapter of chapters) {
      records.push({ chapter: chapter.id, geometry: await jump(page, chapter, touch) })
      expect((await link(page, chapter).boundingBox())!.height).toBeGreaterThanOrEqual(44)
      await page.keyboard.press('Tab')
      expect(await page.locator(`#${chapter.id}`).evaluate(node => node.contains(document.activeElement))).toBe(true)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    await testInfo.attach('native-chapter-jump-geometry', { body: JSON.stringify(records, null, 2), contentType: 'application/json' })
  })

  test('reverse reading keeps the focused native node while index/end boundaries otherwise hide the rail', async ({ page }) => {
    await work(page); await show(page)
    const first = link(page, chapters[0]); await first.focus()
    const before = await page.evaluate(() => ({ hash: location.hash, length: history.length }))
    await page.mouse.move(2, 400); await page.mouse.wheel(0, -240)
    await expect.poll(() => page.locator('.work-project-index').evaluate(node =>
      node.getBoundingClientRect().bottom - document.querySelector('.site-header')!.getBoundingClientRect().bottom,
    )).toBeGreaterThan(0)
    await expect(first).toBeFocused(); await expect(rail(page)).toHaveAttribute('data-visible', 'true')
    await scrollSettled(page)
    await page.getByRole('link', { name: 'Ananda Priyan, home', exact: true }).focus()
    await expect(rail(page)).toHaveAttribute('data-visible', 'false')
    await wheelTo(page, await page.evaluate(() => document.documentElement.scrollHeight))
    await expect.poll(() => page.locator('.work-page').evaluate(node =>
      node.getBoundingClientRect().bottom - document.querySelector('.site-header')!.getBoundingClientRect().bottom -
        document.querySelector('.work-chapter-rail')!.getBoundingClientRect().height,
    )).toBeLessThanOrEqual(0)
    await expect(rail(page)).toHaveAttribute('data-visible', 'false')
    await expect(nav(page)).toHaveAttribute('inert', '')
    expect(await page.evaluate(() => ({ hash: location.hash, length: history.length }))).toEqual(before)
  })

  test('C16 manual view, source focus and Y survive explicit Back, browser Back and Forward traversals', async ({ page }, testInfo) => {
    await work(page); await show(page); await jump(page, chapters[2], touch)
    const records = []
    for (const [label, browserBack] of [['Product', false], ['How it works', true]] as const) {
      const choice = page.locator('.accu-route-deck').getByRole('button', { name: `Show AccuFlow ${label}`, exact: true })
      await choice.scrollIntoViewIfNeeded()
      if (touch) await choice.tap(); else { await choice.focus(); await page.keyboard.press('Enter') }
      const image = page.locator('.accu-route-deck figure img'); await image.scrollIntoViewIfNeeded(); await image.evaluate(node => (node as HTMLImageElement).decode())
      const origin = notes(page); await origin.scrollIntoViewIfNeeded()
      if (!touch) await origin.focus()
      await origin.evaluate(node => node.addEventListener('click', event => {
        window.__workRailDeparture = { top: scrollY, hash: location.hash, trusted: event.isTrusted,
          view: document.querySelector<HTMLElement>('.accu-route-deck')?.dataset.route ?? null }
      }, { capture: true, once: true }))
      if (touch) await origin.tap(); else await page.keyboard.press('Enter')
      const departure = await page.evaluate(() => window.__workRailDeparture!)
      expect(departure.trusted).toBe(true); expect(departure.hash).toBe('#accuflow')
      await expect(page).toHaveURL(/\/projects\/accuflow$/); await loaded(page)
      if (browserBack) await page.goBack()
      else {
        const back = page.getByRole('button', { name: 'Back to portfolio', exact: true })
        if (touch) await back.tap(); else { await back.focus(); await page.keyboard.press('Enter') }
      }
      await returnToDeck(page, departure)
      if (browserBack) {
        await page.goForward(); await expect(page).toHaveURL(/\/projects\/accuflow$/); await loaded(page)
        await expect(page.locator('h1')).toBeVisible()
        await page.goBack(); await returnToDeck(page, departure)
      }
      records.push({ label, browserBack, departure, returnedTop: await page.evaluate(() => scrollY) })
    }
    await testInfo.attach('rail-and-native-case-return-context', { body: JSON.stringify(records, null, 2), contentType: 'application/json' })
  })
})

for (const width of [390, 320]) test(`${width}px native menu makes the rail inert and returns focus without losing context`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: width === 320 ? 'reduce' : 'no-preference' })
  const page = await context.newPage()
  try {
    await work(page); await show(page); await jump(page, chapters[1], true)
    const before = await page.evaluate(() => ({ top: scrollY, url: location.href }))
    const menu = page.getByRole('button', { name: 'Open menu', exact: true })
    await menu.tap(); await expect(rail(page)).toHaveAttribute('data-visible', 'false')
    await expect(nav(page)).toHaveAttribute('inert', '')
    await page.keyboard.press('Tab')
    expect(await page.locator('#site-nav').evaluate(node => node.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(menu).toBeFocused(); await expect(rail(page)).toHaveAttribute('data-visible', 'true')
    await current(page, chapters[1])
    expect(await page.evaluate(() => location.href)).toBe(before.url)
    expect(Math.abs(await page.evaluate(() => scrollY) - before.top)).toBeLessThan(4)
    await jump(page, chapters[2], true)
  } finally { await context.close() }
})

for (const width of [1440, 390]) test(`${width}px expanded evidence remains inside its actual parent chapter range`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width, height: 1000 }, reducedMotion: width === 1440 ? 'no-preference' : 'reduce', isMobile: width < 768, hasTouch: width < 768 })
  const page = await context.newPage()
  try {
    await work(page); await show(page); await jump(page, chapters[0]); await scrollSettled(page)
    for (const chapter of chapters.slice(0, 2)) {
      const drawer = page.locator(`#${chapter.id}-evidence`), summary = drawer.locator(':scope > summary')
      await summary.scrollIntoViewIfNeeded(); await scrollSettled(page); await summary.focus(); await page.keyboard.press('Enter'); await scrollSettled(page)
      if (chapter.id === 'cirs') {
        const tab = drawer.getByRole('tab', { name: 'Parent questions', exact: true }); await tab.focus(); await page.keyboard.press('Enter')
      } else {
        const tab = drawer.getByRole('tab', { name: /Tamil/ }); await tab.focus(); await page.keyboard.press('Enter')
      }
      await scrollSettled(page)
      const image = drawer.locator('[role="tabpanel"] img').first()
      const imageTop = await image.evaluate(node => node.getBoundingClientRect().top + scrollY -
        document.querySelector('.site-header')!.getBoundingClientRect().bottom -
        document.querySelector('.work-chapter-rail')!.getBoundingClientRect().height - 24)
      await wheelTo(page, imageTop); await expect(image).toBeInViewport()
      await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true)
      await image.evaluate(node => (node as HTMLImageElement).decode())
      const before = await page.evaluate(() => ({ hash: location.hash, length: history.length }))
      await current(page, chapter)
      await page.mouse.wheel(0, 90); await current(page, chapter)
      await scrollSettled(page)
      expect(await page.evaluate(() => ({ hash: location.hash, length: history.length }))).toEqual(before)
    }
    await jump(page, chapters[2]); await aligned(page, chapters[2])
  } finally { await context.close() }
})

for (const mode of ['motion-off', 'forced', 'light'] as const) test(`${mode} retains readable native chapter wayfinding`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: mode === 'forced' ? 'active' : 'none' })
  await page.addInitScript(mode => { if (mode === 'motion-off') localStorage.setItem('ap-motion', 'off'); if (mode === 'light') localStorage.setItem('ap-atelier-theme', 'light') }, mode)
  await work(page); await show(page)
  await expect(nav(page).getByRole('link')).toHaveCount(3)
  await jump(page, chapters[1])
  await expect(link(page, chapters[1])).toHaveAttribute('aria-current', 'location')
  expect(await nav(page).getAttribute('aria-live')).toBeNull()
})

for (const width of [1440, 390]) test(`${width}px fresh native Work fragments clear both header and rail`, async ({ browser, baseURL }, testInfo) => {
  const context = await browser.newContext({ baseURL, viewport: { width, height: width === 1440 ? 1000 : 844 }, reducedMotion: 'reduce', isMobile: width < 768, hasTouch: width < 768 })
  const page = await context.newPage(), records = []
  try {
    for (const chapter of chapters) {
      await page.goto(`/work#${chapter.id}`); await loaded(page)
      await expect(rail(page)).toHaveAttribute('data-visible', 'true')
      records.push({ chapter: chapter.id, geometry: await aligned(page, chapter) })
      await page.locator(`#${chapter.id} img`).first().evaluate(node => node.dispatchEvent(new Event('load')))
      await page.waitForTimeout(300); await aligned(page, chapter)
    }
    await testInfo.attach('fresh-native-work-fragments', { body: JSON.stringify(records, null, 2), contentType: 'application/json' })
  } finally { await context.close() }
})

for (const modifier of ['Control', 'Middle'] as const) test(`native ${modifier} chapter link opens its own Work fragment without replacing the source`, async ({ page, context }) => {
  await work(page); await show(page)
  const before = await page.evaluate(() => ({ url: location.href, top: scrollY, length: history.length }))
  const popupPromise = context.waitForEvent('page')
  await link(page, chapters[1]).click(modifier === 'Middle' ? { button: 'middle' } : { modifiers: ['Control'] })
  const popup = await popupPromise
  await expect(popup).toHaveURL(/\/work#community$/); await loaded(popup); await aligned(popup, chapters[1])
  expect(await page.evaluate(() => ({ url: location.href, top: scrollY, length: history.length }))).toEqual(before)
  await popup.close()
})

test('manual C16 view and resize preserve current chapter without passive URL or history writes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await work(page); await show(page); await jump(page, chapters[2])
  const before = await page.evaluate(() => ({ url: location.href, length: history.length }))
  for (const label of ['Home', 'Product']) {
    const choice = page.locator('.accu-route-deck').getByRole('button', { name: `Show AccuFlow ${label}`, exact: true })
    await choice.scrollIntoViewIfNeeded(); await choice.focus(); await page.keyboard.press('Enter')
    const image = page.locator('.accu-route-deck figure img'); await image.scrollIntoViewIfNeeded(); await image.evaluate(node => (node as HTMLImageElement).decode())
    await current(page, chapters[2])
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.accu-route-deck').scrollIntoViewIfNeeded()
  await expect(page.locator('.accu-route-deck')).toHaveAttribute('data-route', 'product')
  await current(page, chapters[2])
  expect(await page.evaluate(() => ({ url: location.href, length: history.length }))).toEqual(before)
  await expect(rail(page)).toHaveAttribute('data-visible', 'true')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
