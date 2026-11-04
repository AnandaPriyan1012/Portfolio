import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { inflateSync } from 'node:zlib'

// Read browser-rendered PNG pixels rather than re-drawing the source image.
// This catches a compositor dropping the signature while the PNG still decodes.
function warmPaintedPixels(png: Buffer) {
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20)
  const channels = png[25] === 6 ? 4 : png[25] === 2 ? 3 : 0
  if (png[24] !== 8 || !channels || png[28] !== 0) throw new Error('Unsupported screenshot PNG format')
  const chunks: Buffer[] = []
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset)
    if (png.toString('ascii', offset + 4, offset + 8) === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length))
    offset += length + 12
  }
  const scanlines = inflateSync(Buffer.concat(chunks)), stride = width * channels
  let previous = Buffer.alloc(stride), count = 0
  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c)
    return da <= db && da <= dc ? a : db <= dc ? b : c
  }
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1), filter = scanlines[start], row = Buffer.alloc(stride)
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? row[x - channels] : 0, b = previous[x], c = x >= channels ? previous[x - channels] : 0
      const predictor = filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : filter === 4 ? paeth(a, b, c) : 0
      row[x] = (scanlines[start + x + 1] + predictor) & 255
    }
    for (let x = 0; x < stride; x += channels)
      if (row[x] > 110 && row[x + 1] > 80 && row[x + 2] > 40 && row[x] > row[x + 1] && row[x + 1] > row[x + 2]) count++
    previous = row
  }
  return count
}

async function ready(page: Page, path = '/') {
  await page.goto(path)
  await page.evaluate(() => document.fonts.ready)
  for (const selector of path === '/' ? ['.hero-room img', '.cirs-browser-image', 'header .ap-signature'] : ['header .ap-signature'])
    await page.locator(selector).evaluate(node => (node as HTMLImageElement).decode())
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}

