import { test as base, expect, type Page } from '@playwright/test'

const artwork = [
  ['cck-trailer', '/media/cck-trailer-still.jpg'],
  ['farewell-video', '/media/farewell-film-still.jpg'],
  ['vantara', '/media/vantara-masquerade-poster.jpg'],
  ['ted-ed-2026', '/media/teded-auditions-poster.jpg'],
  ['cirs-website-launch', '/media/cirs-website-launch-poster.jpg'],
]
const titles = ['CCK trailer', 'Farewell video', 'Vantara', 'TED-Ed auditions', 'CIRS website launch', 'CIRSMUN 2026']
const test = base.extend<{ traffic: { mp4: string[]; google: string[] } }>({
  traffic: [async ({ page, baseURL }, use) => {
    const traffic = { mp4: [] as string[], google: [] as string[] }, errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => {
      const url = new URL(request.url())
      if (url.pathname.endsWith('.mp4')) traffic.mp4.push(url.pathname)
    })
    await page.route(/https:\/\/(?:[^/]*\.)?(?:google\.com|googleusercontent\.com|googleapis\.com|gstatic\.com)\//, route => {
      traffic.google.push(new URL(route.request().url()).origin)
      return route.abort()
    })
    await page.addInitScript(origin => {
      if (location.origin === origin) sessionStorage.setItem('ap-atelier-loader-v4', 'seen')
    }, new URL(baseURL!).origin)
    await use(traffic)
    expect(traffic.google, 'Local Studio artwork and native playback do not request Google').toEqual([])
    expect(errors, 'The art direction must not introduce uncaught browser errors').toEqual([])
  }, { auto: true }],
})

async function ready(page: Page) {
  await page.goto('/studio')
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveText(/The screening\s*room\./i)
  await expect(page.getByRole('radio')).toHaveCount(6)
  await expect(page.locator('.screening-ready-films .reel-frame')).toHaveCount(5)
  await expect(page.locator('.studio-atmosphere-film, #studio video, iframe')).toHaveCount(0)
}

async function expectArtwork(page: Page) {
  const sheet = page.locator('.studio-contact-sheet')
  await expect(sheet).toHaveAttribute('aria-hidden', 'true')
  await expect(sheet.locator('figure')).toHaveCount(5)
  expect(await sheet.locator('figure').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-film')))).toEqual(artwork.map(([id]) => id))
  await expect(sheet.locator('button, a, input, video, iframe, [tabindex]:not([tabindex="-1"])')).toHaveCount(0)
  for (const [id, path] of artwork) {
    const image = sheet.locator(`figure[data-film="${id}"] img`)
    await expect(image).toHaveAttribute('src', path)
    await expect(image).toHaveAttribute('alt', '')
    await image.scrollIntoViewIfNeeded()
    await image.evaluate(node => (node as HTMLImageElement).decode())
    const source = await image.evaluate(async node => {
      const image = node as HTMLImageElement, box = image.getBoundingClientRect()
      const bitmap = await createImageBitmap(await (await fetch(image.currentSrc)).blob())
      try {
        return { path: new URL(image.currentSrc).pathname, width: bitmap.width, height: bitmap.height, fit: getComputedStyle(image).objectFit, renderedWidth: box.width, renderedHeight: box.height }
      } finally { bitmap.close() }
    })
    const thumbnail = path.replace('/media/', '/media/film-thumbnails/').replace('.jpg', '')
    expect([`${thumbnail}-320.webp`, `${thumbnail}-640.webp`]).toContain(source.path)
    expect([source.width, source.height]).toEqual(source.path.endsWith('-320.webp') ? [320, 180] : [640, 360])
    expect(source.width / source.height).toBeCloseTo(16 / 9, 5)
    expect(source.fit).toBe('contain')
    expect(source.renderedWidth).toBeGreaterThan(15)
    expect(source.renderedHeight).toBeGreaterThan(10)
  }
  return sheet
}

test('five genuine contained posters replace the room video without duplicating interactive controls', async ({ page, traffic }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page)
  const sheet = await expectArtwork(page)
  await expect(sheet).toHaveAttribute('data-arrived', 'true')
  await expect.poll(() => sheet.evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0)
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({ path: '/workspace/studio-art-review/studio-art-desktop-1440.png' })
  expect(traffic.mp4, 'The new scene has no ambient MP4 dependency').toEqual([])
})

