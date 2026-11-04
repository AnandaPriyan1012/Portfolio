import { test as base, expect } from '@playwright/test'

const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await use()
    expect(errors, 'Navigation does not cause uncaught browser errors').toEqual([])
  }, { auto: true }],
})

const caseLinks = [
  { label: 'CIRS case study', selector: '#cirs .story-links a[href="/projects/cirs"]', path: '/projects/cirs' },
  { label: 'Vallalar case study', selector: '#community .feature-footer a[href="/projects/community"]', path: '/projects/community' },
  { label: 'AccuFlow notes', selector: '#accuflow .feature-footer a[href="/projects/accuflow"]', path: '/projects/accuflow' },
  { label: 'footer home wordmark', selector: '.footer-wordmark', path: '/' },
] as const

for (const link of caseLinks) {
  for (const method of ['modified click', 'middle click'] as const) {
    test(`${method} on ${link.label} opens its native new tab and leaves Work intact`, async ({ page, context }) => {
      await page.goto('/work')
      const [tab] = await Promise.all([
        context.waitForEvent('page'),
        page.locator(link.selector).click(method === 'middle click'
          ? { button: 'middle' }
          : { modifiers: ['ControlOrMeta'] }),
      ])
      await expect(tab).toHaveURL(new RegExp(`${link.path}$`))
      await expect(tab.locator('h1')).toHaveCount(1)
      await expect(page).toHaveURL(/\/work$/)
      await expect(page.locator('main')).toHaveAttribute('data-page', 'work')
      await tab.close()
    })
  }
}

test('a modified quick-view case link opens separately and leaves the dialog and selection intact', async ({ page, context }) => {
  await page.goto('/work')
  await page.locator('#cirs').getByRole('button', { name: 'Quick view', exact: true }).click()
  const dialog = page.getByRole('dialog')
  const [tab] = await Promise.all([
    context.waitForEvent('page'),
    dialog.getByRole('link', { name: 'Explore the full case study', exact: true }).click({ modifiers: ['ControlOrMeta'] }),
  ])
  await expect(tab).toHaveURL(/\/projects\/cirs$/)
  await expect(page).toHaveURL(/\/work$/)
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('h2')).toHaveText('CIRS Website')
  await tab.close()
})

for (const width of [320, 390]) {
  test(`${width}px mobile menu follows keyboard order and Escape returns focus only while open`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/work')
    const menu = page.locator('.menu-button')
    const navigation = page.getByRole('navigation', { name: 'Main navigation' })
    const work = navigation.getByRole('link', { name: 'Work', exact: true })
    const studio = navigation.getByRole('link', { name: 'Studio', exact: true })
    await menu.focus()
    await page.keyboard.press('Enter')
    await expect(menu).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Tab')
    await expect(work).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(studio).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(navigation).toBeHidden()
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
    await expect(menu).toBeFocused()

    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/studio$/)
    await expect(page.locator('h1')).toBeFocused()
    await expect(navigation).toBeHidden()
    await page.keyboard.press('Escape')
    await expect(page.locator('h1')).toBeFocused()
  })
}

test('keyboard case entry focuses its heading and returns to the original Work scroll position', async ({ page }) => {
  await page.goto('/work')
  await page.evaluate(() => document.fonts.ready)
  const link = page.locator('#community').getByRole('link', { name: 'Read the case study', exact: true })
  await link.focus()
  const returnTop = await page.evaluate(() => scrollY)
  expect(returnTop, 'The return location is within the selected project, below the Work opening').toBeGreaterThan(500)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects\/community$/)
  await expect(page.locator('h1')).toContainText('Vallalar Sathya Dharmasalai')
  await expect(page.locator('h1')).toBeFocused()
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)

  await page.getByRole('button', { name: 'Back to portfolio', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/work$/)
  await expect(link).toBeFocused()
  await expect(link).toBeInViewport()
  expect(await link.getAttribute('tabindex')).toBeNull()
  await expect.poll(() => page.evaluate(top => Math.abs(scrollY - top), returnTop)).toBeLessThan(4)
  await expect(page.locator('#community')).toBeInViewport()
})

test('Escape still closes a native dialog if the mobile menu was left open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/work')
  await page.getByRole('button', { name: 'Open menu', exact: true }).click()
  const quick = page.locator('#cirs').getByRole('button', { name: 'Quick view', exact: true })
  await quick.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.menu-button')).toHaveAttribute('aria-expanded', 'false')
  await expect(quick).toBeFocused()
})

test('keyboard quick-view case entry focuses the new heading after dialog cleanup', async ({ page }) => {
  await page.goto('/work')
  const quick = page.locator('#cirs').getByRole('button', { name: 'Quick view', exact: true })
  await quick.focus()
  await page.keyboard.press('Enter')
  const fullCase = page.getByRole('dialog').getByRole('link', { name: 'Explore the full case study', exact: true })
  await fullCase.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects\/cirs$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('h1')).toBeFocused()
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await expect(page.locator('h1')).toBeFocused()
})

for (const width of [390, 1440]) {
  test(`${width}px keyboard Contact navigation continues directly to the email and personal card`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/work')
    if (width < 768) {
      await page.getByRole('button', { name: 'Open menu', exact: true }).focus()
      await page.keyboard.press('Enter')
    }
    const contact = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact', exact: true })
    await contact.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/about#contact$/)
    const heading = page.locator('#contact h2')
    await expect(heading).toBeFocused()
    await expect(heading).toBeInViewport()
    const contactTop = await page.evaluate(() => scrollY)
    await page.keyboard.press('Tab')
    const email = page.locator('.contact-identity-copy').getByRole('link', { name: 'anandapriyan1012@gmail.com', exact: true })
    await expect(email).toBeFocused()
    await expect(email).toBeInViewport()
    expect(await page.evaluate(() => scrollY)).toBeGreaterThanOrEqual(contactTop - 4)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Show contact side', exact: true })).toBeFocused()
    await expect(page.getByRole('button', { name: 'Show contact side', exact: true })).toBeInViewport()
  })
}

test('the swimmer handoff focuses the About section and continues to its selected lane', async ({ page }) => {
  await page.goto('/work')
  await page.getByRole('button', { name: 'Take the 60-second tour', exact: true }).click()
  const tour = page.locator('.tour-panel')
  for (let index = 0; index < 4; index++) {
    await tour.getByRole('button', { name: 'Next tour chapter', exact: true }).click()
  }
  await tour.getByRole('button', { name: 'Meet the swimmer', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/about#about$/)
  await expect(tour).toHaveCount(0)
  await expect(page.locator('#about h2')).toBeFocused()
  await expect(page.locator('#about h2')).toBeInViewport()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('tab', { name: 'Swimmer', exact: true })).toBeFocused()
  await expect(page.getByRole('tab', { name: 'Swimmer', exact: true })).toHaveAttribute('aria-selected', 'true')
})

for (const fragment of ['missing-section', 'site-nav', '%E0%A4%A']) {
  test(`a fragment replaced during navigation keeps safe page focus for ${fragment}`, async ({ page }) => {
    await page.goto('/work')
    // A second click listener can replace a fragment before the route commits.
    // Missing, malformed, and out-of-main targets must all retain a useful fallback.
    await page.evaluate(hash => {
      window.addEventListener('click', () => {
        history.replaceState(history.state, '', `/about#${hash}`)
      }, { once: true })
    }, fragment)
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#${fragment}`)
    await expect(page.locator('main')).toHaveAttribute('data-page', 'about')
    await expect(page.locator('h1')).toBeFocused()
  })
}
