import { test, expect } from '@playwright/test'

const projects = [
  { id: 'cirs', title: 'CIRS', purpose: 'Campus life & Admissions', status: 'Official school website · Live' },
  { id: 'community', title: 'Vallalar', purpose: 'Website & digital storytelling', status: 'Voluntary since 2023 · Website review preview' },
  { id: 'accuflow', title: 'AccuFlow', purpose: 'Six-page website & conversational guide', status: 'Exploratory prototype' },
] as const

for (const width of [320, 390]) test.describe(`${width}px Work context`, () => {
  test.use({ viewport: { width, height: 844 }, hasTouch: true, isMobile: true })

  for (const mode of ['dark', 'light', 'forced colors'] as const) test(`${mode} keeps real purpose and readiness readable beside the native links`, async ({ page }) => {
    if (mode === 'light') await page.addInitScript(() => localStorage.setItem('ap-atelier-theme', 'light'))
    if (mode === 'forced colors') await page.emulateMedia({ forcedColors: 'active' })
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/work')
    await expect(page.locator('.state-opening')).toHaveCount(0)
    await page.evaluate(() => document.fonts.ready)
    const fonts = await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family))
    expect(fonts).toContain('Syne Variable')
    expect(fonts).toContain('Instrument Sans Variable')
    const index = page.getByRole('navigation', { name: 'Explore selected projects' })
    await expect(index.locator('a')).toHaveCount(3)
    await expect(index.locator('button,[tabindex]')).toHaveCount(0)
    await expect(index.locator('.work-index-preview:visible')).toHaveCount(3)
    for (const project of projects) {
      const entry = index.locator(`.work-index-${project.id}`)
      await expect(entry).toHaveAttribute('href', `#${project.id}`)
      // Status is ordinary visible link text, rather than an aria-hidden image
      // caption, tooltip, or a separate name that masks the visible purpose.
      await expect(entry).toHaveAccessibleName(`0${projects.indexOf(project) + 1} ${project.title} ${project.purpose} ${project.status}`)
      await expect(entry.locator('.work-index-name > span')).toHaveText(project.purpose)
      await expect(entry.locator('.work-index-note')).toHaveText(project.status)
      await expect(entry.locator('.work-index-note')).toBeVisible()
      const layout = await entry.evaluate(entry => {
        const name = entry.querySelector<HTMLElement>('.work-index-name')!
        const purpose = name.querySelector<HTMLElement>('span')!
        const status = entry.querySelector<HTMLElement>('.work-index-note')!
        const picture = entry.querySelector<HTMLElement>('.work-index-preview')!
        const rect = entry.getBoundingClientRect(), n = name.getBoundingClientRect()
        const s = status.getBoundingClientRect(), p = picture.getBoundingClientRect()
        const overlap = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
        return {
          purposeSize: parseFloat(getComputedStyle(purpose).fontSize),
          statusSize: parseFloat(getComputedStyle(status).fontSize),
          hiddenStatus: Boolean(status.closest('[aria-hidden="true"]')),
          overlap: overlap(n, p) || overlap(s, p) || overlap(n, s),
          contained: n.left >= rect.left && n.right <= rect.right + 1 && s.left >= rect.left && s.right <= rect.right + 1 && s.bottom <= rect.bottom,
          targetWidth: rect.width,
          targetHeight: rect.height,
        }
      })
      expect(layout.purposeSize).toBeGreaterThanOrEqual(10)
      expect(layout.statusSize).toBeGreaterThanOrEqual(10)
      expect(layout.hiddenStatus).toBe(false)
      expect(layout.overlap).toBe(false)
      expect(layout.contained).toBe(true)
      expect(layout.targetWidth).toBeGreaterThanOrEqual(44)
      expect(layout.targetHeight).toBeGreaterThanOrEqual(44)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    await index.locator('.work-index-community').tap()
    await expect(page).toHaveURL(/\/work#community$/)
    await expect(page.locator('#community')).toBeInViewport()
    expect(errors).toEqual([])
  })
})
