import { test, expect, type Page } from '@playwright/test'

async function ready(page: Page, path = '/') {
  await page.goto(path)
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
}

async function wheelTo(page: Page, selector: string, offset: number) {
  await page.mouse.move(10, 450)
  for (let step = 0; step < 28; step++) {
    const distance = await page.locator(selector).evaluate((node, inset) => node.getBoundingClientRect().top - inset, offset)
    if (Math.abs(distance) < 12) return
    await page.mouse.wheel(0, Math.sign(distance) * Math.min(Math.abs(distance), 750))
    await page.waitForTimeout(180)
  }
  await expect.poll(async () => Math.abs((await page.locator(selector).boundingBox())!.y - offset)).toBeLessThan(12)
}

test('the opening leads with authentic project specimens and personal context without ambient media', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => { Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 }); Object.defineProperty(navigator, 'deviceMemory', { value: 8 }) })
  const requests: string[] = []
  page.on('request', request => { if (/\.mp4(?:[?#]|$)|atelier-room|amber-architecture/.test(request.url())) requests.push(request.url()) })
  await ready(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Ananda Priyan', exact: true })).toBeInViewport()
  await expect(page.locator('.opening-personal')).toContainText('Student developer, storyteller & swimmer.')
  await expect(page.locator('.opening-primary-label')).toContainText('School-team web work')
  await expect(page.locator('.opening-primary-label')).toContainText('Live website')
  await expect(page.locator('.opening-specimen-community')).toContainText('Voluntary digital work · since 2023')
  await expect(page.locator('.opening-specimen-community')).toContainText('Website review preview')
  await expect(page.locator('.opening-specimen-accuflow')).toContainText('Website & interaction prototype')
  for (const [selector, path, height] of [
    ['.opening-specimen-community img', '/media/vallalar-language-en-desktop.webp', 500],
    ['.opening-specimen-accuflow img', '/media/accuflow-prototype-desktop.webp', 1000],
  ] as const) {
    const image = page.locator(selector)
    await image.evaluate(node => (node as HTMLImageElement).decode())
    await expect(image).toHaveAttribute('src', path)
    await expect(image).toHaveCSS('object-fit', 'contain')
    expect(await image.evaluate(node => [(node as HTMLImageElement).naturalWidth, (node as HTMLImageElement).naturalHeight])).toEqual([1440, height])
  }
  await expect(page.locator('.home-cirs-proof')).toHaveCount(1)
  await expect(page.locator('.hero-ambient-film, .hero-film-toggle, img[src*="atelier-room"]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'View Work', exact: true })).toBeVisible()
  await expect(page.locator('.opening-studio-link')).toHaveAttribute('href', '/studio')
  expect(requests).toEqual([])
})

test('phones, reduced motion, save data and a failed specimen keep genuine content without a film dependency', async ({ browser, baseURL }) => {
  for (const variant of ['phone', 'short-desktop', 'reduced', 'save-data', 'low-power', 'failed'] as const) {
    const context = await browser.newContext({ baseURL, viewport: { width: variant === 'phone' ? 390 : 1440, height: variant === 'short-desktop' ? 720 : 1000 }, reducedMotion: variant === 'reduced' ? 'reduce' : 'no-preference', ...(variant === 'phone' ? { isMobile: true, hasTouch: true } : {}) })
    await context.addInitScript(low => { Object.defineProperty(navigator, 'hardwareConcurrency', { value: low ? 2 : 8 }); Object.defineProperty(navigator, 'deviceMemory', { value: 8 }) }, variant === 'low-power')
    const page = await context.newPage()
    if (variant === 'save-data') await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }))
    if (variant === 'failed') await page.route('**/vallalar-language-en-desktop.webp', route => route.abort())
    const requests: string[] = []
    page.on('request', request => { if (/\.mp4(?:[?#]|$)|atelier-room|amber-architecture/.test(request.url())) requests.push(request.url()) })
    await ready(page)
    await expect(page.locator('.hero-ambient-film, .hero-film-toggle')).toHaveCount(0)
    await expect(page.locator('.opening-specimen-accuflow img')).toBeVisible()
    if (variant === 'failed') await expect(page.locator('.opening-specimen-community')).toContainText('The website capture could not load.')
    else await expect(page.locator('.opening-specimen-community img')).toBeVisible()
    expect(requests, `${variant} does not fetch former room/ambient media`).toEqual([])
    await expect(page.locator('.pin-spacer')).toHaveCount(variant === 'failed' ? 1 : 0)
    await context.close()
  }
})

test('Vallalar and AccuFlow scenes respond to real wheel input and reverse', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page, '/work')
  const runway = page.locator('.community-scroll-runway')
  await wheelTo(page, '.community-scroll-runway', 0)
  // Finish the alignment wheel before treating its position as a new baseline.
  await page.evaluate(() => new Promise<void>(resolve => {
    let last = scrollY, quietFrames = 0
    const check = () => {
      quietFrames = scrollY === last ? quietFrames + 1 : 0
      last = scrollY
      if (quietFrames >= 12) resolve()
      else requestAnimationFrame(check)
    }
    requestAnimationFrame(check)
  }))
  const start = Number(await runway.getAttribute('data-scene-progress'))
  const sticky = (await page.locator('.community-image-reservation').boundingBox())!.y
  // Fractional alignment targets can settle on the adjacent CSS pixel.
  const beforeForward = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, 220)
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - beforeForward - 220)).toBeLessThanOrEqual(1)
  await expect.poll(async () => Number(await runway.getAttribute('data-scene-progress'))).toBeGreaterThan(start + .15)
  const advanced = Number(await runway.getAttribute('data-scene-progress'))
  expect(Math.abs((await page.locator('.community-image-reservation').boundingBox())!.y - sticky)).toBeLessThan(5)
  const beforeReverse = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, -150)
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - beforeReverse + 150)).toBeLessThanOrEqual(1)
  await expect.poll(async () => Number(await runway.getAttribute('data-scene-progress'))).toBeLessThan(advanced - .1)
  await wheelTo(page, '.accuflow-assembly', 700)
  const assembly = page.locator('.accuflow-assembly')
  const flowStart = Number(await assembly.getAttribute('data-scene-progress'))
  await page.mouse.wheel(0, 500)
  await expect.poll(async () => Number(await assembly.getAttribute('data-scene-progress'))).toBeGreaterThan(flowStart + .4)
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
})