test('Vantara selection updates its genuine artwork and the contact-sheet motion finishes', async ({ page, traffic }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page)
  const sheet = await expectArtwork(page)
  await page.getByRole('radio', { name: 'Vantara', exact: true }).check()
  await expect(sheet.locator('figure[data-active="true"]')).toHaveCount(1)
  await expect(sheet.locator('figure[data-active="true"] img')).toHaveAttribute('src', artwork[2][1])
  const timing = await sheet.locator('figure').evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node)
    return { animationDuration: style.animationDuration, iterations: style.animationIterationCount, transitionDuration: style.transitionDuration }
  }))
  for (const value of timing) {
    expect(value.iterations).not.toContain('infinite')
    for (const duration of [...value.animationDuration.split(','), ...value.transitionDuration.split(',')]) {
      const milliseconds = duration.trim().endsWith('ms') ? parseFloat(duration) : parseFloat(duration) * 1000
      expect(milliseconds).toBeLessThanOrEqual(1000)
    }
  }
  await expect.poll(() => sheet.evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0)
  await expect(page.locator('.screening-title-card h3')).toHaveText('Vantara')
  await expect(page.locator('.screening-film-note')).toContainText('Masquerade trailer')
  expect(traffic.mp4).toEqual([])
})

for (const width of [320, 390]) test.describe(`${width}px touch art direction`, () => {
  test.use({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true })
  test('reduced motion keeps all programme controls and full artwork usable without media traffic', async ({ page, traffic }) => {
    await ready(page)
    const sheet = await expectArtwork(page)
    await expect(sheet).toHaveAttribute('data-motion', 'off')
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
    if (width === 390) await page.screenshot({ path: '/workspace/studio-art-review/studio-art-phone-390.png' })
    for (const title of titles) {
      const radio = page.getByRole('radio', { name: title, exact: true })
      if (title === 'CIRSMUN 2026') {
        await expect(radio).toBeDisabled()
        await expect(page.locator('[data-film-id="cirsmun-2026"]')).toContainText('Not available')
        continue
      }
      await radio.tap()
      await expect(radio).toBeChecked()
      const watch = page.getByRole('button', { name: `Play selected film: ${title}`, exact: true })
      await expect(watch).toBeVisible()
      expect((await watch.boundingBox())!.height).toBeGreaterThanOrEqual(44)
      const aperture = (await page.locator('.screening-still-window').boundingBox())!
      const titleCard = (await page.locator('.screening-title-card').boundingBox())!
      const watchBox = (await watch.boundingBox())!
      expect(aperture.width / aperture.height, `${title}: the complete film aperture keeps its 16:9 shape`).toBeCloseTo(16 / 9, 2)
      expect(titleCard.y, `${title}: wrapped titles stay below the complete film frame`).toBeGreaterThanOrEqual(aperture.y + aperture.height - 1)
      expect(watchBox.y, `${title}: Watch stays below the complete film frame`).toBeGreaterThanOrEqual(aperture.y + aperture.height - 1)
      await expect(page.locator('.screening-still')).toHaveCSS('object-fit', 'contain')
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    expect(await sheet.evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0)
    expect(traffic.mp4).toEqual([])
  })
})

test('the unmatched title stays compact and disabled, and cannot replace real art through keyboard or scroll', async ({ page, traffic }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page)
  const unavailable = page.getByRole('radio', { name: 'CIRSMUN 2026', exact: true })
  const row = page.locator('[data-film-id="cirsmun-2026"]')
  await expect(unavailable).toBeDisabled()
  await expect(row).toContainText('Not available')
  expect((await row.boundingBox())!.height).toBeLessThanOrEqual(80)
  const last = page.getByRole('radio', { name: 'CIRS website launch', exact: true })
  await last.check(); await last.focus(); await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('radio', { name: 'CCK trailer', exact: true })).toBeChecked()
  await last.check()
  await page.getByRole('link', { name: 'Ananda Priyan, home', exact: true }).focus()
  await row.evaluate(node => { const r = node.getBoundingClientRect(); scrollTo({ top: scrollY + r.top + r.height / 2 - innerHeight / 2, behavior: 'instant' }) })
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await expect(page.locator('.screening-title-card h3')).toHaveText('CIRS website launch')
  await expect(page.getByRole('button', { name: 'Play selected film: CIRS website launch', exact: true })).toBeVisible()
  await expect(page.locator('.screening-still')).toHaveAttribute('src', '/media/cirs-website-launch-poster.jpg')
  expect(traffic.mp4).toEqual([])
})

