import { test as base, expect, type Page } from '@playwright/test'

const source = '/media/cirs-website-launch-web.mp4'
const poster = '/media/cirs-launch-case-0005.webp'
const chapterId = 'case-cirs-launch'
const chapter = (page: Page) => page.locator('#' + chapterId)
const figure = (page: Page) => chapter(page).locator('.case-launch-film')
const video = (page: Page) => figure(page).locator('video.case-launch-video')
const watch = (page: Page) => figure(page).locator('button.case-launch-watch')
type Traffic = { films: string[]; errors: string[] }
const test = base.extend<{ traffic: Traffic }>({
  traffic: [async ({ page }, use) => {
    const traffic: Traffic = { films: [], errors: [] }
    page.on('request', request => {
      const url = new URL(request.url())
      if (url.pathname.endsWith('.mp4')) traffic.films.push(url.pathname)
    })
    page.on('pageerror', error => traffic.errors.push(error.message))
    await use(traffic)
    expect(traffic.errors, 'Inline film has no uncaught browser errors').toEqual([])
  }, { auto: true }],
})

test.beforeEach(async ({ request }) => {
  if (process.env.AP_QA_EXPECTED_BUNDLE || process.env.AP_QA_EXPECTED_STYLE) {
    const html = await (await request.get('/projects/cirs')).text()
    if (process.env.AP_QA_EXPECTED_BUNDLE) expect(html).toContain(process.env.AP_QA_EXPECTED_BUNDLE)
    if (process.env.AP_QA_EXPECTED_STYLE) expect(html).toContain(process.env.AP_QA_EXPECTED_STYLE)
  }
})
async function settle(page: Page) {
  let previous = await page.evaluate(() => scrollY), stable = 0
  await expect.poll(async () => {
    const next = await page.evaluate(() => scrollY)
    stable = Math.abs(next - previous) < .5 ? stable + 1 : 0; previous = next
    return stable
  }, { intervals: [100] }).toBeGreaterThanOrEqual(3)
}
async function ready(page: Page, cpu = 8) {
  await page.addInitScript(cpu => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => cpu })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => cpu })
  }, cpu)
  await page.goto('/projects/cirs#' + chapterId)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  if (process.env.AP_QA_EXPECTED_BUNDLE) await expect(page.locator('script[type="module"]')).toHaveAttribute('src', '/assets/' + process.env.AP_QA_EXPECTED_BUNDLE)
  await expect(chapter(page)).toBeFocused()
  await expect(chapter(page).locator('h2')).toBeInViewport()
  await expect(page.getByRole('navigation', { name: 'Case study chapters' }).locator('[aria-current="location"]')).toHaveAttribute('href', '#' + chapterId)
  await settle(page)
}
async function shape(page: Page) {
  const rect = (await figure(page).locator('.case-launch-film-frame').boundingBox())!
  const viewport = page.viewportSize()!
  expect(rect.width).toBeGreaterThan(200)
  expect(rect.x).toBeGreaterThanOrEqual(-.1)
  expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width + .1)
  expect(Math.abs(rect.width / rect.height - 16 / 9)).toBeLessThan(.02)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
  return rect
}
async function state(page: Page) {
  return video(page).evaluate(node => {
    const media = node as HTMLVideoElement
    return { connected: media.isConnected, path: media.currentSrc ? new URL(media.currentSrc).pathname : null,
      duration: media.duration, width: media.videoWidth, height: media.videoHeight,
      controls: media.controls, inline: media.playsInline, preload: media.preload,
      autoplay: media.autoplay, muted: media.muted, paused: media.paused,
      time: media.currentTime, frames: media.getVideoPlaybackQuality().totalVideoFrames,
      error: media.error?.code ?? null }
  })
}
async function explicitWatch(page: Page, touch = false) {
  await watch(page).scrollIntoViewIfNeeded(); await settle(page)
  if (touch) await watch(page).tap()
  else { await watch(page).focus(); await page.keyboard.press('Enter') }
  await expect.poll(() => video(page).evaluate(node => (node as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2)
  await expect.poll(() => video(page).evaluate(node => (node as HTMLVideoElement).paused)).toBe(false)
  await expect.poll(() => video(page).evaluate(node => (node as HTMLVideoElement).currentTime)).toBeGreaterThan(.25)
  await expect.poll(() => video(page).evaluate(node => (node as HTMLVideoElement).getVideoPlaybackQuality().totalVideoFrames)).toBeGreaterThan(0)
  const playing = await state(page)
  expect(playing).toMatchObject({ path: source, width: 1920, height: 1080, controls: true, inline: true, autoplay: false, muted: false, paused: false, error: null })
  expect(playing.duration).toBeCloseTo(38, 2)
  await expect(video(page)).toBeFocused()
  return playing
}
async function pausedNoResume(page: Page) {
  await expect.poll(() => video(page).evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
  const stopped = await state(page)
  await page.waitForTimeout(400)
  const later = await state(page)
  expect(later.paused).toBe(true)
  expect(later.time).toBeCloseTo(stopped.time, 2)
  return { stopped, later }
}

const variants = [
  { width: 1440, height: 1000, touch: false, motion: 'no-preference' as const },
  { width: 390, height: 844, touch: true, motion: 'no-preference' as const },
  { width: 320, height: 844, touch: true, motion: 'reduce' as const },
]
for (const mode of variants) test.describe(`${mode.width}px inline launch film`, () => {
  test.use({ viewport: { width: mode.width, height: mode.height }, hasTouch: mode.touch, isMobile: mode.touch, reducedMotion: mode.motion })
  test('the genuine film waits for a native action, plays in its original frame and never resumes from passive re-entry', async ({ page, traffic }, testInfo) => {
    await ready(page)
    await expect(figure(page)).toHaveAttribute('data-state', 'idle')
    await expect(video(page)).not.toHaveAttribute('src')
    await expect(video(page)).toHaveAttribute('poster', poster)
    await expect(figure(page).locator('figcaption')).toHaveText('Poster frame from supplied launch film · 00:05')
    expect((await state(page)).controls).toBe(false)
    expect((await state(page)).preload).toBe('none')
    expect(traffic.films).toEqual([])
    const initial = await shape(page)
    const playing = await explicitWatch(page, mode.touch)
    expect(traffic.films.length).toBeGreaterThan(0)
    const loaded = await shape(page)
    expect(Math.abs(loaded.height - initial.height)).toBeLessThan(1)
    // The browser's own Space control pauses and resumes the already loaded film.
    await page.keyboard.press('Space')
    await pausedNoResume(page)
    await page.keyboard.press('Space')
    await expect.poll(() => video(page).evaluate(node => (node as HTMLVideoElement).paused)).toBe(false)
    await expect(watch(page)).toHaveAccessibleName('Pause CIRS website launch')
    if (mode.touch) await watch(page).tap()
    else { await watch(page).focus(); await page.keyboard.press('Enter') }
    await expect(watch(page)).toBeFocused()
    await expect(watch(page)).toHaveAccessibleName('Play CIRS website launch')
    await pausedNoResume(page)
    await explicitWatch(page, mode.touch)
    await page.mouse.wheel(0, -mode.height * 2)
    await expect(video(page)).not.toBeInViewport()
    const offscreen = await pausedNoResume(page)
    await video(page).scrollIntoViewIfNeeded(); await settle(page)
    const returned = await pausedNoResume(page)
    await testInfo.attach('genuine-native-inline-playback', { body: JSON.stringify({ mode, initial, loaded, playing, offscreen, returned }, null, 2), contentType: 'application/json' })
  })
})

test('both reading cuts retain the launch chapter and selected source without autoplay', async ({ page, traffic }) => {
  await ready(page)
  for (const name of ['Quick cut', 'Director’s cut']) {
    const command = page.getByRole('button', { name, exact: true })
    await command.scrollIntoViewIfNeeded(); await settle(page); await command.focus(); await page.keyboard.press('Enter')
    await expect(command).toBeFocused(); await expect(command).toHaveAttribute('aria-pressed', 'true')
    await expect(chapter(page)).toHaveCount(1)
    const nativeLink = page.getByRole('navigation', { name: 'Case study chapters' }).getByRole('link', { name: 'The website launch film', exact: true })
    await nativeLink.scrollIntoViewIfNeeded(); await settle(page); await nativeLink.focus(); await page.keyboard.press('Enter')
    await expect(chapter(page)).toBeInViewport()
    await expect(figure(page)).toHaveAttribute('data-state', 'idle')
    await expect(video(page)).not.toHaveAttribute('src')
    expect(traffic.films).toEqual([])
  }
})

for (const mode of variants) test.describe(`${mode.width}px native Studio continuation`, () => {
  test.use({ viewport: { width: mode.width, height: mode.height }, hasTouch: mode.touch, isMobile: mode.touch, reducedMotion: mode.motion })
  test('Studio remains a native canonical handoff and browser Back restores the case without a stale player', async ({ page, traffic }, testInfo) => {
    await ready(page)
    const link = chapter(page).getByRole('link', { name: 'Open the launch film in Studio · 0:38', exact: true })
    await expect(link).toHaveAttribute('href', '/studio#cirs-website-launch')
    expect(await link.getAttribute('target')).toBeNull()
    await explicitWatch(page, mode.touch)
    const retained = (await video(page).elementHandle())!
    await link.scrollIntoViewIfNeeded(); await settle(page)
    if (!mode.touch) await link.focus()
    await link.evaluate(element => element.addEventListener('click', () => {
      document.documentElement.dataset.testLaunchDeparture = JSON.stringify({ y: scrollY, focused: document.activeElement?.outerHTML.slice(0, 200) })
    }, { capture: true, once: true }))
    if (mode.touch) await link.tap()
    else await page.keyboard.press('Enter')
    const departure = JSON.parse((await page.locator('html').getAttribute('data-test-launch-departure'))!) as { y: number; focused: string }
    const departed = departure.y
    await expect(page).toHaveURL(/\/studio#cirs-website-launch$/)
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    await expect(page.getByRole('radio', { name: 'CIRS website launch', exact: true })).toBeChecked()
    await expect(page.locator('video.actual-video')).toHaveCount(0)
    await expect.poll(() => retained.evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
    expect(await retained.evaluate(node => node.isConnected)).toBe(false)
    const beforeBack = traffic.films.length
    await page.goBack()
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    await expect(page).toHaveURL(/\/projects\/cirs#case-cirs-launch$/)
    const arrival = await page.evaluate(() => ({ y: scrollY, url: location.href, focus: document.activeElement?.outerHTML.slice(0, 250) }))
    await testInfo.attach('native-Studio-return-before-assertion', { body: JSON.stringify({ departed, arrival }), contentType: 'application/json' })
    await expect(link).toBeFocused()
    await expect.poll(() => page.evaluate(y => Math.abs(scrollY - y), departed)).toBeLessThan(4)
    await expect(figure(page)).toHaveAttribute('data-state', 'idle')
    await expect(video(page)).not.toHaveAttribute('src')
    expect(traffic.films.length).toBe(beforeBack)
    await testInfo.attach('native-Studio-continuation', { body: JSON.stringify({ departed, returned: await page.evaluate(() => scrollY), retainedPaused: await retained.evaluate(node => (node as HTMLVideoElement).paused) }), contentType: 'application/json' })
  })
})

test('route opening and unmount stop the retained native film, and returning starts idle', async ({ page }, testInfo) => {
  await ready(page)
  await explicitWatch(page)
  const retained = (await video(page).elementHandle())!
  await page.evaluate(() => {
    const media = document.querySelector<HTMLVideoElement>('.case-launch-video')!
    window.addEventListener('ap:openingchange', event => {
      if ((event as CustomEvent<{ active: boolean }>).detail?.active) {
        requestAnimationFrame(() => { document.documentElement.dataset.testLaunchOpening = JSON.stringify({ paused: media.paused, connected: media.isConnected }) })
      }
    }, { once: true })
  })
  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).click()
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(page).toHaveURL(/\/work$/)
  await expect.poll(() => retained.evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
  const stopped = await retained.evaluate(node => ({ connected: node.isConnected, paused: (node as HTMLVideoElement).paused, time: (node as HTMLVideoElement).currentTime }))
  expect(stopped.connected).toBe(false)
  await page.waitForTimeout(400)
  expect(await retained.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeCloseTo(stopped.time, 2)
  await page.goBack(); await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(figure(page)).toHaveAttribute('data-state', 'idle')
  await expect(video(page)).not.toHaveAttribute('src')
  const openingState = await page.locator('html').getAttribute('data-test-launch-opening')
  expect(openingState).not.toBeNull()
  expect(JSON.parse(openingState!).paused).toBe(true)
  await testInfo.attach('AP-opening-and-unmount', { body: JSON.stringify({ opening: JSON.parse(openingState!), stopped }), contentType: 'application/json' })
})

for (const mode of ['motion-off', 'forced-colors', 'low-power'] as const) test(`${mode} permits deliberate real playback while keeping the idle film request-free`, async ({ page, traffic }, testInfo) => {
  if (mode === 'motion-off') await page.addInitScript(() => localStorage.setItem('ap-motion', 'off'))
  if (mode === 'forced-colors') await page.emulateMedia({ forcedColors: 'active' })
  await ready(page, mode === 'low-power' ? 2 : 8)
  expect(traffic.films).toEqual([])
  const rect = await shape(page), playing = await explicitWatch(page)
  await page.keyboard.press('Space'); const stopped = await pausedNoResume(page)
  await testInfo.attach('quiet-explicit-native-playback', { body: JSON.stringify({ mode, rect, playing, stopped }), contentType: 'application/json' })
})

test('an unavailable original gives an honest retry and keeps the native Studio alternative usable', async ({ page }) => {
  const matchingSource = (url: URL) => url.pathname === source
  await page.route(matchingSource, route => route.abort('failed'))
  await ready(page)
  await watch(page).scrollIntoViewIfNeeded(); await settle(page); await watch(page).focus(); await page.keyboard.press('Enter')
  await expect(figure(page)).toHaveAttribute('data-state', 'error')
  await expect(watch(page)).toHaveAccessibleName('Retry CIRS website launch')
  await expect(figure(page).getByRole('status')).toBeVisible()
  await expect(chapter(page).getByRole('link', { name: 'Open the launch film in Studio · 0:38', exact: true })).toHaveAttribute('href', '/studio#cirs-website-launch')
  await page.unroute(matchingSource)
  await explicitWatch(page)
})

test('a controlled rejected play promise preserves native controls and exposes a usable explicit retry', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play
    let rejected = false
    HTMLMediaElement.prototype.play = function () {
      if (this.classList.contains('case-launch-video') && !rejected) {
        rejected = true
        return Promise.reject(new DOMException('Controlled test-only play rejection', 'NotAllowedError'))
      }
      return original.call(this)
    }
  })
  await ready(page)
  await watch(page).scrollIntoViewIfNeeded(); await settle(page); await watch(page).focus(); await page.keyboard.press('Enter')
  await expect(figure(page).getByRole('status')).toBeVisible()
  await expect.poll(() => video(page).evaluate(node => (node as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2)
  expect((await state(page)).paused).toBe(true)
  expect((await state(page)).controls).toBe(true)
  await expect(video(page)).toBeFocused()
  await explicitWatch(page)
  await testInfo.attach('controlled-rejection-not-browser-policy-failure', { body: JSON.stringify({ evidence: 'First matching play() promise deliberately rejected; second real gesture played the unchanged native file.', playing: await state(page) }), contentType: 'application/json' })
})

test('resizing preserves the reserved video plane and a focused native player without restarting a paused film', async ({ page }, testInfo) => {
  await ready(page)
  await explicitWatch(page)
  await page.keyboard.press('Space'); await pausedNoResume(page)
  const observations = []
  for (const width of [1440, 768, 390, 320, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 })
    await video(page).scrollIntoViewIfNeeded(); await settle(page)
    await expect(video(page)).toBeFocused()
    observations.push({ width, rect: await shape(page), state: await state(page) })
    expect(observations.at(-1)!.state.paused).toBe(true)
  }
  await testInfo.attach('responsive-inline-native-plane', { body: JSON.stringify(observations, null, 2), contentType: 'application/json' })
})
