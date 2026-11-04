import { test as base, expect, type Page } from '@playwright/test'

const cck = 'https://drive.google.com/file/d/1FXMI8GoosQllewx87S8_lJDXRULukrYA/preview'
const farewell = 'https://drive.google.com/file/d/1zxuYX1UAG8FwYlfYhWP-SAnP4jaRx5MN/preview'

const test = base.extend<{ errors: string[] }>({
  errors: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await use(errors)
    expect(errors, 'No uncaught errors while choosing or closing a Drive film').toEqual([])
  }, { auto: true }],
})

async function studio(page: Page) {
  await page.goto('/studio')
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
}

async function stubDrive(page: Page) {
  const requests: string[] = []
  await page.route('https://drive.google.com/**', async route => {
    requests.push(route.request().url())
    await route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Isolated Google Drive player fixture</title><button>Play fixture</button>',
    })
  })
  return requests
}

test('approved CCK export loads only after a keyboard Watch action and closes accessibly', async ({ page }) => {
  const requests = await stubDrive(page)
  await studio(page)
  await expect(page.locator('iframe')).toHaveCount(0)
  expect(requests).toEqual([])
  const still = page.locator('.screening-still')
  await expect(still).toHaveAttribute('src', '/media/cck-trailer-still.jpg')
  await still.evaluate(node => (node as HTMLImageElement).decode())
  expect(await still.evaluate(node => {
    const image = node as HTMLImageElement, style = getComputedStyle(image)
    return { width: image.naturalWidth, height: image.naturalHeight, fit: style.objectFit, opacity: style.opacity, mask: style.maskImage }
  })).toEqual({ width: 640, height: 360, fit: 'contain', opacity: '1', mask: 'none' })
  const aperture = await page.locator('.screening-still-window').boundingBox()
  const screen = await page.locator('.screening-screen').boundingBox()
  expect(aperture!.width, 'The actual still occupies the screening aperture').toBeGreaterThan(screen!.width * 0.8)
  expect(aperture!.height).toBeGreaterThan(100)
  await expect(page.locator('.screening-film-note')).toContainText('Actual film still')
  await expect(page.getByRole('button', { name: 'Play CCK trailer', exact: true }).locator('img')).toHaveAttribute('src', '/media/cck-trailer-still.jpg')
  expect(requests, 'The real poster is local and does not load Google Drive').toEqual([])
  await expect(page.locator('.screening-film-note')).toContainText('Public export, 2:22')
  const watch = page.getByRole('button', { name: 'Play selected film: CCK trailer', exact: true })
  await watch.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'CCK trailer', exact: true })
  const frame = dialog.getByTitle('CCK trailer — Google Drive player', { exact: true })
  await expect(frame).toHaveAttribute('src', cck)
  await expect.poll(() => requests).toEqual([cck])
  await expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer')
  await expect(frame).toHaveAttribute('allowfullscreen', '')
  expect(await frame.getAttribute('allow')).not.toContain('autoplay')
  await expect(dialog).toContainText('Trailer · Public export, 2:22.')
  const fallback = dialog.getByRole('link', { name: 'Open in Google Drive', exact: true })
  await expect(fallback).toHaveAttribute('href', cck.replace('/preview', '/view'))
  await expect(fallback).toHaveAttribute('rel', 'noopener noreferrer')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('iframe')).toHaveCount(0)
  await expect(watch).toBeFocused()
})

