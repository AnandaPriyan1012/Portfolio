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

test('ambient hero preserves the full marked frame, loops silently and has a working pause', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page)
  const video = page.locator('.hero-ambient-film')
  await expect(video).toHaveAttribute('poster', '/media/amber-architecture-poster.webp')
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(false)
  expect(await video.evaluate(node => (node as HTMLVideoElement).muted)).toBe(true)
  expect(await video.evaluate(node => (node as HTMLVideoElement).loop)).toBe(true)
  const frame = await video.evaluate(node => {
    const film = node as HTMLVideoElement, box = film.getBoundingClientRect()
    const scale = Math.min(box.width / film.videoWidth, box.height / film.videoHeight)
    return {
      fit: getComputedStyle(film).objectFit,
      clip: getComputedStyle(film).clipPath,
      width: film.videoWidth,
      height: film.videoHeight,
      duration: film.duration,
      mark: { x: box.x + (box.width - film.videoWidth * scale) / 2 + film.videoWidth * scale * .96, y: box.y + (box.height - film.videoHeight * scale) / 2 + film.videoHeight * scale * .95, right: box.right, bottom: box.y + (box.height + film.videoHeight * scale) / 2 },
    }
  })
  expect(frame.fit).toBe('contain')
  expect(frame.clip).toBe('none')
  expect([frame.width, frame.height]).toEqual([1280, 720])
  expect(frame.duration).toBeCloseTo(8, 1)
  for (const selector of ['.hero-optical-pane', '.hero-story-copy', '.cirs-visual-frame', '.hero-film-toggle']) {
    const box = (await page.locator(selector).boundingBox())!
    const overlaps = box.x < frame.mark.right && box.x + box.width > frame.mark.x && box.y < frame.mark.bottom && box.y + box.height > frame.mark.y
    expect(overlaps, `${selector} leaves the marked corner clear`).toBe(false)
  }
  await page.getByRole('button', { name: 'Pause ambient film', exact: true }).click()
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
  const pausedAt = await video.evaluate(node => (node as HTMLVideoElement).currentTime)
  await page.waitForTimeout(150)
  expect(await video.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeCloseTo(pausedAt, 1)
  await page.getByRole('button', { name: 'Play ambient film', exact: true }).click()
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(false)
  await video.evaluate(node => { (node as HTMLVideoElement).currentTime = 7.7 })
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).currentTime), { timeout: 5000 }).toBeLessThan(1)
  await page.mouse.wheel(0, 950)
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
  await page.mouse.wheel(0, -1100)
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(false)
})

test('phones, reduced motion, save data and failed media keep a real still without a film dependency', async ({ browser }) => {
  for (const variant of ['phone', 'short-desktop', 'reduced', 'save-data', 'low-power', 'failed'] as const) {
    const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173', viewport: { width: variant === 'phone' ? 390 : 1440, height: variant === 'short-desktop' ? 720 : 1000 }, reducedMotion: variant === 'reduced' ? 'reduce' : 'no-preference', ...(variant === 'phone' ? { isMobile: true, hasTouch: true } : {}) })
    const page = await context.newPage()
    if (variant === 'save-data') await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }))
    if (variant === 'low-power') await page.addInitScript(() => Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 }))
    if (variant === 'failed') await page.route('**/amber-architecture-loop.mp4', route => route.abort())
    const requests: string[] = []
    page.on('request', request => { if (request.url().includes('amber-architecture-loop.mp4')) requests.push(request.url()) })
    await ready(page)
    await expect(page.locator('.hero-ambient-film')).toHaveCount(0)
    await expect(page.locator('.hero-room img')).toBeVisible()
    if (variant !== 'failed') expect(requests, `${variant} does not fetch the film`).toHaveLength(0)
    await expect(page.locator('.pin-spacer')).toHaveCount(variant === 'failed' || variant === 'short-desktop' ? 1 : 0)
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
  const beforeForward = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, 220)
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - beforeForward - 220)).toBeLessThan(1)
  await expect.poll(async () => Number(await runway.getAttribute('data-scene-progress'))).toBeGreaterThan(start + .15)
  const advanced = Number(await runway.getAttribute('data-scene-progress'))
  expect(Math.abs((await page.locator('.community-image-reservation').boundingBox())!.y - sticky)).toBeLessThan(5)
  const beforeReverse = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, -150)
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - beforeReverse + 150)).toBeLessThan(1)
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
