import { test, expect } from '@playwright/test'

for (const width of [1440, 390, 320]) {
  for (const project of [
    { id: 'community', title: 'Vallalar Sathya Dharmasalai' },
    { id: 'accuflow', title: 'AccuFlow' },
  ]) test(`${width}px ${project.id} image promises a quick dialog, keeps the chapter and returns native focus`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`/work#${project.id}`)
    await page.evaluate(() => document.fonts.ready)
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    const imageAction = page.locator(`#${project.id} .feature-media`)
    await expect(imageAction).toHaveAccessibleName(`Quick view: ${project.title}`)
    await expect(imageAction).toHaveAttribute('aria-haspopup', 'dialog')
    await imageAction.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: project.title, exact: true })
    await expect(dialog).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/work#${project.id}$`))
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(imageAction).toBeFocused()
    await expect(imageAction).toBeInViewport()
    const fullCase = page.locator(`#${project.id} .feature-footer a[href="/projects/${project.id}"]`)
    await fullCase.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`/projects/${project.id}$`))
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    await expect(page.locator('h1')).toBeFocused()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
}
