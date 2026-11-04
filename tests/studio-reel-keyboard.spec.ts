import { test, expect, type Locator } from '@playwright/test'

test('advanced Studio reel reveals every keyboard-focused film forwards and backwards and restores its pointer offset', async ({ page, baseURL }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(origin => {
    if (location.origin !== origin) return
    sessionStorage.setItem('ap-atelier-loader-v4', 'seen')
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  }, new URL(baseURL!).origin)
  await page.route('**/studio-atmosphere-loop.mp4', route => route.abort())
  await page.goto('/studio')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('#studio')).toHaveAttribute('data-scroll-programme', 'true')
  const window = page.locator('.screening-ready-films')
  const reel = window.locator('.studio-reel')
  await window.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await expect.poll(() => reel.evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41)).toBeLessThan(-100)
  const initialHeight = (await window.boundingBox())!.height
  async function focusPreviousAction() {
    const moments = page.locator('.film-moments button')
    if (await moments.count()) await moments.last().focus()
    else await page.getByRole('button', { name: 'Watch CIRS website launch', exact: true }).focus()
  }
  await focusPreviousAction()
  const titles = ['CCK trailer', 'Farewell video', 'Vantara', 'TED-Ed auditions', 'CIRS website launch']
  const samples: unknown[] = []
  async function visible(button: Locator) {
    await expect(button).toBeFocused()
    await expect.poll(async () => {
      const card = (await button.boundingBox())!, clip = (await window.boundingBox())!
      return card.x >= clip.x - 1 && card.x + card.width <= clip.x + clip.width + 1 && card.y >= -1 && card.y + card.height <= 1001
    }).toBe(true)
    samples.push({ title: await button.getAttribute('aria-label'), card: await button.boundingBox(), window: await window.boundingBox(), scrollLeft: await window.evaluate(node => node.scrollLeft) })
  }
  for (const title of titles) {
    await page.keyboard.press('Tab')
    await visible(window.getByRole('button', { name: `Play ${title}`, exact: true }))
  }
  for (let index = titles.length - 1; index >= 0; index--) {
    if (index < titles.length - 1) await page.keyboard.press('Shift+Tab')
    await visible(window.getByRole('button', { name: `Play ${titles[index]}`, exact: true }))
  }
  expect((await window.boundingBox())!.height).toBeCloseTo(initialHeight, 1)
  await page.keyboard.press('Shift+Tab')
  await expect(window).not.toHaveAttribute('data-keyboard-reveal')
  await expect.poll(() => window.evaluate(node => node.scrollLeft)).toBe(0)
  await expect.poll(() => reel.evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41)).toBeLessThan(0)
  // A press inside the strip followed by release outside must not leave the
  // pointer guard latched and suppress the next genuine keyboard reveal.
  await window.evaluate(node => {
    node.scrollIntoView({ block: 'center', behavior: 'instant' })
    node.addEventListener('pointerdown', () => node.setAttribute('data-test-pressed', 'true'), { once: true })
  })
  const pressBox = (await window.boundingBox())!
  expect(pressBox.y + 5).toBeGreaterThan(0)
  expect(pressBox.y + 5).toBeLessThan(1000)
  await page.mouse.move(pressBox.x + 5, pressBox.y + 5)
  await page.mouse.down()
  await expect(window).toHaveAttribute('data-test-pressed', 'true')
  await page.mouse.move(10, 10)
  await page.mouse.up()
  await focusPreviousAction()
  await page.keyboard.press('Tab')
  await visible(window.getByRole('button', { name: 'Play CCK trailer', exact: true }))
  await page.keyboard.press('Shift+Tab')
  await expect(window).not.toHaveAttribute('data-keyboard-reveal')
  await expect.poll(() => window.evaluate(node => node.scrollLeft)).toBe(0)
  await testInfo.attach('ready-reel-native-keyboard-visibility', { body: JSON.stringify(samples, null, 2), contentType: 'application/json' })
})