for (const width of [320, 375, 390, 768, 1024, 1440]) {
  test(`slim header and CIRS anchor remain clear at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await ready(page)
    const expectedHeight = width < 768 ? 64 : width < 1024 ? 72 : 76
    expect((await page.locator('.site-header').boundingBox())!.height).toBe(expectedHeight)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    await page.getByRole('button', { name: 'View Work', exact: true }).click()
    await expect(page).toHaveURL(/\/work$/)
    await expect(page.locator('h1')).toHaveText(/Selected\s*work\./)
    await page.getByRole('navigation', { name: 'Explore selected projects' }).locator('a[href="#cirs"]').click()
    await expect.poll(async () => (await page.locator('#cirs').boundingBox())!.y).toBeGreaterThanOrEqual(expectedHeight + 16)
    await expect.poll(async () => (await page.locator('#cirs').boundingBox())!.y).toBeLessThanOrEqual(expectedHeight + 40)
    const heading = (await page.locator('#cirs h2').boundingBox())!
    expect(heading.y).toBeGreaterThanOrEqual(expectedHeight + 16)
    await page.goto('/about#contact')
    const contact = page.locator('#contact').getByRole('link', { name: 'anandapriyan1012@gmail.com', exact: true })
    await expect(contact).toHaveAttribute('href', 'mailto:anandapriyan1012@gmail.com')
    await contact.scrollIntoViewIfNeeded()
    const box = (await contact.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}

test('film-strip location follows page navigation and browser history', async ({ page }) => {
  await ready(page)
  const nav = page.getByRole('navigation', { name: 'Main navigation' })
  await expect(nav.locator('a[aria-current="location"]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Ananda Priyan, home', exact: true })).toHaveAttribute('aria-current', 'page')
  for (const [name, path] of [['Studio', '/studio'], ['About', '/about'], ['Contact', '/about#contact'], ['Work', '/work']]) {
    await nav.getByRole('link', { name, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(nav.locator('a[aria-current="location"]')).toHaveText(name)
    await expect(nav.locator('a[aria-current="location"]')).toHaveCount(1)
  }
  await page.goBack()
  await expect(page).toHaveURL(/\/about#contact$/)
  await expect(nav.locator('a[aria-current="location"]')).toHaveText('Contact')
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(nav.locator('a[aria-current="location"]')).toHaveText('About')
})

test('hero hands off to a centred CIRS frame before the name retires', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page)
  await expect(page.locator('main')).toHaveAttribute('data-scroll-engine', 'gsap-lenis')
  const samples: unknown[] = []
  for (const progress of [0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 0.9]) {
    await page.mouse.wheel(0, progress * 1100 - await page.evaluate(() => scrollY))
    // Finish each smooth wheel input before applying another relative delta.
    await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - progress * 1100)).toBeLessThan(1)
    await expect.poll(async () => Math.abs(Number(await page.locator('.scroll-opening').getAttribute('data-progress')) - progress)).toBeLessThan(.002)
    const sample = await page.evaluate(() => {
      const frame = document.querySelector('.cirs-visual-frame')!.getBoundingClientRect()
      const title = document.querySelector('.cirs-scene-title')!
      return {
        progress: Number(document.querySelector('.scroll-opening')!.getAttribute('data-progress')),
        heroOpacity: Number(getComputedStyle(document.querySelector('.hero-story-copy')!).opacity),
        frame: { x: frame.x, y: frame.y, width: frame.width, height: frame.height },
        coversCenter: frame.left <= innerWidth / 2 && frame.right >= innerWidth / 2 && frame.top <= innerHeight / 2 && frame.bottom >= innerHeight / 2,
        titleOpacity: Number(getComputedStyle(title).opacity),
        titleTop: title.getBoundingClientRect().top,
        headerBottom: document.querySelector('.site-header')!.getBoundingClientRect().bottom,
      }
    })
    if (sample.heroOpacity < .2) expect(sample.coversCenter, `frame covers centre at progress ${progress}`).toBe(true)
    if (sample.titleOpacity > .8) expect(sample.titleTop - sample.headerBottom).toBeGreaterThanOrEqual(16)
    samples.push(sample)
  }
  await page.mouse.wheel(0, -1200)
  await expect.poll(async () => await page.evaluate(() => scrollY)).toBeLessThan(2)
  await expect.poll(() => page.locator('.hero-story-copy').evaluate(node => Number(getComputedStyle(node).opacity))).toBeGreaterThan(.99)
  await testInfo.attach('continuous-handoff-samples', { body: JSON.stringify(samples, null, 2), contentType: 'application/json' })
})

test('verified prototype media and honest reading modes replace public preview notes', async ({ page }) => {
  await ready(page, '/work')
  for (const id of ['community', 'accuflow']) {
    const visual = page.locator(`#${id} .feature-media img`)
    await expect(visual).toHaveCount(1)
    await visual.scrollIntoViewIfNeeded()
    await visual.evaluate(node => (node as HTMLImageElement).decode())
    expect(await visual.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(300)
    await expect(page.locator(`#${id} .project-media-caption`)).toContainText(/website|prototype/i)
    await expect(page.locator(`#${id}`)).not.toContainText(/have not been supplied|awaiting confirmation|documentation in progress/)
  }
  await page.locator('#cirs').getByRole('button', { name: 'Quick view', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'CIRS Website', exact: true })
  await dialog.getByRole('button', { name: /Director’s cut/ }).click()
  await expect(dialog.locator('.case-study')).toContainText('Admissions')
  await expect(dialog.locator('.case-study')).not.toContainText(/awaiting|preview|will be added|supplied|no traffic/i)
  await expect(dialog.getByRole('button', { name: 'What did you learn?', exact: true })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.locator('#cirs').getByRole('button', { name: 'Quick view', exact: true })).toBeFocused()
  await page.locator('#cirs').getByRole('link', { name: 'Read the case study', exact: true }).click()
  await expect(page.locator('.case-stage')).toHaveCount(4)
  await expect(page.getByRole('heading', { name: 'What I learned', exact: true })).toHaveCount(0)
  await ready(page, '/studio')
  await expect(page.locator('#studio')).not.toContainText('Original work to be added')
  await expect(page.locator('#studio video:not(.studio-atmosphere-film), #studio .reel-frame')).toHaveCount(0)
})

test('the warm AP mark paints before scrolling and falls back if its source fails', async ({ browser, browserName }) => {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, reducedMotion: 'no-preference', ...(width === 390 && browserName === 'chromium' ? { isMobile: true, hasTouch: true } : {}) })
    const page = await context.newPage()
    await ready(page)
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    expect(await page.evaluate(() => scrollY)).toBe(0)
    const pixels = warmPaintedPixels(await page.locator('.site-header .wordmark').screenshot())
    expect(pixels, `${width}px actual rendered warm signature pixels`).toBeGreaterThan(30)
    await page.route('**/media/ap-signature.png', route => route.abort())
    await page.reload()
    await expect(page.locator('header .signature-fallback')).toHaveText('AP')
    await expect(page.locator('h1')).toContainText('Ananda')
    await context.close()
  }
})
