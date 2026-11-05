import { test, expect, type Page } from '@playwright/test'

const email = 'anandapriyan1012@gmail.com'

async function ready(page: Page, path = '/about') {
  await page.goto(path)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.identity-card')).toBeVisible()
}

for (const [width, height] of [[1440, 1000], [1200, 800], [1024, 1000], [768, 1024], [390, 844], [320, 568]]) {
  test(`${width}x${height} carries the About page into an undistorted, reachable personal card`, async ({ browser, baseURL }, testInfo) => {
    const context = await browser.newContext({ baseURL, viewport: { width, height },
      isMobile: width < 768, hasTouch: width < 768, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    try {
      await ready(page)
      const contact = page.locator('#contact')
      const geometry = await contact.evaluate(node => {
        const section = node.getBoundingClientRect(), style = getComputedStyle(node)
        const stage = node.querySelector('.identity-card-stage')!.getBoundingClientRect()
        const art = getComputedStyle(node, '::before')
        const recognition = document.querySelector('#recognition')!.getBoundingClientRect()
        return { top: section.top + scrollY, recognitionBottom: recognition.bottom + scrollY,
          borderTop: style.borderTopWidth, borderBottom: style.borderBottomWidth,
          background: style.backgroundColor, art: art.backgroundImage, mask: art.maskImage,
          artTransform: art.transform, artSize: art.backgroundSize, ratio: stage.width / stage.height }
      })
      // The scene uses the original photograph, uniformly cropped, with feathered
      // edges instead of a rectangular frame separating it from the About page.
      expect(geometry.art).toContain('/media/atelier-room-wide.webp')
      expect(geometry.artSize).toContain('cover')
      expect(geometry.artTransform).toBe('none')
      expect(geometry.mask).toContain('linear-gradient')
      expect(geometry.mask.match(/rgba\(0, 0, 0, 0\)/g)).toHaveLength(2)
      expect(geometry.borderTop).toBe('0px')
      expect(geometry.borderBottom).toBe('0px')
      expect(geometry.background).toBe('rgba(0, 0, 0, 0)')
      expect(Math.abs(geometry.ratio - 1.586)).toBeLessThan(.002)
      expect(Math.abs(geometry.top - geometry.recognitionBottom)).toBeLessThan(1)

      const maximumScroll = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
      // Leave native wheel travel below the screenshot position, including
      // taller desktops where the entire final scene nearly fits the viewport.
      const target = Math.max(0, Math.min(geometry.top - 180, maximumScroll - 140))
      await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), target)
      await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), target)).toBeLessThan(1)
      await testInfo.attach('recognition-to-personal-card', { body: await page.screenshot(), contentType: 'image/png' })
      const before = await page.evaluate(() => scrollY)
      await page.mouse.wheel(0, 120)
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 100)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      await expect(page.locator('.pin-spacer')).toHaveCount(0)

      const card = page.locator('.identity-card')
      const directEmail = contact.locator('.contact-action')
      await expect(directEmail).toHaveAttribute('href', `mailto:${email}`)
      await directEmail.focus()
      await expect(directEmail).toBeInViewport()
      await page.keyboard.press('Tab')
      await expect(card.getByRole('button', { name: 'Show contact side', exact: true })).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(card).toHaveAttribute('data-side', 'contact')
      await expect(card.getByRole('button', { name: 'Show signature side', exact: true })).toBeFocused()
      await page.keyboard.press('Tab')
      const cardEmail = card.getByRole('link', { name: email, exact: true })
      await expect(cardEmail).toBeFocused()
      await expect(cardEmail).toHaveAttribute('href', `mailto:${email}`)
      const bounds = await card.locator('.identity-card-stage').boundingBox()
      expect(bounds!.x).toBeGreaterThanOrEqual(0)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
      const save = card.getByRole('link', { name: 'Save contact', exact: true })
      await expect(save).toHaveAttribute('download', 'ananda-priyan.vcf')
      const vcard = decodeURIComponent((await save.getAttribute('href'))!.split(',')[1])
      expect(vcard).toContain(`EMAIL:${email}\r\n`)
      expect(vcard).toContain('URL:https://anandapriyan.vercel.app\r\n')
      expect(errors).toEqual([])
    } finally { await context.close() }
  })
}

