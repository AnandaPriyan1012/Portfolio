import { test, expect, type Page } from '@playwright/test'

const projectLinks = [
  { id: 'cirs', path: '/projects/cirs', token: 'home-proof-cirs' },
  { id: 'community', path: '/projects/community', token: 'home-proof-community' },
  { id: 'accuflow', path: '/projects/accuflow', token: 'home-proof-accuflow' },
] as const
const filmLinks = [
  { id: 'vantara', title: 'Vantara', source: '/media/film-moments/vantara-0076.webp', time: '01:16' },
  { id: 'ted-ed-2026', title: 'TED-Ed auditions', source: '/media/film-moments/ted-ed-2026-0014.webp', time: '00:14' },
  { id: 'cirs-website-launch', title: 'CIRS website launch', source: '/media/film-moments/cirs-website-launch-0005.webp', time: '00:05' },
] as const
const errors = new WeakMap<Page, string[]>()
function monitor(page: Page) {
  if (errors.has(page)) return
  const found: string[] = []
  page.on('pageerror', error => found.push(error.message))
  errors.set(page, found)
}
async function openingFinished(page: Page) {
  // Destination and cleanup matter here; the quiet120ms cover may already be gone.
  await expect(page.locator('.state-opening')).toHaveCount(0, { timeout: 2300 })
  await expect(page.locator('html')).not.toHaveAttribute('data-opening', 'active')
}
async function boot(page: Page) {
  monitor(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await openingFinished(page)
  await page.evaluate(() => document.fonts.ready)
  if (process.env.AP_EXPECT_BUNDLE) await expect(page.locator('script[type="module"]').first()).toHaveAttribute('src', `/assets/${process.env.AP_EXPECT_BUNDLE}`)
  await expect(page.locator('.home-work-proof')).toBeAttached()
}
async function readableImages(page: Page) {
  const result = []
  for (const image of await page.locator('.home-work-proof img').all()) {
    // These are intentionally lazy; bring real evidence into view before decoding.
    await image.scrollIntoViewIfNeeded()
    await image.evaluate(node => (node as HTMLImageElement).decode())
    result.push(await image.evaluate(node => {
      const img = node as HTMLImageElement
      return { path: new URL(img.currentSrc).pathname, natural: [img.naturalWidth, img.naturalHeight], alt: img.alt, fit: getComputedStyle(img).objectFit }
    }))
  }
  return result
}
async function recordDeparture(page: Page, selector: string) {
  await page.locator(selector).evaluate(node => node.addEventListener('click', event => {
    ;(window as Window & { __homeProofDeparture?: { top: number; trusted: boolean } }).__homeProofDeparture = { top: scrollY, trusted: event.isTrusted }
  }, { once: true, capture: true }))
}
async function departure(page: Page) {
  const value = await page.evaluate(() => (window as Window & { __homeProofDeparture?: { top: number; trusted: boolean } }).__homeProofDeparture!)
  expect(value.trusted).toBe(true)
  expect(value.top).toBeGreaterThan(100)
  return value
}
async function returned(page: Page, selector: string, top: number) {
  await expect(page).toHaveURL(/\/$/)
  await openingFinished(page)
  await expect(page.locator(selector)).toBeFocused()
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - top)).toBeLessThan(4)
  await page.waitForTimeout(150)
  await expect(page.locator(selector)).toBeFocused()
  expect(Math.abs(await page.evaluate(() => scrollY) - top)).toBeLessThan(4)
  return await page.evaluate(() => scrollY)
}