for (const mode of ['first-unready', 'none-ready'] as const) test(`${mode} uses the first approved film or an honest no-film fallback`, async ({ page, traffic }) => {
  await page.route('**/src/content.ts*', async route => {
    const response = await route.fetch(), source = await response.text()
    const mutation = mode === 'first-unready'
      ? "creativeMedia.find(film=>film.id==='cck-trailer').embedUrl=null;"
      : "creativeMedia.forEach(film=>{film.embedUrl=null;film.videoUrl=null;});"
    await route.fulfill({ response, body: `${source}\n;${mutation}\n` })
  })
  await page.goto('/studio')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByRole('radio')).toHaveCount(6)
  if (mode === 'first-unready') {
    await expect(page.getByRole('radio', { name: 'CCK trailer', exact: true })).toBeDisabled()
    await expect(page.getByRole('radio', { name: 'Farewell video', exact: true })).toBeChecked()
    await expect(page.locator('.screening-title-card h3')).toHaveText('Farewell video')
  } else {
    await expect(page.locator('.screening-choice:enabled')).toHaveCount(0)
    await expect(page.getByRole('status')).toContainText('No films available yet.')
    await expect(page.locator('.screening-play, .screening-still, .studio-contact-sheet')).toHaveCount(0)
  }
  await expect(page.locator('#studio video, iframe')).toHaveCount(0)
  expect(traffic.mp4).toEqual([])
})

test('forced colors preserve the artwork sources and ordinary keyboard programme', async ({ page, traffic }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' })
  await ready(page)
  const sheet = await expectArtwork(page)
  const cck = page.getByRole('radio', { name: 'CCK trailer', exact: true })
  await cck.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('radio', { name: 'Farewell video', exact: true })).toBeChecked()
  await expect(sheet.locator('figure[data-active="true"]')).toHaveAttribute('data-film', 'farewell-video')
  await expect(page.getByRole('button', { name: 'Play selected film: Farewell video', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440)
  expect(await sheet.evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0)
  expect(traffic.mp4).toEqual([])
})

test('the editorial scene retains explicit keyboard Watch and real TED-Ed native controls', async ({ page, traffic }) => {
  await ready(page)
  await page.getByRole('radio', { name: 'TED-Ed auditions', exact: true }).check()
  expect(traffic.mp4).toEqual([])
  const watch = page.getByRole('button', { name: 'Play selected film: TED-Ed auditions', exact: true })
  await watch.focus(); await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'TED-Ed auditions', exact: true }), video = dialog.locator('video.actual-video')
  await expect(video).toHaveAttribute('controls', '')
  await expect(video).toHaveAttribute('playsinline', '')
  await expect(video).toHaveAttribute('tabindex', '0')
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2)
  const before = await video.evaluate(node => { const video = node as HTMLVideoElement; return { path: new URL(video.currentSrc).pathname, paused: video.paused, muted: video.muted, autoplay: video.autoplay, frames: video.getVideoPlaybackQuality().totalVideoFrames } })
  expect(before).toMatchObject({ path: '/media/teded-auditions-web.mp4', paused: true, muted: false, autoplay: false })
  await video.focus(); await page.keyboard.press('Space')
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeGreaterThan(.2)
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).getVideoPlaybackQuality().totalVideoFrames)).toBeGreaterThan(before.frames)
  await page.keyboard.press('Space')
  await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(true)
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).focus(); await page.keyboard.press('Enter')
  await expect(watch).toBeFocused()
  await expect(dialog).toHaveCount(0)
  expect(traffic.mp4.every(path => path === '/media/teded-auditions-web.mp4')).toBe(true)
})