for (const mode of ['reduced', 'off', 'save-data', 'forced-colors'] as const) {
  test(`${mode} keeps the About contact transition static and usable`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference',
      forcedColors: mode === 'forced-colors' ? 'active' : 'none' })
    if (mode === 'off') await page.addInitScript(() => localStorage.setItem('ap-motion', 'off'))
    if (mode === 'save-data') await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }))
    await ready(page, '/about#contact')
    const card = page.locator('.identity-card')
    await expect(card).toHaveAttribute('data-tilt', 'disabled')
    await expect(card.locator('.identity-card-turn')).toHaveCSS('transition-duration', '0s')
    expect(await page.locator('#contact').evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0)
    await card.getByRole('button', { name: 'Show contact side', exact: true }).click()
    await expect(card.getByRole('link', { name: email, exact: true })).toBeVisible()
    await card.getByRole('button', { name: 'Show signature side', exact: true }).click()
    await expect(card).toHaveAttribute('data-side', 'signature')
    await expect(card.getByRole('link', { name: 'Save contact', exact: true })).toBeVisible()
    await testInfo.attach('static-personal-card', { body: await page.screenshot(), contentType: 'image/png' })
  })
}

for (const width of [1440, 390]) {
  test(`${width}px personal card makes a full lateral turn and settles before changing keyboard focus`, async ({ browser, baseURL }, testInfo) => {
    const touch = width < 768
    const context = await browser.newContext({ baseURL, viewport: { width, height: 1000 },
      hasTouch: touch, isMobile: touch, reducedMotion: 'no-preference' })
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
    })
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    try {
      await ready(page, '/about#contact')
      const card = page.locator('.identity-card'), turn = card.locator('.identity-card-turn')
      await expect(card).toHaveAttribute('data-motion', 'on')
      await expect(card).toHaveAttribute('data-tilt', touch ? 'disabled' : 'enabled')
      const signature = card.getByRole('button', { name: 'Show contact side', exact: true })
      await signature.focus()
      const top = await page.evaluate(() => scrollY)
      await page.keyboard.press('Enter')
      await expect(card).toHaveAttribute('data-turning', 'true')
      await expect(signature).toBeFocused()
      await expect(card.locator('.identity-card-side-note')).toHaveText('Personal card / Signature')
      await expect(card.locator('.identity-card-back')).toHaveAttribute('inert', '')

      // Pause an actual browser CSS transition to inspect both halves of the
      // same physical turn, independent of screenshot or worker timing.
      const samples = []
      for (const fraction of [.18, .55]) {
        const sample = await turn.evaluate((node, progress) => {
          const animation = node.getAnimations().find(item => item instanceof CSSTransition && item.transitionProperty === 'transform')
          if (!animation) throw new Error('The card must be moving through a real transform transition')
          animation.pause()
          const duration = Number(animation.effect!.getComputedTiming().duration)
          animation.currentTime = duration * progress
          const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform)
          const faces = [...node.querySelectorAll('.identity-card-face')].map(face => {
            const style = getComputedStyle(face)
            const composite = matrix.multiply(new DOMMatrixReadOnly(style.transform))
            return { face: face.classList.contains('identity-card-back') ? 'back' : 'front',
              visibility: style.visibility, display: style.display, backface: style.backfaceVisibility,
              facing: composite.m33, horizontal: composite.m11 }
          })
          return { fraction: progress, duration, angle: Math.abs(Math.atan2(matrix.m13, matrix.m11) * 180 / Math.PI), faces }
        }, fraction)
        expect(sample.duration).toBeGreaterThanOrEqual(600)
        expect(sample.duration).toBeLessThanOrEqual(900)
        expect(sample.angle).toBeGreaterThan(10)
        expect(sample.angle).toBeLessThan(180)
        for (const face of sample.faces) {
          expect(face.display).not.toBe('none')
          expect(face.visibility).toBe('visible')
          expect(face.backface).toBe('hidden')
        }
        expect(sample.faces.filter(face => face.facing > 0)).toHaveLength(1)
        expect(sample.faces.find(face => face.facing > 0)!.horizontal).toBeGreaterThan(0)
        samples.push(sample)
        await testInfo.attach(`lateral-turn-${fraction}`, { body: await page.screenshot(), contentType: 'image/png' })
      }
      expect(samples[0].faces.find(face => face.facing > 0)!.face).toBe('front')
      expect(samples[1].faces.find(face => face.facing > 0)!.face).toBe('back')
      await turn.evaluate(node => node.getAnimations().forEach(animation => animation.finish()))
      await expect(card).toHaveAttribute('data-turning', 'false')
      const contact = card.getByRole('button', { name: 'Show signature side', exact: true })
      await expect(contact).toBeFocused()
      await expect(card.locator('.identity-card-front')).toHaveAttribute('inert', '')
      const cardEmail = card.getByRole('link', { name: email, exact: true })
      await expect(cardEmail).toHaveAttribute('href', `mailto:${email}`)
      await expect(cardEmail).toBeVisible()
      expect(await cardEmail.evaluate(node => {
        const rect = node.getBoundingClientRect()
        return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest('a') === node
      })).toBe(true)
      expect(await page.evaluate(y => Math.abs(scrollY - y), top)).toBeLessThan(1)

      for (let repetition = 0; repetition < 2; repetition++) {
        if (touch) await contact.tap()
        else await page.keyboard.press('Space')
        await expect(card).toHaveAttribute('data-turning', 'true')
        await expect(card).toHaveAttribute('data-turning', 'false')
        await expect(card).toHaveAttribute('data-side', 'signature')
        if (touch) await signature.tap()
        else {
          await expect(signature).toBeFocused()
          await page.keyboard.press('Enter')
        }
        await expect(card).toHaveAttribute('data-turning', 'true')
        await expect(card).toHaveAttribute('data-turning', 'false')
        await expect(cardEmail).toBeVisible()
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      expect(errors).toEqual([])
      await testInfo.attach('lateral-turn-geometry', { body: JSON.stringify(samples), contentType: 'application/json' })
    } finally { await context.close() }
  })
}

