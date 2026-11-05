import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await use()
    expect(errors, 'No uncaught errors in the local Atelier revision').toEqual([])
  }, { auto: true }],
})

async function ready(page: Page, path = '/') {
  await page.goto(path)
  await page.evaluate(() => document.fonts.ready)
  await page.locator('header .ap-signature').evaluate(node => (node as HTMLImageElement).decode())
  if (path === '/') {
    await page.locator('.opening-specimen-community img').evaluate(node => (node as HTMLImageElement).decode())
    await page.locator('.cirs-browser-image').first().evaluate(node => (node as HTMLImageElement).decode())
  }
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}

async function wheelTo(page: Page, selector: string, offset = 135) {
  await page.mouse.move(5, 450)
  const distanceToTarget = () => page.locator(selector).evaluate((node, inset) => {
    const desired = Math.min(document.documentElement.scrollHeight - innerHeight, Math.max(0, node.getBoundingClientRect().top + scrollY - inset))
    return desired - scrollY
  }, offset)
  for (let step = 0; step < 30; step++) {
    const distance = await distanceToTarget()
    if (Math.abs(distance) < 14) return
    await page.mouse.wheel(0, Math.sign(distance) * Math.min(Math.abs(distance), 620))
    await page.waitForTimeout(150)
  }
  await expect.poll(async () => Math.abs(await distanceToTarget())).toBeLessThan(16)
}

