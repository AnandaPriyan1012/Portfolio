import { test, expect, type Page } from '@playwright/test'

const films = [
  { id: 'vantara', title: 'Vantara', source: '/media/vantara-masquerade-web-720p.mp4', times: [24, 76, 124] },
  { id: 'ted-ed-2026', title: 'TED-Ed auditions', source: '/media/teded-auditions-web.mp4', times: [2, 14, 19] },
  { id: 'cirs-website-launch', title: 'CIRS website launch', source: '/media/cirs-website-launch-web.mp4', times: [5, 17, 26] },
]
const time = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
async function ready(page: Page, id: string) {
  await page.goto(`/studio#${id}`)
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
}

for (const width of [1440, 390]) test.describe(`${width}px genuine film moments`, () => {
  test.use({ viewport: { width, height: width === 1440 ? 1000 : 844 },
    isMobile: width < 768, hasTouch: width < 768, reducedMotion: width === 1440 ? 'no-preference' : 'reduce' })
  for (const film of films) test(`${film.title} cues all three exact moments paused, restores its real opener and keeps ordinary Watch at the beginning`, async ({ page }) => {
    const movies: string[] = []
    page.on('request', request => { if (new URL(request.url()).pathname.endsWith('.mp4')) movies.push(request.url()) })
    if (width === 1440) await page.addInitScript(() => Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 }))
    await ready(page, film.id)
    const frames = page.locator('.film-moments')
    await expect(frames).toHaveAttribute('data-film', film.id)
    await expect(frames.getByRole('button')).toHaveCount(3)
    await expect(page.locator('video.actual-video')).toHaveCount(0)
    expect(movies).toEqual([])
    for (const seconds of film.times) {
      const opener = frames.getByRole('button', { name: `Open ${film.title} at ${time(seconds)}`, exact: true })
      await opener.scrollIntoViewIfNeeded()
      const bounds = await opener.boundingBox()
      expect(bounds!.width).toBeGreaterThanOrEqual(44)
      expect(bounds!.height).toBeGreaterThanOrEqual(44)
      if (width < 768) await opener.tap()
      else { await opener.focus(); await page.keyboard.press('Enter') }
      const video = page.locator('video.actual-video')
      await expect(video.locator('source')).toHaveAttribute('src', film.source)
      await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2)
      await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).seeking)).toBe(false)
      expect(await video.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeCloseTo(seconds, 1)
      expect(await video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
      expect(await video.getAttribute('autoplay')).toBeNull()
      await expect(page.getByRole('dialog').getByRole('status')).toContainText(`Starts at ${time(seconds)}`)
      const retained = await video.elementHandle()
      await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
      await expect(video).toHaveCount(0)
      await expect(opener).toBeFocused()
      expect(await retained!.evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
    }
    await page.getByRole('button', { name: `Play selected film: ${film.title}`, exact: true }).click()
    const ordinary = page.locator('video.actual-video')
    await expect.poll(() => ordinary.evaluate(node => (node as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2)
    expect(await ordinary.evaluate(node => (node as HTMLVideoElement).currentTime)).toBe(0)
    expect(await ordinary.evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
    await ordinary.focus(); await page.keyboard.press('Space')
    await expect.poll(() => ordinary.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeGreaterThan(.2)
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
})

test('320px touch can pan the real frame track, open the last moment and close to the same visible button', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
  const page = await context.newPage()
  try {
    await ready(page, 'ted-ed-2026')
    const track = page.locator('.film-moments-track')
    await track.scrollIntoViewIfNeeded()
    const box = await track.boundingBox()
    const client = await context.newCDPSession(page)
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box!.x + box!.width - 12, y: box!.y + 80 }] })
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box!.x + 15, y: box!.y + 80 }] })
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(() => track.evaluate(node => node.scrollLeft)).toBeGreaterThan(30)
    const last = page.getByRole('button', { name: 'Open TED-Ed auditions at 00:19', exact: true })
    await last.scrollIntoViewIfNeeded(); await last.tap()
    const video = page.locator('video.actual-video')
    await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2)
    expect(await video.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeCloseTo(19, 1)
    await page.getByRole('button', { name: 'Close dialog', exact: true }).tap()
    await expect(last).toBeFocused(); await expect(last).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  } finally { await context.close() }
})

test('posters do not expose timestamped frames when native approval is missing', async ({ page }) => {
  let changed = 0
  await page.route(url => url.pathname === '/src/content.ts' || /^\/assets\/index-[^/]+\.js$/.test(url.pathname), async route => {
    const response = await route.fetch(), code = await response.text()
    const modified = code.replace(/\bnativePlaybackApproved\s*:\s*(?:true\b|!0\b)/g, () => { changed++; return 'nativePlaybackApproved:false' })
    await route.fulfill({ response, body: modified })
  })
  await ready(page, 'vantara')
  expect(changed).toBe(3)
  await expect(page.locator('.film-moments')).toHaveCount(0)
  await expect(page.getByRole('radio', { name: 'Vantara', exact: true })).toBeDisabled()
  await expect(page.locator('video.actual-video')).toHaveCount(0)
})

for (const mode of ['light', 'forced-colors', 'motion-off']) test(`${mode} keeps the genuine frame index and native keyboard action usable`, async ({ page }) => {
  if (mode === 'light') await page.addInitScript(() => localStorage.setItem('ap-atelier-theme', 'light'))
  if (mode === 'motion-off') await page.addInitScript(() => localStorage.setItem('ap-motion', 'off'))
  if (mode === 'forced-colors') await page.emulateMedia({ forcedColors: 'active' })
  await ready(page, 'cirs-website-launch')
  const first = page.getByRole('button', { name: 'Open CIRS website launch at 00:05', exact: true })
  await first.focus(); await page.keyboard.press('Enter')
  const video = page.locator('video.actual-video')
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2)
  expect(await video.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeCloseTo(5, 1)
  await page.keyboard.press('Escape'); await expect(first).toBeFocused()
})
