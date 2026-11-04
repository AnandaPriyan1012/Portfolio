import { test, expect, type Page, type Route } from '@playwright/test'

const cck = 'https://drive.google.com/file/d/1FXMI8GoosQllewx87S8_lJDXRULukrYA/preview'
const farewell = 'https://drive.google.com/file/d/1zxuYX1UAG8FwYlfYhWP-SAnP4jaRx5MN/preview'
const fixture = '<!doctype html><title>Isolated player document</title><button onclick="this.textContent=\'Started fixture\'">Play fixture</button>'

async function holdDrive(page: Page) {
  const requests: Route[] = []
  await page.route('https://drive.google.com/**', route => { requests.push(route) })
  return requests
}

async function studio(page: Page) {
  await page.goto('/studio')
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
}

async function release(route: Route) {
  await route.fulfill({ contentType: 'text/html', body: fixture })
}

test('a delayed Drive document keeps its fallback usable, then restores player interaction without moving focus', async ({ page }) => {
  const requests = await holdDrive(page)
  await studio(page)
  expect(requests).toHaveLength(0)
  const watch = page.getByRole('button', { name: 'Play selected film: CCK trailer', exact: true })
  await watch.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'CCK trailer', exact: true })
  const frame = dialog.locator('iframe')
  const status = dialog.getByRole('status')
  const fallback = dialog.getByRole('link', { name: 'Open in Google Drive', exact: true })
  await expect.poll(() => requests.length).toBe(1)
  await expect(dialog.locator('.drive-film-frame')).toHaveAttribute('aria-busy', 'true')
  await expect(status).toHaveText('Opening Google Drive…')
  expect(await status.evaluate(node => node.closest('[aria-busy="true"]'))).toBeNull()
  await expect(frame).toHaveAttribute('src', cck)
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation')
  await expect(frame).toHaveAttribute('allow', 'fullscreen; encrypted-media')
  await expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer')

  // An empty frame must not receive pointer or keyboard focus while it opens.
  const box = (await frame.boundingBox())!
  expect(await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('.drive-film-status'), {
    x: box.x + box.width / 2, y: box.y + box.height / 2,
  })).toBe(true)
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  expect(await frame.evaluate(node => document.activeElement === node)).toBe(false)
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(fallback).toBeFocused()
  await expect(fallback).toHaveAttribute('href', cck.replace('/preview', '/view'))

  await release(requests[0])
  await expect(dialog.locator('.drive-film-frame')).toHaveAttribute('aria-busy', 'false')
  await expect(status).toBeEmpty()
  await expect(fallback).toBeFocused()
  // Once the document opens, standard keyboard navigation reaches its controls.
  await page.keyboard.press('Shift+Tab')
  const play = page.frameLocator('.drive-film-frame iframe').getByRole('button', { name: 'Play fixture', exact: true })
  await expect(play).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.frameLocator('.drive-film-frame iframe').getByRole('button', { name: 'Started fixture', exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await expect(watch).toBeFocused()
})

test('a blocked cross-origin frame retains the direct fallback without claiming playback success', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const requests = await holdDrive(page)
  await studio(page)
  const watch = page.getByRole('button', { name: 'Play selected film: CCK trailer', exact: true })
  await watch.click()
  await expect.poll(() => requests.length).toBe(1)
  await requests[0].abort('failed')
  const dialog = page.getByRole('dialog', { name: 'CCK trailer', exact: true })
  const fallback = dialog.getByRole('link', { name: 'Open in Google Drive', exact: true })
  // Browsers may emit iframe load even for an error document. It cannot be
  // treated as evidence that a cross-origin film loaded or started playing.
  await expect(dialog).toContainText('If it stays blank, open it in Google Drive.')
  await expect(dialog).not.toContainText(/ready to play|playing now|film loaded|playback started/i)
  await expect(fallback).toBeVisible()
  await fallback.focus()
  await expect(fallback).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(watch).toBeFocused()
  expect(errors).toEqual([])
})

