import { test, expect } from '@playwright/test'

for (const width of [320, 390, 1440]) {
  test(`recognition and swimming preserve native keyboard access and source context at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const external: string[] = []
    page.on('request', request => {
      if (new URL(request.url()).origin !== new URL(test.info().project.use.baseURL!).origin) external.push(request.url())
    })
    await page.goto('/about')
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    await page.evaluate(() => document.fonts.ready)
    await page.getByRole('tab', { name: 'Swimmer', exact: true }).focus()
    await page.keyboard.press('Enter')
    const panel = page.getByRole('tabpanel')
    await expect(panel).toContainText('school swimming team from 2024 to 2026')
    const record = panel.locator('.about-swim-records')
    await record.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(record).toHaveAttribute('open', '')
    const plate = panel.locator('.about-identity-swimming')
    await expect(plate.locator('dt')).toHaveText(['50 m breaststroke', '100 m freestyle'])
    await expect(plate.locator('dd')).toHaveText(['41.48 s', '1 min 6 s'])
    await expect(plate).toContainText('Personal bests recorded in my CV.')
    await expect(record.locator('dl')).toHaveCount(0)
    await expect(record).toContainText('relay-team bronze')
    await page.keyboard.press('Space')
    await expect(record).not.toHaveAttribute('open', '')

    const recognition = page.locator('#recognition')
    const entries = recognition.locator('.achievement')
    await expect(entries).toHaveCount(5)
    await expect(entries.locator('h3')).toHaveText([
      'Chinmaya Gaurav Award', 'ICSC 2026', 'International Chemistry Competition 2026',
      'International Computer Science Competition', 'CIRSMUN 2026',
    ])
    for (const entry of await entries.all()) {
      await entry.locator('summary').focus()
      await page.keyboard.press('Enter')
      await expect(entry).toHaveAttribute('open', '')
      await expect(entry.locator('.achievement-source')).toBeVisible()
    }
    await expect(entries.first()).toContainText('Chinmaya International Residential School · 2026')
    // The two supplied Gaurav versions disagree on category; shared title,
    // recipient context and year are published without choosing a version.
    await expect(entries.first()).not.toContainText(/Excellence in Swimming|Upholding CIRS Value/i)
    await expect(entries.nth(1)).toContainText('as recorded in my CV')
    await expect(entries.nth(2)).toContainText('as recorded in my CV')
    const ambassador = entries.nth(3)
    await expect(ambassador).toContainText('30 August 2026')
    await expect(ambassador).toContainText('separate from the competition result above')
    const verify = ambassador.getByRole('link', { name: 'Verify with ICSC', exact: true })
    await expect(verify).toHaveAttribute('href', 'https://icscompetition.org/en/verify')
    await expect(verify).toHaveAttribute('target', '_blank')
    await expect(verify).toHaveAttribute('rel', 'noreferrer')
    await expect(ambassador.locator('code')).toHaveText('AC-2026-APRIYAN')
    await expect(entries.last()).toContainText('Under-Secretary-General for Technology and Digital Operations')
    await expect(recognition.getByRole('link', { name: 'View certificate', exact: true })).toHaveCount(0)
    await expect(recognition.locator('img,iframe,video')).toHaveCount(0)
    await expect(page.locator('main')).not.toContainText(/date of birth|birth year|passport|candidate ID|Ananda Priyan \(\d{4}\)|Certificate to be supplied/i)
    expect(external).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}