test('Farewell AA plays from its approved source while unavailable titles retain their gate', async ({ page }) => {
  const requests = await stubDrive(page)
  await studio(page)
  await page.getByRole('radio', { name: 'Farewell video', exact: true }).check()
  await expect(page.locator('.screening-film-note')).toContainText('Farewell AA')
  await expect(page.locator('.screening-film-note')).toContainText('4:18')
  await expect(page.locator('.screening-still')).toHaveAttribute('src', '/media/farewell-film-still.jpg')
  await page.getByRole('button', { name: 'Play selected film: Farewell video', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Farewell video', exact: true })
  await expect(dialog.getByTitle('Farewell video — Google Drive player', { exact: true })).toHaveAttribute('src', farewell)
  await expect.poll(() => requests).toEqual([farewell])
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await page.getByRole('radio', { name: 'Masquerade trailer', exact: true }).check()
  await expect(page.locator('.screening-play')).toHaveCount(0)
  await expect(page.locator('.screening-film-note')).toContainText('Original film')
  await expect(page.locator('iframe')).toHaveCount(0)
  await expect(page.locator('.screening-ready-films .reel-frame')).toHaveCount(2)
  expect(requests).toEqual([farewell])
})

test('desktop playback preserves the chosen film and its opener until the modal closes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await stubDrive(page)
  await studio(page)
  await expect(page.locator('#studio')).toHaveAttribute('data-scroll-programme', 'true')
  const cckRow = page.locator('[data-film-id="cck-trailer"]')
  const farewellRow = page.locator('[data-film-id="farewell-video"]')
  await cckRow.evaluate(node => {
    const bounds = node.getBoundingClientRect()
    window.scrollTo({ top: Math.max(0, scrollY + bounds.top + bounds.height / 2 - innerHeight / 2), behavior: 'instant' })
  })
  await expect.poll(() => cckRow.evaluate(node => {
    const bounds = node.getBoundingClientRect()
    return bounds.top <= innerHeight / 2 && bounds.bottom >= innerHeight / 2
  })).toBe(true)
  await page.getByRole('radio', { name: 'Farewell video', exact: true }).check()
  const watch = page.getByRole('button', { name: 'Play selected film: Farewell video', exact: true })
  await watch.click()
  const dialog = page.getByRole('dialog', { name: 'Farewell video', exact: true })
  await expect(dialog).toBeVisible()
  // The projection's focusout callback runs on the next frame. While its
  // background is inert it must not replace the chosen film with the row at
  // the viewport midpoint, which would also remove the focus-return target.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await expect(page.locator('.screening-title-card h3')).toHaveText('Farewell video')
  await expect(farewellRow.locator('input')).toBeChecked()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(watch).toBeFocused()

  // Once focus leaves the projection, real scrolling can select titles again.
  await page.getByRole('link', { name: 'Ananda Priyan, home', exact: true }).focus()
  await expect(page.locator('.screening-title-card h3')).toHaveText('CCK trailer')
  const distance = await farewellRow.evaluate(node => {
    const bounds = node.getBoundingClientRect()
    return bounds.top + bounds.height / 2 - innerHeight / 2
  })
  await page.mouse.move(10, 500)
  await page.mouse.wheel(0, distance)
  await expect(page.locator('.screening-title-card h3')).toHaveText('Farewell video')
})

test('Drive modal and controls fit 320px and 390px phones without automatic playback', async ({ page }) => {
  await stubDrive(page)
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await studio(page)
    await expect(page.locator('iframe')).toHaveCount(0)
    const watch = page.getByRole('button', { name: 'Play selected film: CCK trailer', exact: true })
    expect((await watch.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    await watch.click()
    const dialog = page.getByRole('dialog', { name: 'CCK trailer', exact: true })
    const frame = dialog.locator('iframe')
    await expect(frame).toHaveAttribute('src', cck)
    const bounds = (await frame.boundingBox())!
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
    expect(bounds.width / bounds.height).toBeCloseTo(16 / 9, 1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    const close = dialog.getByRole('button', { name: 'Close dialog', exact: true })
    expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(40)
    await close.click()
    await expect(page.locator('iframe')).toHaveCount(0)
  }
})

test('a non-Drive embed target cannot create a playable title or third-party frame', async ({ page }) => {
  await page.route('**/src/content.ts*', async route => {
    const response = await route.fetch()
    const source = await response.text()
    await route.fulfill({ response, body: `${source}\n;creativeMedia.find(item=>item.id==='cck-trailer').embedUrl='https://drive.google.com.evil.invalid/file/d/foreign/preview';\n` })
  })
  await studio(page)
  await expect(page.locator('.screening-title-card h3')).toHaveText('CCK trailer')
  await expect(page.locator('.screening-play')).toHaveCount(0)
  await expect(page.locator('.screening-ready-films .reel-frame')).toHaveCount(1)
  await expect(page.locator('iframe')).toHaveCount(0)
  await page.getByRole('radio', { name: 'Farewell video', exact: true }).check()
  await expect(page.getByRole('button', { name: 'Play selected film: Farewell video', exact: true })).toBeVisible()
})