test('the Studio screening follows scroll in both directions while keyboard choice wins', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page, '/studio')
  await expect(page.locator('#studio')).toHaveAttribute('data-scroll-programme', 'true')
  await wheelTo(page, '.screening-programme li:nth-child(2)', 430)
  await expect(page.locator('.screening-title-card h3')).toHaveText('Farewell video')
  await page.mouse.wheel(0, 350)
  await expect(page.locator('.screening-title-card h3')).not.toHaveText('Farewell video')
  await page.mouse.wheel(0, -350)
  await expect(page.locator('.screening-title-card h3')).toHaveText('Farewell video')
  const keyboardChoice = page.getByRole('radio', { name: 'CCK trailer', exact: true })
  await keyboardChoice.focus()
  await page.keyboard.press('Space')
  await page.mouse.wheel(0, 350)
  await expect(keyboardChoice).toBeChecked()
  await expect(page.locator('.screening-title-card h3')).toHaveText('CCK trailer')
  await expect(page.locator('#studio video:not(.studio-atmosphere-film), iframe')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Play selected film: CCK trailer', exact: true })).toBeVisible()
})

test('the original About signature scatters by keyboard, settles, and respects both motion controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await ready(page, '/about')
  const study = page.locator('.signature-study')
  const original = study.getByRole('img', { name: 'Ananda Priyan — original AP signature', exact: true })
  await original.evaluate(node => (node as HTMLImageElement).decode())
  await expect(original).toHaveAttribute('src', '/media/ap-signature.png')
  await expect(original).toBeVisible()
  const scatter = study.getByRole('button', { name: 'Scatter & settle', exact: true })
  await expect(scatter).toBeVisible()
  await expect(study.locator('canvas')).toBeVisible()
  await expect(study).toHaveAttribute('data-canvas-state', 'rest')
  await scatter.focus()
  await page.keyboard.press('Enter')
  await expect(study).toHaveAttribute('data-canvas-state', 'active')
  await expect(original).toBeVisible()
  expect(await study.locator('.signature-study-original').evaluate(node => Number(getComputedStyle(node).opacity))).toBeGreaterThan(0)
  await expect(study).toHaveAttribute('data-canvas-state', 'rest', { timeout: 6000 })
  await expect(original).toHaveAttribute('src', '/media/ap-signature.png')
  await expect(original).toBeVisible()

  await page.getByRole('button', { name: 'Motion on', exact: true }).click()
  await expect(study.locator('canvas')).toHaveCount(0)
  await expect(scatter).toHaveCount(0)
  await expect(original).toBeVisible()
  await page.getByRole('button', { name: 'Motion off', exact: true }).click()
  await original.scrollIntoViewIfNeeded()
  await expect(study.locator('canvas')).toBeVisible()
  await expect(scatter).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(study.locator('canvas')).toHaveCount(0)
  await expect(scatter).toHaveCount(0)
  await expect(original).toHaveAttribute('src', '/media/ap-signature.png')
  await expect(original).toBeVisible()
  await expect(page.getByRole('button', { name: 'Motion off', exact: true })).toBeDisabled()
  expect(errors).toEqual([])
})