test('a motion change settles an active card turn and Tab keeps its deliberate focus destination', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page, '/about#contact')
  const card = page.locator('.identity-card')
  await expect(card).toHaveAttribute('data-motion', 'on')
  await card.getByRole('button', { name: 'Show contact side', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(card).toHaveAttribute('data-turning', 'true')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(card).toHaveAttribute('data-turning', 'false')
  await expect(card.locator('.identity-card-turn')).toHaveCSS('transition-duration', '0s')
  const showSignature = card.getByRole('button', { name: 'Show signature side', exact: true })
  await expect(showSignature).toBeFocused()
  await expect(card.getByRole('link', { name: email, exact: true })).toBeVisible()

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(card).toHaveAttribute('data-motion', 'on')
  await page.keyboard.press('Space')
  await expect(card).toHaveAttribute('data-turning', 'true')
  await page.keyboard.press('Tab')
  // Contact remains the exposed face until the turn completes, so its email
  // follows the old flip button. Finishing must not steal that native Tab move.
  const emailDuringTurn = card.getByRole('link', { name: email, exact: true })
  await expect(emailDuringTurn).toBeFocused()
  await page.keyboard.press('Tab')
  const save = card.getByRole('link', { name: 'Save contact', exact: true })
  await expect(save).toBeFocused()
  await expect(card).toHaveAttribute('data-turning', 'false')
  await expect(save).toBeFocused()
})

test('leaving during a turn and returning starts a complete usable card without a stale focus timer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready(page, '/about#contact')
  let card = page.locator('.identity-card')
  await expect(card).toHaveAttribute('data-motion', 'on')
  await card.getByRole('button', { name: 'Show contact side', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(card).toHaveAttribute('data-turning', 'true')
  await page.locator('.site-header a[href="/work"]').click()
  await expect(page).toHaveURL(/\/work$/)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(page.locator('main h1')).toBeFocused()
  await page.goBack()
  await expect(page).toHaveURL(/\/about#contact$/)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  card = page.locator('.identity-card')
  await expect(card).toHaveAttribute('data-side', 'signature')
  await expect(card).toHaveAttribute('data-turning', 'false')
  await card.getByRole('button', { name: 'Show contact side', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(card).toHaveAttribute('data-turning', 'true')
  await expect(card).toHaveAttribute('data-turning', 'false')
  await expect(card.getByRole('button', { name: 'Show signature side', exact: true })).toBeFocused()
  await expect(card.getByRole('link', { name: email, exact: true })).toHaveAttribute('href', `mailto:${email}`)
})