for (const width of [320, 375, 390, 768, 1024, 1440]) {
  test(`local glass composition fits ${width}px with an actual signature and film-strip navigation`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await ready(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    const mobile = width < 768
    const source = await page.locator('.opening-specimen-community img').evaluate(node => (node as HTMLImageElement).currentSrc)
    expect(source).toContain('vallalar-language-en-desktop.webp')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toContainText('Ananda')
    for (const selector of ['.hero-story-copy h1', '.hero-factual-intro', '.view-work-button', '.cirs-visual-frame']) {
      const box = (await page.locator(selector).boundingBox())!
      expect(box.x, `${selector} left`).toBeGreaterThanOrEqual(-1)
      expect(box.x + box.width, `${selector} right`).toBeLessThanOrEqual(width + 1)
    }
    const cta = page.getByRole('button', { name: 'View Work', exact: true })
    const ctaBox = (await cta.boundingBox())!
    expect(ctaBox.height).toBeGreaterThanOrEqual(44)
    expect(ctaBox.width).toBeGreaterThanOrEqual(44)
    expect(ctaBox.y + ctaBox.height).toBeLessThan(844)
    if (mobile) {
      const menu = page.getByRole('button', { name: 'Open menu', exact: true })
      await expect(page.locator('#site-nav')).toBeHidden()
      expect((await menu.boundingBox())!.height).toBeGreaterThanOrEqual(44)
      await menu.click()
    }
    const nav = page.getByRole('navigation', { name: 'Main navigation' })
    await expect(nav.getByRole('link')).toHaveText(['Work', 'Studio', 'About', 'Contact'])
    for (const link of await nav.getByRole('link').all()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    if (mobile) {
      await page.keyboard.press('Escape')
      await expect(nav).toBeHidden()
    }
    await cta.click()
    await expect(page).toHaveURL(/\/work$/)
    await expect(page.locator('h1')).toHaveText(/Selected\s*work\./)
    await page.getByRole('navigation', { name: 'Explore selected projects' }).locator('a[href="#cirs"]').click()
    const navigationClearance = await page.evaluate(() => document.querySelector('.site-header')!.getBoundingClientRect().bottom + document.querySelector('.work-chapter-rail')!.getBoundingClientRect().height)
    await expect.poll(async () => (await page.locator('#cirs').boundingBox())!.y - navigationClearance).toBeGreaterThanOrEqual(16)
    await expect.poll(async () => (await page.locator('#cirs').boundingBox())!.y - navigationClearance).toBeLessThanOrEqual(40)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}

test('signature is a real transparent warm asset and the studio index has no invented player', async ({ page }) => {
  await ready(page)
  const pixels = await page.locator('header .ap-signature').evaluate(node => {
    const image = node as HTMLImageElement
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')!; context.filter = getComputedStyle(image).filter; context.drawImage(image, 0, 0)
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data
    let ink = 0, r = 0, g = 0, b = 0
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 230) { ink++; r += data[i]; g += data[i + 1]; b += data[i + 2] }
    return { cornerAlpha: data[3], ink, red: r / ink, green: g / ink, blue: b / ink }
  })
  expect(pixels.cornerAlpha).toBe(0)
  expect(pixels.ink).toBeGreaterThan(1000)
  expect(pixels.red).toBeGreaterThan(pixels.green)
  expect(pixels.green).toBeGreaterThan(pixels.blue)
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Studio', exact: true }).click()
  await expect(page).toHaveURL(/\/studio$/)
  await expect(page.locator('.studio-collection-index li')).toHaveCount(6)
  for (const title of ['CCK trailer', 'Farewell video', 'Vantara', 'TED-Ed auditions', 'CIRS website launch', 'CIRSMUN 2026']) await expect(page.getByRole('radio', { name: title, exact: true })).toHaveCount(1)
  await page.getByRole('radio', { name: 'CCK trailer', exact: true }).focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('radio', { name: 'Farewell video', exact: true })).toBeChecked()
  await expect(page.locator('.screening-title-card h3')).toHaveText('Farewell video')
  await expect(page.getByRole('radio', { name: 'CIRSMUN 2026', exact: true })).toBeDisabled()
  await expect(page.locator('.screening-title-card h3')).toHaveText('Farewell video')
  await expect(page.locator('#studio .screening-still')).toHaveCount(1)
  await expect(page.locator('#studio .screening-play')).toHaveCount(1)
  await expect(page.locator('#studio video, iframe')).toHaveCount(0)
  await expect(page.locator('#studio .reel-frame')).toHaveCount(5)
  await expect(page.locator('body')).not.toContainText('Crossroads')
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(page).toHaveURL(/\/about#contact$/)
  await expect(page.locator('#contact h2')).toBeInViewport()
  await expect(page.locator('#contact .contact-action')).toBeVisible()
  await expect(page.locator('#contact form')).toHaveCount(0)
})

test('secondary phone controls also keep 44px touch targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await ready(page, '/work')
  await page.locator('#airkart > summary').click()
  await page.locator('.perspectives > summary').click()
  await page.locator('.lab > summary').click()
  const controls = [
    page.getByRole('button', { name: 'Read the project notes', exact: true }),
    page.locator('.perspectives').getByRole('button', { name: 'People', exact: true }),
    page.getByRole('button', { name: 'AP OS', exact: true }),
    page.locator('#arrival-rate'),
    page.locator('#batch-size'),
  ]
  for (const control of controls) {
    const box = (await control.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
})

test('one shared pane changes real geometry through each desktop material world and reverses', async ({ page }, testInfo) => {
  test.setTimeout(60_000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page)
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'gsap-lenis')
  await expect(page.locator('.glass-material')).toHaveCount(1)
  await expect(page.locator('main')).toHaveAttribute('data-material-world', 'hero')
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  const initial = (await page.locator('.cirs-visual-frame').boundingBox())!
  const startPath = await page.locator('.material-pane').getAttribute('d')
  await page.screenshot({ path: 'docs/refinement-desktop-start.png' })
  await page.mouse.wheel(0, 850)
  await expect.poll(async () => (await page.locator('.cirs-visual-frame').boundingBox())!.width).toBeGreaterThan(initial.width * 2)
  await expect(page.locator('main')).toHaveAttribute('data-material-world', 'cirs')
  await expect.poll(() => page.locator('.glass-material').evaluate(node => Number(getComputedStyle(node).opacity))).toBeGreaterThan(.2)
  const cirsPath = await page.locator('.material-pane').getAttribute('d')
  expect(cirsPath).not.toBe(startPath)
  await expect.poll(() => page.locator('.cirs-scene-captions').evaluate(node => Number(getComputedStyle(node).opacity))).toBeGreaterThan(.95)
  await page.screenshot({ path: 'docs/refinement-desktop-middle.png' })
  await page.mouse.wheel(0, -850)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2)
  await expect.poll(async () => Math.abs((await page.locator('.cirs-visual-frame').boundingBox())!.width - initial.width)).toBeLessThan(2)
  const paths = [cirsPath]
  await ready(page, '/work')
  for (const world of ['community', 'accuflow', 'studio']) {
    if (world === 'studio') await ready(page, '/studio')
    const visual = world === 'studio' ? '#studio .studio-collection-index' : `#${world} .feature-media`
    await wheelTo(page, visual, 280)
    await expect(page.locator('main')).toHaveAttribute('data-material-world', world)
    await expect.poll(() => page.locator('.glass-material').evaluate(node => Number(getComputedStyle(node).opacity))).toBeGreaterThan(.1)
    const path = await page.locator('.material-pane').getAttribute('d')
    expect(paths).not.toContain(path); paths.push(path)
    await page.screenshot({ path: `docs/refinement-desktop-${world}.png` })
  }
  await ready(page, '/about')
  await wheelTo(page, '#contact', 180)
  await page.screenshot({ path: 'docs/refinement-desktop-end.png' })
  await testInfo.attach('shared-pane-path-count', { body: JSON.stringify({ uniquePaths: new Set(paths).size, initialWidth: initial.width }), contentType: 'application/json' })
})

test('portrait phones keep native scroll, full glass, and a lightweight changing material', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'dark', reducedMotion: 'no-preference' })
  const page = await context.newPage()
  await ready(page)
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'gsap-native')
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await expect(page.locator('.glass-cursor')).toHaveCount(0)
  await expect(page.locator('.project-opening-stage')).toBeVisible()
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.screenshot({ path: 'docs/refinement-mobile-start.png' })
  await ready(page, '/work')
  await wheelTo(page, '#community', 100)
  await page.screenshot({ path: 'docs/refinement-mobile-middle.png' })
  await ready(page, '/about')
  await wheelTo(page, '#contact', 170)
  await page.screenshot({ path: 'docs/refinement-mobile-end.png' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  await context.close()
})

