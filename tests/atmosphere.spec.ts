import { test as base, expect, type Page } from '@playwright/test'

const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await use()
    expect(errors, 'No uncaught errors in the cinematic additions').toEqual([])
  }, { auto: true }],
})

async function ready(page: Page, path: string) {
  await page.goto(path)
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
}

async function rest(page: Page) {
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
}

async function wheelTo(page: Page, selector: string, offset: number) {
  await page.mouse.move(5, 450)
  for (let step = 0; step < 35; step++) {
    const distance = await page.locator(selector).evaluate((node, inset) => node.getBoundingClientRect().top - inset, offset)
    if (Math.abs(distance) < 12) { await rest(page); return }
    await page.mouse.wheel(0, Math.sign(distance) * Math.min(Math.abs(distance), 750))
    await page.waitForTimeout(180)
  }
  await expect.poll(async () => Math.abs((await page.locator(selector).boundingBox())!.y - offset)).toBeLessThan(12)
  await rest(page)
}

async function wheelBy(page: Page, distance: number) {
  const before = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, distance)
  // A fractional preceding smooth-scroll target can settle on the adjacent CSS pixel.
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - before - distance)).toBeLessThanOrEqual(1)
}

test('Studio room atmosphere loops silently while approved films remain click-to-play', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page, '/studio')
  const video = page.locator('.studio-atmosphere-film')
  await expect(video).toHaveAttribute('src', '/media/studio-atmosphere-loop.mp4')
  await expect(video).toHaveAttribute('poster', '/media/studio-atmosphere-poster.png')
  await expect(video).toHaveAttribute('aria-hidden', 'true')
  await expect(video).toHaveAttribute('tabindex', '-1')
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(false)
  const media = await video.evaluate(node => {
    const film = node as HTMLVideoElement, style = getComputedStyle(film)
    return { muted: film.muted, loop: film.loop, fit: style.objectFit, clip: style.clipPath, filter: style.filter, transform: style.transform, duration: film.duration }
  })
  expect(media).toMatchObject({ muted: true, loop: true, fit: 'contain', clip: 'none', filter: 'none', transform: 'none' })
  expect(media.duration).toBeGreaterThan(1)
  await expect(page.locator('.studio-atmosphere-controls')).toContainText('Conceptual room')
  await expect(page.locator('dialog video, iframe')).toHaveCount(0)
  await expect(page.locator('#studio .reel-frame')).toHaveCount(5)
  await expect(page.getByRole('button', { name: 'Play selected film: CCK trailer', exact: true })).toBeVisible()
  await expect(page.getByRole('radio')).toHaveCount(6)

  await page.getByRole('button', { name: 'Pause room atmosphere', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
  const pausedAt = await video.evaluate(node => (node as HTMLVideoElement).currentTime)
  await page.waitForTimeout(150)
  expect(await video.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeCloseTo(pausedAt, 1)
  const play = page.getByRole('button', { name: 'Play room atmosphere', exact: true })
  await expect(play).toHaveAttribute('aria-pressed', 'true')
  await play.press('Enter')
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(false)
  await video.evaluate(node => { const film = node as HTMLVideoElement; film.currentTime = film.duration - .2 })
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).currentTime), { timeout: 5000 }).toBeLessThan(1)
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Work', exact: true }).click()
  await expect(page.locator('.studio-atmosphere-film')).toHaveCount(0)
  await page.goBack()
  await expect(page.locator('.studio-atmosphere-film')).toHaveCount(1)
  await expect(page.getByRole('radio')).toHaveCount(6)
})

