import { test as base, expect, type Locator, type Page } from '@playwright/test'

const films = [
  { id: 'vantara', title: 'Vantara', path: '/media/vantara-masquerade-web-720p.mp4', duration: 166.42, width: 1280, height: 720 },
  { id: 'ted-ed-2026', title: 'TED-Ed auditions', path: '/media/teded-auditions-web.mp4', duration: 31.722667, width: 1920, height: 1080 },
  { id: 'cirs-website-launch', title: 'CIRS website launch', path: '/media/cirs-website-launch-web.mp4', duration: 38, width: 1920, height: 1080 },
] as const
type Film = (typeof films)[number]

const test = base.extend<{ traffic: { media: string[]; google: string[] } }>({
  traffic: [async ({ page, baseURL }, use) => {
    const traffic = { media: [] as string[], google: [] as string[] }
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => {
      const url = new URL(request.url())
      if (films.some(film => film.path === url.pathname)) traffic.media.push(url.pathname)
    })
    await page.route(/https:\/\/(?:[^/]*\.)?(?:google\.com|googleusercontent\.com|googleapis\.com|gstatic\.com)\//, route => {
      traffic.google.push(new URL(route.request().url()).origin)
      return route.abort()
    })
    await page.addInitScript(origin => {
      if (location.origin === origin) sessionStorage.setItem('ap-atelier-loader-v4', 'seen')
    }, new URL(baseURL!).origin)
    await use(traffic)
    expect(traffic.google, 'Local film selection and playback must not contact a Google provider').toEqual([])
    expect(errors, 'No uncaught errors during native film interaction').toEqual([])
  }, { auto: true }],
})

async function studio(page: Page) {
  await page.goto('/studio')
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
}

async function choose(page: Page, film: Film, touch = false) {
  const radio = page.getByRole('radio', { name: film.title, exact: true })
  if (touch) await radio.tap()
  else await radio.check()
  await expect(radio).toBeChecked()
  await expect(page.locator('.screening-title-card h3')).toHaveText(film.title)
  return page.getByRole('button', { name: `Play selected film: ${film.title}`, exact: true })
}

async function open(page: Page, film: Film, touch = false) {
  const watch = await choose(page, film, touch)
  if (touch) await watch.tap()
  else { await watch.focus(); await page.keyboard.press('Enter') }
  const dialog = page.getByRole('dialog', { name: film.title, exact: true })
  const video = dialog.locator('video.actual-video')
  await expect(video).toHaveAttribute('aria-label', `${film.title} video player`)
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2)
  return { watch, dialog, video }
}

async function sourceState(video: Locator) {
  return video.evaluate(node => {
    const video = node as HTMLVideoElement
    return {
      path: new URL(video.currentSrc).pathname, duration: video.duration,
      width: video.videoWidth, height: video.videoHeight,
      controls: video.controls, playsInline: video.playsInline, tabIndex: video.tabIndex,
      preload: video.preload, autoplay: video.autoplay, muted: video.muted,
      paused: video.paused, time: video.currentTime,
      frames: video.getVideoPlaybackQuality().totalVideoFrames,
      error: video.error?.code ?? null,
    }
  })
}

async function watchTrustedGestures(video: Locator) {
  await video.evaluate(node => {
    const video = node as HTMLVideoElement & { testGestures?: { kind: string; trusted: boolean; pointerType?: string }[] }
    video.testGestures = []
    video.addEventListener('keydown', event => {
      if (event.code === 'Space') video.testGestures!.push({ kind: 'Space', trusted: event.isTrusted })
    }, true)
    video.addEventListener('pointerdown', event => video.testGestures!.push({ kind: 'pointer', pointerType: event.pointerType, trusted: event.isTrusted }), true)
  })
}

test('native films remain request-free until Watch, with one canonical Vantara and a matching legacy alias', async ({ page, traffic }) => {
  await studio(page)
  const catalogue = await page.evaluate(async () => {
    const { creativeMedia, resolveCreativeMedia } = await import('/src/content.ts')
    const native = creativeMedia.filter((film: { id: string }) => ['vantara', 'ted-ed-2026', 'cirs-website-launch'].includes(film.id))
    return {
      ids: creativeMedia.map((film: { id: string }) => film.id),
      aliasIsCanonical: resolveCreativeMedia('masquerade-trailer') === resolveCreativeMedia('vantara'),
      native: native.map((film: { id: string; nativePlaybackApproved?: boolean; credits: string | null }) => ({ id: film.id, approved: film.nativePlaybackApproved, credits: film.credits })),
    }
  })
  expect(catalogue.ids).toEqual(['cck-trailer', 'farewell-video', 'vantara', 'ted-ed-2026', 'cirs-website-launch', 'cirsmun-2026'])
  expect(catalogue.aliasIsCanonical).toBe(true)
  expect(catalogue.native).toEqual(films.map(film => ({ id: film.id, approved: true, credits: null })))
  await expect(page.locator('[data-film-id="vantara"]')).toHaveCount(1)
  await expect(page.locator('[data-film-id="masquerade-trailer"]')).toHaveCount(0)
  for (const film of films) {
    await choose(page, film)
    await expect(page.locator('dialog, iframe, #studio video:not(.studio-atmosphere-film)')).toHaveCount(0)
  }
  await choose(page, films[0])
  await expect(page.locator('.screening-film-note')).toContainText('Masquerade trailer · 2:46.')
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  expect(traffic.media, 'Selecting approved local posters must not request an MP4').toEqual([])
})