test('reduced motion and low-power devices keep the sculpture with static scroll after the brief opening', async ({ page, browser }) => {
  await ready(page)
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'static')
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await expect(page.locator('.glass-material')).toBeHidden()
  await expect(page.locator('.state-opening')).toHaveCount(0)
  await expect(page.locator('.project-opening-stage')).toBeVisible()
  const before = (await page.locator('.cirs-visual-frame').boundingBox())!
  await page.mouse.wheel(0, 650)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(600)
  expect((await page.locator('.cirs-visual-frame').boundingBox())!.width).toBe(before.width)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' })
  await context.addInitScript(() => Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true }))
  const phone = await context.newPage(); await ready(phone)
  await expect(phone.locator('main')).toHaveAttribute('data-motion-fallback', 'device')
  await expect(phone.locator('main')).toHaveAttribute('data-scroll-engine', 'static')
  await expect(phone.locator('.pin-spacer, .state-opening')).toHaveCount(0)
  await context.close()
})

test('the black opening is skippable by keyboard and replays on reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => { Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true }) })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const skip = page.getByRole('button', { name: 'Skip intro', exact: true })
  await expect(skip).toBeVisible()
  const heading = page.locator('h1')
  await heading.evaluate(node => { (node as HTMLElement).tabIndex = -1; (node as HTMLElement).focus({ preventScroll: true }) })
  await skip.focus(); await page.keyboard.press('Enter')
  await expect(page.locator('.state-opening')).toHaveCount(0)
  await expect(heading).toBeFocused()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('.state-opening')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.state-opening')).toHaveCount(0)
  await expect(heading).toContainText('Ananda')
})

test('the exact signature title accepts Escape without stealing page focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true }))
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const drawing = page.locator('.state-signature-drawing')
  await expect(drawing).toBeVisible()
  await expect(drawing.locator('mask image')).toHaveAttribute('href', '/media/ap-signature.png')
  const home = page.locator('.site-header .wordmark')
  await home.focus()
  await page.keyboard.press('Escape')
  await expect(page.locator('.state-opening')).toHaveCount(0)
  await expect(home).toBeFocused()
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
})

test('the title sequence has a bounded fallback when the signature fails', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true }))
  await page.route('**/media/ap-signature*.png', route => route.abort())
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('button', { name: 'Skip intro', exact: true })).toBeVisible()
  await expect(page.locator('.state-signature-fallback')).toHaveText('Ananda Priyan')
  const start = Date.now()
  await expect(page.locator('.state-opening')).toHaveCount(0, { timeout: 2700 })
  expect(Date.now() - start).toBeLessThan(2700)
  await expect(page.locator('h1')).toContainText('Ananda')
})

test('the signature opening never waits on an unresolved image request', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true }))
  let requested = false
  await page.route('**/media/ap-signature.png', () => { requested = true })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.state-opening')).toBeVisible()
  await expect.poll(() => requested).toBe(true)
  await expect(page.locator('.state-opening')).toHaveCount(0, { timeout: 2700 })
  await expect(page.locator('h1')).toContainText('Ananda')
})

test('Save Data receives a brief static opening without a session or media wait', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true })
    Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true })
    new MutationObserver(() => {
      if (document.querySelector('.state-opening[data-mode="static"]')) document.documentElement.dataset.testStaticOpening = 'seen'
    }).observe(document, { childList: true, subtree: true })
  })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveAttribute('data-test-static-opening', 'seen')
  await expect(page.locator('h1')).toContainText('Ananda')
  await expect(page.locator('.state-opening')).toHaveCount(0, { timeout: 900 })
})

for (const path of ['/nothing-here', '/projects/not-a-project']) test(`branded 404 at ${path} returns Home without leaving scroll triggers`, async ({ page }) => {
  await page.goto(path)
  await expect(page).toHaveTitle('404 — Ananda Priyan')
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveText('This page isn’t in the story.')
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  const home = page.getByRole('link', { name: 'Home', exact: true })
  expect((await home.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await home.focus(); await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('h1')).toContainText('Ananda')
})

test('production includes a real branded 404 artifact and no blanket successful unknown-route rewrite', async () => {
  expect(await readFile('dist/404.html', 'utf8')).toContain('<title>404 — Ananda Priyan</title>')
  expect(await readFile('public/_redirects', 'utf8')).not.toMatch(/^\s*\/projects\/\*\s+\/index\.html\s+200/m)
})