test('the Home corridor lazily seeks actual decoded frames forward and backward without autoplay or extra scroll height', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const requests: string[] = []
  page.on('request', request => { if (request.url().includes('/media/scroll-corridor.mp4')) requests.push(request.url()) })
  await ready(page, '/')
  await expect(page.locator('.scroll-corridor')).toHaveCount(1)
  await expect(page.locator('.scroll-corridor-film')).toHaveCount(0)
  expect(requests).toHaveLength(0)
  await wheelTo(page, '.home-directory', 0)
  const corridor = page.locator('.scroll-corridor')
  const film = page.locator('.scroll-corridor-film')
  await expect(corridor).toHaveAttribute('data-metadata', 'true')
  const media = await film.evaluate(node => {
    const video = node as HTMLVideoElement, style = getComputedStyle(video)
    return { paused: video.paused, autoplay: video.autoplay, loop: video.loop, muted: video.muted, fit: style.objectFit, clip: style.clipPath, width: video.videoWidth, height: video.videoHeight }
  })
  expect(media).toMatchObject({ paused: true, autoplay: false, loop: false, muted: true, fit: 'contain', clip: 'none' })
  expect(media.width).toBeGreaterThan(0)
  expect(media.height).toBeGreaterThan(0)
  const firstTime = await film.evaluate(node => (node as HTMLVideoElement).currentTime)
  await wheelBy(page, 700)
  await expect.poll(() => film.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeGreaterThan(firstTime + .5)
  await expect.poll(() => film.evaluate(node => (node as HTMLVideoElement).seeking)).toBe(false)
  const advanced = await film.evaluate(node => (node as HTMLVideoElement).currentTime)
  await wheelBy(page, -450)
  await expect.poll(() => film.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeLessThan(advanced - .3)
  await expect.poll(() => film.evaluate(node => (node as HTMLVideoElement).seeking)).toBe(false)
  expect(await film.evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
  await expect(page.getByRole('navigation', { name: 'Explore the portfolio' }).getByRole('link')).toHaveCount(3)
  const directoryHeight = (await page.locator('.home-directory').boundingBox())!.height
  await expect(page.locator('.pin-spacer')).toHaveCount(1)
  await page.getByRole('button', { name: 'Motion on', exact: true }).click()
  await expect(corridor).toHaveCount(0)
  expect(Math.abs((await page.locator('.home-directory').boundingBox())!.height - directoryHeight)).toBeLessThan(2)
})

test('decorative corridor and room films never load for fallback devices, and failed files preserve navigation and the collection', async ({ browser, baseURL }) => {
  test.setTimeout(60_000)
  for (const variant of ['phone', 'short-desktop', 'reduced', 'save-data', 'low-power', 'failed'] as const) {
    const context = await browser.newContext({ baseURL, viewport: { width: variant === 'phone' ? 390 : 1440, height: variant === 'short-desktop' ? 720 : 1000 }, reducedMotion: variant === 'reduced' ? 'reduce' : 'no-preference', ...(variant === 'phone' ? { isMobile: true, hasTouch: true } : {}) })
    try {
      const page = await context.newPage()
      const errors: string[] = [], requests: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('request', request => { if (/\/media\/(?:scroll-corridor|studio-atmosphere-loop)\.mp4/.test(request.url())) requests.push(request.url()) })
      if (variant === 'save-data') await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true }))
      if (variant === 'low-power') await page.addInitScript(() => Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true }))
      if (variant === 'failed') {
        await page.route('**/scroll-corridor.mp4', route => route.abort())
        await page.route('**/studio-atmosphere-loop.mp4', route => route.abort())
      }
      await ready(page, '/')
      if (variant === 'failed') await wheelTo(page, '.home-directory', 400)
      await expect(page.locator('.scroll-corridor')).toHaveCount(0)
      await expect(page.getByRole('navigation', { name: 'Explore the portfolio' }).getByRole('link')).toHaveCount(3)
      await ready(page, '/studio')
      await expect(page.locator('.studio-atmosphere')).toHaveCount(0)
      await expect(page.getByRole('radio')).toHaveCount(6)
      await page.getByRole('radio', { name: 'CCK trailer', exact: true }).focus()
      await page.keyboard.press('ArrowDown')
      await expect(page.getByRole('radio', { name: 'Farewell video', exact: true })).toBeChecked()
      await expect(page.locator('#studio video, iframe')).toHaveCount(0)
      await expect(page.locator('#studio .reel-frame')).toHaveCount(5)
      await expect(page.getByRole('button', { name: 'Play selected film: Farewell video', exact: true })).toBeVisible()
      if (variant === 'failed') {
        expect(requests.some(url => url.includes('/scroll-corridor.mp4'))).toBe(true)
        expect(requests.some(url => url.includes('/studio-atmosphere-loop.mp4'))).toBe(true)
      } else expect(requests, `${variant} avoids both decorative films`).toHaveLength(0)
      expect(errors, variant).toEqual([])
    } finally { await context.close() }
  }
})

test('the CIRS illustration is clearly reconstructed, reverses with scroll and yields to keyboard control beside genuine captures', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page, '/work')
  const conceptDrawer = page.locator('.work-process-drawer')
  await expect(conceptDrawer).not.toHaveAttribute('open', '')
  await conceptDrawer.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(conceptDrawer).toHaveAttribute('open', '')
  const study = page.locator('.cirs-concept-study')
  await expect(study).toContainText('Reconstructed concept · Created for this portfolio')
  await expect(study).toContainText('not an original project sketch or evidence of the historical design process')
  await expect(study.locator('.cirs-concept-legend')).toBeVisible()
  const slider = study.getByRole('slider', { name: 'Reveal the public interface', exact: true })
  await wheelTo(page, '.cirs-concept-study', 650)
  const initial = Number(await slider.inputValue())
  await wheelBy(page, 350)
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(initial + 10)
  const advanced = Number(await slider.inputValue())
  await wheelBy(page, -250)
  await expect.poll(async () => Number(await slider.inputValue())).toBeLessThan(advanced - 10)
  await slider.focus()
  await page.keyboard.press('Home')
  await page.keyboard.press('ArrowRight')
  await expect(slider).toHaveValue('1')
  await expect(study).toHaveAttribute('data-following', 'false')
  await page.keyboard.press('End')
  await expect(slider).toHaveValue('100')
  await expect(slider).toHaveAttribute('aria-valuetext', '100% public interface visible')
  await expect(study).toHaveAttribute('data-following', 'false')
  await rest(page)
  await wheelBy(page, 120)
  await expect(slider).toHaveValue('100')
  await study.getByRole('group', { name: 'Choose the genuine CIRS capture' }).getByRole('button', { name: 'Admissions', exact: true }).click()
  const actual = study.locator('.cirs-concept-actual img')
  await expect(actual).toHaveAttribute('src', '/media/cirs-admissions.webp')
  await actual.evaluate(node => (node as HTMLImageElement).decode())
  await expect(study.getByRole('link', { name: 'Visit CIRS admissions', exact: true })).toHaveAttribute('href', 'https://cirschool.org/admissions.html')
  await study.getByRole('button', { name: 'Follow page scroll', exact: true }).click()
  await expect(study).toHaveAttribute('data-following', 'true')
  await expect(study.getByRole('button', { name: 'Following page scroll', exact: true })).toBeDisabled()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(slider).toBeHidden()
  await expect(study.locator('.cirs-concept-art')).toBeVisible()
  await expect(study.locator('.cirs-concept-actual')).toBeVisible()
  await expect(study.locator('.cirs-concept-actual')).toHaveCSS('clip-path', 'none')
  await expect(study.locator('.cirs-concept-art figcaption')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
