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
  await expect(page.locator('.screening-still')).toHaveCount(0)
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
