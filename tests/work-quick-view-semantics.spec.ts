import { test, expect } from '@playwright/test'

for (const width of [1440, 390, 320]) {
  for (const project of [
    { id: 'community', title: 'Vallalar Sathya Dharmasalai' },
    { id: 'accuflow', title: 'AccuFlow' },
  ]) test(`${width}px ${project.id} image action names its dialog, keeps the chapter and returns native focus`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`/work#${project.id}`)
    await page.evaluate(() => document.fonts.ready)
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    const isRouteCapture = project.id === 'accuflow'
    const imageAction = isRouteCapture
      ? page.getByRole('button', { name: 'View larger capture: AccuFlow · Try it', exact: true })
      : page.locator(`#${project.id} .feature-media`)
    await expect(imageAction).toHaveAccessibleName(isRouteCapture
      ? 'View larger capture: AccuFlow · Try it' : `Quick view: ${project.title}`)
    if (!isRouteCapture) await expect(imageAction).toHaveAttribute('aria-haspopup', 'dialog')
    await imageAction.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: isRouteCapture ? 'AccuFlow · Try it' : project.title, exact: true })
    await expect(dialog).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/work#${project.id}$`))
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(imageAction).toBeFocused()
    await expect(imageAction).toBeInViewport()
    if (isRouteCapture) {
      // Generic project context remains a separate, honestly named action.
      const overview = page.locator('#accuflow .feature-footer').getByRole('button', { name: 'Quick view', exact: true })
      await overview.focus()
      await page.keyboard.press('Enter')
      await expect(page.getByRole('dialog', { name: project.title, exact: true })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(overview).toBeFocused()
    }
    const fullCase = page.locator(`#${project.id} .feature-footer a[href="/projects/${project.id}"]`)
    await fullCase.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`/projects/${project.id}$`))
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    await expect(page.locator('h1')).toBeFocused()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
}
