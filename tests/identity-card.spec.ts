import { test as base, expect, type Locator, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const email = 'anandapriyan1012@gmail.com'
const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await use()
    expect(errors, 'No uncaught errors from the personal card').toEqual([])
  }, { auto: true }],
})

async function ready(page: Page) {
  await page.goto('/about#contact')
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  const card = page.locator('figure.identity-card')
  await expect(card).toBeVisible()
  return card
}

async function tilt(card: Locator) {
  return card.evaluate(node => {
    const style = getComputedStyle(node)
    return {
      x: parseFloat(style.getPropertyValue('--card-rx')) || 0,
      y: parseFloat(style.getPropertyValue('--card-ry')) || 0,
    }
  })
}

test('keyboard users can turn the card while the hidden contact face stays out of the tab order', async ({ page }) => {
  const card = await ready(page)
  const turn = card.getByRole('button', { name: 'Turn card', exact: true })
  const directEmail = page.locator('#contact .contact-action')
  const cardEmail = card.getByRole('link', { name: email, exact: true })
  await expect(directEmail).toHaveAttribute('href', `mailto:${email}`)
  await expect(directEmail).toBeVisible()
  await expect(card.locator('.contact-action')).toHaveCount(0)
  await expect(card).toHaveAttribute('data-side', 'signature')
  await expect(turn).toHaveAttribute('aria-pressed', 'false')
  await expect(cardEmail).toHaveCount(0)
  await turn.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(directEmail).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(turn).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(card).toHaveAttribute('data-side', 'contact')
  await expect(turn).toHaveAttribute('aria-pressed', 'true')
  await expect(cardEmail).toHaveAttribute('href', `mailto:${email}`)
  await expect(cardEmail).toBeVisible()
  await page.keyboard.press('Shift+Tab')
  await expect(cardEmail).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(turn).toBeFocused()
  await page.keyboard.press('Space')
  await expect(card).toHaveAttribute('data-side', 'signature')
  await expect(turn).toHaveAttribute('aria-pressed', 'false')
  await expect(cardEmail).toHaveCount(0)
  await page.keyboard.press('Shift+Tab')
  await expect(directEmail).toBeFocused()
  await expect(directEmail).toBeVisible()
})

test('Save contact downloads a valid named vCard with the confirmed email and public portfolio', async ({ page }) => {
  const card = await ready(page)
  const save = card.getByRole('link', { name: 'Save contact', exact: true })
  await expect(save).toHaveAttribute('download', 'ananda-priyan.vcf')
  const pending = page.waitForEvent('download')
  await save.click()
  const download = await pending
  expect(download.suggestedFilename()).toBe('ananda-priyan.vcf')
  expect(await download.failure()).toBeNull()
  const file = await download.path()
  expect(file).toBeTruthy()
  const contents = (await readFile(file!, 'utf8')).replace(/\r\n[ \t]/g, '').replace(/\r\n/g, '\n')
  expect(contents).toMatch(/^BEGIN:VCARD\n/)
  expect(contents).toMatch(/^VERSION:4\.0$/m)
  expect(contents).toMatch(/^FN(?:;[^:]*)?:Ananda Priyan$/m)
  expect(contents).toMatch(/^EMAIL(?:;[^:]*)?:anandapriyan1012@gmail\.com$/m)
  expect(contents).toMatch(/^URL(?:;[^:]*)?:https:\/\/anandapriyan\.vercel\.app\/?$/m)
  expect(contents.trimEnd()).toMatch(/\nEND:VCARD$/)
  await expect(page).toHaveURL(/\/about#contact$/)
  await expect(page.locator('#contact .contact-action')).toHaveAttribute('href', `mailto:${email}`)
})

test('pointer tilt responds on desktop while user and system motion settings retain an instant usable turn', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const card = await ready(page)
  const surface = card.locator('.identity-card-stage')
  const turn = card.getByRole('button', { name: 'Turn card', exact: true })
  await surface.scrollIntoViewIfNeeded()
  await expect(card).toHaveAttribute('data-tilt', 'enabled')
  const box = (await surface.boundingBox())!
  await page.mouse.move(box.x + box.width * .2, box.y + box.height * .2)
  await expect.poll(async () => { const value = await tilt(card); return Math.abs(value.x) + Math.abs(value.y) }).toBeGreaterThan(.5)
  const first = await tilt(card)
  await page.mouse.move(box.x + box.width * .8, box.y + box.height * .8)
  await expect.poll(async () => (await tilt(card)).x * first.x).toBeLessThan(0)
  await expect.poll(async () => (await tilt(card)).y * first.y).toBeLessThan(0)

  await page.getByRole('button', { name: 'Motion on', exact: true }).click()
  await expect(card).toHaveAttribute('data-tilt', 'disabled')
  await surface.hover({ position: { x: 40, y: 40 } })
  expect(await tilt(card)).toEqual({ x: 0, y: 0 })
  await expect(card.locator('.identity-card-turn')).toHaveCSS('transition-duration', '0s')
  await turn.focus()
  await page.keyboard.press('Enter')
  await expect(card).toHaveAttribute('data-side', 'contact')
  await expect(card.getByRole('link', { name: email, exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Motion off', exact: true }).click()
  await expect(card).toHaveAttribute('data-tilt', 'enabled')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(card).toHaveAttribute('data-tilt', 'disabled')
  await surface.hover({ position: { x: 40, y: 40 } })
  expect(await tilt(card)).toEqual({ x: 0, y: 0 })
  await expect(card.locator('.identity-card-turn')).toHaveCSS('transition-duration', '0s')
  await turn.focus()
  await page.keyboard.press('Space')
  await expect(card).toHaveAttribute('data-side', 'signature')
  await expect(card.getByRole('link', { name: email, exact: true })).toHaveCount(0)
  await expect(page.locator('#contact .contact-action')).toBeVisible()
})

test('touch users can turn both ways at 320px and 390px with fitting content and usable controls', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'This check uses Chromium touch emulation, not a claim of physical-device testing.')
  for (const width of [320, 390]) {
    const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173', viewport: { width, height: 844 }, reducedMotion: 'no-preference', hasTouch: true, isMobile: true })
    try {
      const page = await context.newPage()
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      const card = await ready(page)
      await expect(card).toHaveAttribute('data-tilt', 'disabled')
      const turn = card.getByRole('button', { name: 'Turn card', exact: true })
      for (const control of [turn, card.getByRole('link', { name: 'Save contact', exact: true })]) {
        const bounds = (await control.boundingBox())!
        expect(bounds.width).toBeGreaterThanOrEqual(44)
        expect(bounds.height).toBeGreaterThanOrEqual(44)
      }
      const bounds = (await card.boundingBox())!
      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      await turn.tap()
      await expect(card).toHaveAttribute('data-side', 'contact')
      await expect(turn).toHaveAttribute('aria-pressed', 'true')
      await expect(card.getByRole('link', { name: email, exact: true })).toHaveAttribute('href', `mailto:${email}`)
      await expect(page.locator('#contact .contact-action')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      await turn.tap()
      await expect(card).toHaveAttribute('data-side', 'signature')
      await expect(card.getByRole('link', { name: email, exact: true })).toHaveCount(0)
      await expect(card).toHaveAttribute('data-tilt', 'disabled')
      expect(errors, `${width}px touch card`).toEqual([])
    } finally { await context.close() }
  }
})