for (const film of films) {
  test(`${film.title} decodes its real approved file and native Space starts and pauses playback`, async ({ page, traffic }) => {
    await studio(page)
    expect(traffic.media).toEqual([])
    const { watch, dialog, video } = await open(page, film)
    const before = await sourceState(video)
    expect(before).toMatchObject({ path: film.path, width: film.width, height: film.height, controls: true, playsInline: true, tabIndex: 0, preload: 'metadata', autoplay: false, muted: false, paused: true, error: null })
    expect(before.duration).toBeCloseTo(film.duration, 2)
    expect(before.time).toBe(0)
    await expect(video).not.toHaveAttribute('autoplay')
    await expect(video).not.toHaveAttribute('muted')
    expect(traffic.media).toContain(film.path)
    expect(traffic.media.every(path => path === film.path)).toBe(true)
    await watchTrustedGestures(video)
    await video.focus()
    await page.keyboard.press('Space')
    await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(false)
    await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeGreaterThan(.25)
    await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).getVideoPlaybackQuality().totalVideoFrames)).toBeGreaterThan(before.frames)
    await page.keyboard.press('Space')
    await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
    const gestures = await video.evaluate(node => (node as HTMLVideoElement & { testGestures: { kind: string; trusted: boolean }[] }).testGestures)
    expect(gestures.filter(event => event.kind === 'Space')).toEqual([{ kind: 'Space', trusted: true }, { kind: 'Space', trusted: true }])
    expect((await sourceState(video)).error).toBeNull()
    await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click()
    await expect(watch).toBeFocused()
    await expect(page.locator('dialog video')).toHaveCount(0)
  })
}