test('the work below the desk explains real purposes and outcomes with whole authentic evidence and honest image failure', async ({ page }, testInfo) => {
  monitor(page)
  const autoplayRequests: string[] = []
  page.on('request', request => { if (/\.mp4(?:[?#]|$)/.test(request.url())) autoplayRequests.push(request.url()) })
  await boot(page)
  await expect(page.locator('.home-proof-project')).toHaveCount(3)
  await expect(page.locator('#home-work-proof-title')).toHaveText('The work behind the desk.')
  expect(await page.evaluate(() => Boolean(document.querySelector('.desk-opening')!.compareDocumentPosition(document.querySelector('.home-work-proof')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true)
  for (const project of projectLinks) {
    await expect(page.locator(`[data-home-origin="${project.token}"]`)).toHaveCount(1)
    await expect(page.locator(`[data-home-origin="${project.token}"]`)).toHaveAttribute('href', project.path)
  }
  expect(await page.locator('.home-proof-cirs dt').allTextContents()).toEqual(['Problem', 'Role', 'Outcome'])
  expect(await page.locator('.home-proof-community dt').allTextContents()).toEqual(['Problem', 'Role', 'Outcome'])
  expect(await page.locator('.home-proof-accuflow dt').allTextContents()).toEqual(['Purpose', 'Scope', 'Outcome'])
  await expect(page.locator('.home-proof-cirs')).toContainText('with the school’s team')
  await expect(page.locator('.home-proof-cirs')).toContainText('The official school website is live')
  await expect(page.locator('.home-proof-community')).toContainText('Voluntary Social Media & Technology Head since 2023')
  await expect(page.locator('.home-proof-community')).toContainText('public review preview')
  await expect(page.locator('.home-proof-accuflow')).toContainText('conversational-interface prototype')
  await expect(page.locator('.home-proof-accuflow')).toContainText('initial guide interface')
  const images = await readableImages(page)
  expect(images.map(image => ({ path: image.path, natural: image.natural, fit: image.fit }))).toEqual([
    { path: '/media/atlas-cirs-admissions-desktop.webp', natural: [1440, 1000], fit: 'contain' },
    { path: '/media/vallalar-language-en-desktop.webp', natural: [1440, 500], fit: 'contain' },
    { path: '/media/vallalar-language-ta-desktop.webp', natural: [1440, 400], fit: 'contain' },
    { path: '/media/atlas-accuflow-guide-desktop.webp', natural: [1440, 1000], fit: 'contain' },
    ...filmLinks.map(film => ({ path: film.source, natural: [480, 270], fit: 'contain' })),
  ])
  expect(images.every(image => image.alt.length > 20)).toBe(true)
  expect(images[3].alt).toMatch(/before any message has been submitted/)
  for (const film of filmLinks) {
    const link = page.locator(`.home-proof-film[href="/studio#${film.id}"]`)
    await expect(link).toHaveCount(1)
    await expect(link).toContainText(film.title)
    await expect(link).toContainText(`Frame ${film.time}`)
  }
  await expect(page.locator('.home-work-proof video,.home-work-proof iframe,.home-work-proof canvas')).toHaveCount(0)
  expect(autoplayRequests).toEqual([])
  await page.route('**/atlas-cirs-admissions-desktop.webp', route => route.abort())
  await boot(page)
  await page.locator('.home-proof-cirs figure').scrollIntoViewIfNeeded()
  await expect(page.locator('.home-proof-cirs .home-proof-unavailable')).toHaveText('CIRS Admissions image unavailable. The linked project remains available.')
  await page.locator('.home-proof-cirs .home-proof-link').click()
  await expect(page).toHaveURL(/\/projects\/cirs$/)
  await openingFinished(page)
  expect(errors.get(page)).toEqual([])
  await testInfo.attach('authentic-home-proof', { body: JSON.stringify({ images, autoplayRequests, injectedFailure: 'CIRS Admissions image request deliberately aborted' }), contentType: 'application/json' })
})

test('native project and film handoffs return to the exact below-desk source rather than the scene duplicate', async ({ browser, baseURL }, testInfo) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await context.newPage(), results = []
  await boot(page)
  for (const project of projectLinks) {
    const selector = `[data-home-origin="${project.token}"]`
    await page.locator(selector).scrollIntoViewIfNeeded()
    await page.locator(selector).focus()
    await recordDeparture(page, selector)
    await page.locator(selector).tap()
    const from = await departure(page)
    await expect(page).toHaveURL(new RegExp(`${project.path}$`))
    await openingFinished(page)
    await page.getByRole('button', { name: 'Back to portfolio', exact: true }).tap()
    results.push({ kind: project.id, departure: from, returned: await returned(page, selector, from.top) })
  }
  // One actual browser-history return independently protects duplicate native hrefs.
  const first = '[data-home-origin="home-proof-cirs"]'
  await page.locator(first).scrollIntoViewIfNeeded()
  await page.locator(first).focus()
  await recordDeparture(page, first)
  await page.keyboard.press('Enter')
  const from = await departure(page)
  await expect(page).toHaveURL(/\/projects\/cirs$/)
  await openingFinished(page)
  await page.goBack()
  results.push({ kind: 'cirs-browser-back', departure: from, returned: await returned(page, first, from.top) })
  for (const film of filmLinks) {
    const selector = `.home-proof-film[href="/studio#${film.id}"]`
    await page.locator(selector).scrollIntoViewIfNeeded()
    await page.locator(selector).focus()
    await recordDeparture(page, selector)
    await page.locator(selector).tap()
    const source = await departure(page)
    await expect(page).toHaveURL(new RegExp(`/studio#${film.id}$`))
    await openingFinished(page)
    await expect(page.getByRole('radio', { name: film.title, exact: true })).toBeChecked()
    await expect(page.locator('#studio video,#studio iframe')).toHaveCount(0)
    await page.goBack()
    results.push({ kind: film.id, departure: source, returned: await returned(page, selector, source.top) })
  }
  expect(errors.get(page)).toEqual([])
  await testInfo.attach('below-desk-native-returns', { body: JSON.stringify(results), contentType: 'application/json' })
  await context.close()
})

test('200 percent text growth keeps the expanded Home story readable and normally scrollable on narrow and landscape screens', async ({ browser, baseURL }, testInfo) => {
  const observations = []
  for (const [width, height] of [[320, 568], [844, 390]]) {
    const context = await browser.newContext({ baseURL, viewport: { width, height }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await boot(page)
    // Explicit user-style text enlargement, not a claim about browser/pinch zoom.
    await page.evaluate(() => {
      const nodes = [...document.querySelectorAll<HTMLElement>('.desk-opening h1,.desk-opening h1 > span,.desk-work-link,.scene-callout strong,.home-work-proof h2,.home-work-proof h3,.home-work-proof p,.home-work-proof dd,.home-work-proof dt,.home-work-proof a,.home-work-proof figcaption,.home-work-proof span')].map(node => ({ node, size: parseFloat(getComputedStyle(node).fontSize) }))
      for (const { node, size } of nodes) node.style.fontSize = `${size * 2}px`
    })
    const layout = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, viewportHeight: innerHeight, bodyOverflow: getComputedStyle(document.body).overflowY, rootOverflow: getComputedStyle(document.documentElement).overflowY }))
    expect(layout.width).toBeLessThanOrEqual(layout.viewport)
    expect(layout.height).toBeGreaterThan(layout.viewportHeight)
    expect(['hidden', 'clip']).not.toContain(layout.bodyOverflow)
    expect(['hidden', 'clip']).not.toContain(layout.rootOverflow)
    const copy = await page.locator('.home-proof-account h3,.home-proof-account dd,.home-proof-intro > p:last-child').evaluateAll(nodes => nodes.map(node => {
      const element = node as HTMLElement, r = element.getBoundingClientRect(), style = getComputedStyle(element)
      const range = document.createRange()
      range.selectNodeContents(element)
      const textRects = [...range.getClientRects()].map(line => ({ x: line.x, right: line.right }))
      const clippingAncestors = []
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        if (['hidden', 'clip'].includes(getComputedStyle(parent).overflowX)) {
          const bounds = parent.getBoundingClientRect()
          clippingAncestors.push({ x: bounds.x, right: bounds.right, name: parent.className || parent.tagName })
        }
      }
      return { text: element.textContent, width: element.clientWidth, scrollWidth: element.scrollWidth, x: r.x, right: r.right, height: r.height, display: style.display, visibility: style.visibility, fontSize: parseFloat(style.fontSize), overflowY: style.overflowY, textRects, clippingAncestors }
    }))
    for (const paragraph of copy) {
      expect(paragraph.height).toBeGreaterThan(0)
      expect(paragraph.display).not.toBe('none')
      expect(paragraph.visibility).toBe('visible')
      // Enlarged words may use an unoccupied margin; assert actual readability,
      // not a narrower text-column boundary that does not clip the content.
      expect(paragraph.textRects.length).toBeGreaterThan(0)
      for (const line of paragraph.textRects) {
        expect(line.x).toBeGreaterThanOrEqual(0)
        expect(line.right).toBeLessThanOrEqual(width + 1)
        for (const ancestor of paragraph.clippingAncestors) {
          expect(line.x).toBeGreaterThanOrEqual(ancestor.x - 1)
          expect(line.right).toBeLessThanOrEqual(ancestor.right + 1)
        }
      }
      expect(paragraph.x).toBeGreaterThanOrEqual(0)
      expect(paragraph.right).toBeLessThanOrEqual(width + 1)
      expect(paragraph.fontSize).toBeGreaterThanOrEqual(28)
      expect(['hidden', 'clip']).not.toContain(paragraph.overflowY)
    }
    const links = await page.locator('.home-work-proof a').all()
    await links[0].scrollIntoViewIfNeeded()
    await links[0].focus()
    for (const link of links.slice(1)) {
      await page.keyboard.press('Tab')
      await expect(link).toBeFocused()
    }
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0)
    await expect(links.at(-1)!).toBeInViewport()
    expect(errors.get(page)).toEqual([])
    observations.push({ width, height, enlargement: '200% controlled text growth', layout, copy, finalScrollY: await page.evaluate(() => scrollY) })
    await context.close()
  }
  await testInfo.attach('home-proof-text-growth', { body: JSON.stringify(observations), contentType: 'application/json' })
})