test('a stalled document remains honestly busy but cannot leave the frame locked indefinitely', async ({ page }) => {
  const requests = await holdDrive(page)
  await studio(page)
  await page.clock.install()
  await page.getByRole('button', { name: 'Play selected film: CCK trailer', exact: true }).click()
  await expect.poll(() => requests.length).toBe(1)
  const dialog = page.getByRole('dialog', { name: 'CCK trailer', exact: true })
  const frame = dialog.locator('iframe')
  const fallback = dialog.getByRole('link', { name: 'Open in Google Drive', exact: true })
  await fallback.focus()
  await page.clock.fastForward(8100)
  await expect(dialog.getByRole('status')).toContainText('Google Drive is taking longer to open.')
  await expect(dialog.locator('.drive-film-frame')).toHaveAttribute('aria-busy', 'true')
  await expect(frame).not.toHaveAttribute('inert')
  await expect(frame).toHaveAttribute('tabindex', '0')
  await expect(frame).toHaveCSS('pointer-events', 'auto')
  await expect(fallback).toBeFocused()
  const box = (await frame.boundingBox())!
  expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, {
    x: box.x + box.width / 2, y: box.y + box.height / 2,
  })).toBe('IFRAME')
  await release(requests[0])
  await expect(dialog.locator('.drive-film-frame')).toHaveAttribute('aria-busy', 'false')
  await expect(fallback).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('closing a pending frame and choosing another film starts a fresh loading state', async ({ page }) => {
  const requests = await holdDrive(page)
  await studio(page)
  await page.getByRole('button', { name: 'Play selected film: CCK trailer', exact: true }).click()
  await expect.poll(() => requests.length).toBe(1)
  await page.keyboard.press('Escape')
  await expect(page.locator('iframe')).toHaveCount(0)
  await page.getByRole('radio', { name: 'Farewell video', exact: true }).check()
  const watch = page.getByRole('button', { name: 'Play selected film: Farewell video', exact: true })
  await watch.click()
  await expect.poll(() => requests.length).toBe(2)
  const dialog = page.getByRole('dialog', { name: 'Farewell video', exact: true })
  expect(requests.map(route => route.request().url())).toEqual([cck, farewell])
  await expect(dialog.locator('.drive-film-frame')).toHaveAttribute('aria-busy', 'true')
  await expect(dialog.getByRole('status')).toHaveText('Opening Google Drive…')
  // Finishing a canceled request must not clear the new film's loading state.
  await release(requests[0]).catch(() => {})
  await expect(dialog.locator('.drive-film-frame')).toHaveAttribute('aria-busy', 'true')
  await release(requests[1])
  await expect(dialog.locator('.drive-film-frame')).toHaveAttribute('aria-busy', 'false')
  await page.keyboard.press('Escape')
  await expect(watch).toBeFocused()
})

for (const width of [320, 390]) {
  test.describe(`${width}px touch loading feedback`, () => {
    test.use({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true })
    test('the pending frame, fallback and close control fit, and tapping works after load', async ({ page }) => {
      const requests = await holdDrive(page)
      await studio(page)
      await page.clock.install()
      const watch = page.getByRole('button', { name: 'Play selected film: CCK trailer', exact: true })
      await watch.tap()
      await expect.poll(() => requests.length).toBe(1)
      const dialog = page.getByRole('dialog', { name: 'CCK trailer', exact: true })
      const frame = dialog.locator('iframe')
      const status = dialog.getByRole('status')
      const fallback = dialog.getByRole('link', { name: 'Open in Google Drive', exact: true })
      const box = (await frame.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
      expect(box.width / box.height).toBeCloseTo(16 / 9, 1)
      await expect(status).toHaveText('Opening Google Drive…')
      await expect(fallback).toBeInViewport()
      expect((await fallback.boundingBox())!.height).toBeGreaterThanOrEqual(44)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
      expect(await frame.evaluate(node => document.activeElement === node)).toBe(false)
      await page.clock.fastForward(8100)
      await expect(status).toContainText('Google Drive is taking longer to open.')
      await expect(dialog.locator('.drive-film-frame')).toHaveAttribute('aria-busy', 'true')
      await expect(fallback).toBeInViewport({ ratio: 1 })
      await expect(frame).not.toHaveAttribute('inert')
      await release(requests[0])
      await expect(dialog.locator('.drive-film-frame')).toHaveAttribute('aria-busy', 'false')
      const play = page.frameLocator('.drive-film-frame iframe').getByRole('button', { name: 'Play fixture', exact: true })
      await play.tap()
      await expect(page.frameLocator('.drive-film-frame iframe').getByRole('button', { name: 'Started fixture', exact: true })).toBeVisible()
      await dialog.getByRole('button', { name: 'Close dialog', exact: true }).tap()
      await expect(dialog).toHaveCount(0)
      await expect(watch).toBeFocused()
    })
  })
}