test.describe('390px native touch controls', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  test('the real films play from a trusted tap on the browser play control', async ({ page }, testInfo) => {
    await studio(page)
    const gestures = []
    for (const film of films) {
      const { watch, dialog, video } = await open(page, film, true)
      const before = await sourceState(video)
      expect(before.paused).toBe(true)
      expect(before.muted).toBe(false)
      const box = (await video.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(390)
      await watchTrustedGestures(video)
      await video.evaluate(node => {
        const video = node as HTMLVideoElement & { testScriptPlayCalls: number }
        video.testScriptPlayCalls = 0
        const originalPlay = video.play.bind(video)
        video.play = () => { video.testScriptPlayCalls++; return originalPlay() }
      })
      // At this narrow width Chromium places native Play one row above
      // the bottom seek bar. Tap that real control, never video.play().
      await video.tap({ position: { x: 24, y: box.height - 46 } })
      await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(false)
      await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeGreaterThan(.25)
      const playing = await sourceState(video)
      expect(playing.frames).toBeGreaterThan(before.frames)
      expect(playing.error).toBeNull()
      const events = await video.evaluate(node => (node as HTMLVideoElement & { testGestures: { kind: string; trusted: boolean; pointerType?: string }[] }).testGestures)
      // Native Chromium controls can consume touch before it reaches DOM
      // listeners. Prove that the actual tap, rather than a scripted play(),
      // started decoding; retain any observable DOM events as diagnostics.
      const scriptPlayCalls = await video.evaluate(node => (node as HTMLVideoElement & { testScriptPlayCalls: number }).testScriptPlayCalls)
      expect(scriptPlayCalls).toBe(0)
      gestures.push({ film: film.id, input: 'native play control above seek bar, touchscreen tap', time: playing.time, frames: playing.frames, scriptPlayCalls, events })
      await dialog.getByRole('button', { name: 'Close dialog', exact: true }).tap()
      await expect(watch).toBeFocused()
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    await testInfo.attach('native-touch-control-evidence', { body: JSON.stringify(gestures, null, 2), contentType: 'application/json' })
  })
})

test('Vantara keeps its supplied black sections and real decoded content at bounded seek positions', async ({ page }, testInfo) => {
  await studio(page)
  const { dialog, video } = await open(page, films[0])
  const samples = []
  for (const time of [0, 6, 90, 130, 162]) {
    const sample = await video.evaluate(async (node, time) => {
      const video = node as HTMLVideoElement
      if (Math.abs(video.currentTime - time) > .001) {
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error(`Seek timed out at ${time}s`)), 6000)
          video.addEventListener('seeked', () => { clearTimeout(timeout); resolve() }, { once: true })
          video.currentTime = time
        })
      }
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const canvas = document.createElement('canvas')
      canvas.width = 160; canvas.height = 90
      const context = canvas.getContext('2d', { willReadFrequently: true })!
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data
      let sum = 0, max = 0, bright = 0
      for (let index = 0; index < data.length; index += 4) {
        const luma = .2126 * data[index] + .7152 * data[index + 1] + .0722 * data[index + 2]
        sum += luma; max = Math.max(max, luma); if (luma > 16) bright++
      }
      return { requestedTime: time, time: video.currentTime, duration: video.duration, paused: video.paused, readyState: video.readyState, frames: video.getVideoPlaybackQuality().totalVideoFrames, meanLuma: sum / (data.length / 4), maxLuma: max, brightFraction: bright / (data.length / 4), error: video.error?.code ?? null }
    }, time)
    expect(sample.time).toBeCloseTo(time, 1)
    expect(sample.paused).toBe(true)
    expect(sample.readyState).toBeGreaterThanOrEqual(2)
    expect(sample.error).toBeNull()
    if (time === 0 || time === 130) {
      expect(sample.meanLuma, `The supplied black section at ${time}s remains black`).toBeLessThan(3)
      expect(sample.brightFraction).toBe(0)
    } else expect(sample.maxLuma, `Actual content remains at ${time}s; black source sections were not treated as load failures`).toBeGreaterThan(16)
    let nativeSpacePlayback: { input: string; startTime: number; time: number; framesBefore: number; framesAfter: number; pausedAfter: boolean; error: number | null } | null = null
    if (time === 130) {
      // The source is black here. Actual native playback must still advance
      // both its clock and decoded frames rather than remain stuck on a seek.
      await video.focus()
      await page.keyboard.press('Space')
      await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(false)
      await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeGreaterThan(time + .25)
      await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).getVideoPlaybackQuality().totalVideoFrames)).toBeGreaterThan(sample.frames)
      const advancing = await sourceState(video)
      await page.keyboard.press('Space')
      await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
      nativeSpacePlayback = { input: 'native Space play/pause', startTime: time, time: advancing.time, framesBefore: sample.frames, framesAfter: advancing.frames, pausedAfter: true, error: advancing.error }
    }
    samples.push({ ...sample, nativeSpacePlayback })
  }
  await expect(dialog).toContainText('Masquerade trailer · 2:46.')
  await expect(dialog.locator('.video-pending')).toHaveCount(0)
  await testInfo.attach('vantara-decoded-frame-statistics-no-images', { body: JSON.stringify(samples, null, 2), contentType: 'application/json' })
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click()
})

test('unapproved native sources with null credits cannot expose Watch or request their MP4s', async ({ page, traffic }) => {
  await page.route('**/src/content.ts*', async route => {
    const response = await route.fetch()
    const source = await response.text()
    await route.fulfill({ response, body: `${source}\n;creativeMedia.filter(film=>['vantara','ted-ed-2026','cirs-website-launch'].includes(film.id)).forEach(film=>{film.nativePlaybackApproved=false;film.credits=null;});\n` })
  })
  await studio(page)
  for (const film of films) {
    await expect(page.getByRole('radio', { name: film.title, exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: `Play selected film: ${film.title}`, exact: true })).toHaveCount(0)
    await expect(page.locator('iframe, dialog video')).toHaveCount(0)
  }
  await expect(page.locator('.screening-ready-films .reel-frame')).toHaveCount(2)
  expect(traffic.media).toEqual([])
})

test('approval cannot unlock a deferred video or missing poster', async ({ page, traffic }) => {
  await page.route('**/src/content.ts*', async route => {
    const response = await route.fetch()
    const source = await response.text()
    await route.fulfill({ response, body: `${source}\n;creativeMedia.find(film=>film.id==='ted-ed-2026').videoUrl=null;creativeMedia.find(film=>film.id==='cirs-website-launch').posterUrl=null;\n` })
  })
  await studio(page)
  for (const film of films.slice(1)) {
    await expect(page.getByRole('radio', { name: film.title, exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: `Play selected film: ${film.title}`, exact: true })).toHaveCount(0)
    await expect(page.locator('iframe, dialog video')).toHaveCount(0)
  }
  await expect(page.locator('.screening-ready-films .reel-frame')).toHaveCount(3)
  expect(traffic.media).toEqual([])
})
