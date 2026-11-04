import { test, expect } from '@playwright/test'

for (const action of ['close', 'browser Back'] as const) {
  test(`retained native film stops playing after ${action}, including a detached element reference`, async ({ page, baseURL }, testInfo) => {
    await page.addInitScript(origin => {
      if (location.origin === origin) sessionStorage.setItem('ap-atelier-loader-v4', 'seen')
    }, new URL(baseURL!).origin)
    await page.goto('/about')
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Studio', exact: true }).click()
    await expect(page).toHaveURL(/\/studio$/)
    await page.getByRole('radio', { name: 'TED-Ed auditions', exact: true }).check()
    const watch = page.getByRole('button', { name: 'Play selected film: TED-Ed auditions', exact: true })
    await watch.click()
    const video = page.locator('video.actual-video')
    await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2)
    await video.focus()
    await page.keyboard.press('Space')
    await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeGreaterThan(.25)
    await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).paused)).toBe(false)
    const retained = await video.elementHandle()
    const sample = () => retained!.evaluate(node => {
      const film = node as HTMLVideoElement
      return { connected: film.isConnected, paused: film.paused, time: film.currentTime, error: film.error?.code ?? null }
    })
    const playing = await sample()
    if (action === 'close') {
      await page.getByRole('dialog').getByRole('button', { name: 'Close dialog', exact: true }).click()
      await expect(watch).toBeFocused()
    } else {
      await page.evaluate(() => {
        const observer = new MutationObserver(() => {
          const opening = document.querySelector('.state-opening[data-route="/about"]')
          if (!opening) return
          observer.disconnect()
          const points = [[2, 2], [innerWidth - 2, 2], [2, innerHeight - 2], [innerWidth - 2, innerHeight - 2], [innerWidth / 2, innerHeight / 2]]
          document.documentElement.dataset.testFirstBackStage = JSON.stringify({
            openDialogs: document.querySelectorAll('dialog[open]').length,
            covered: points.every(([x, y]) => opening.contains(document.elementFromPoint(x, y))),
            background: getComputedStyle(opening).backgroundColor,
            opacity: getComputedStyle(opening).opacity,
          })
        })
        observer.observe(document.body, { childList: true, subtree: true })
      })
      await page.goBack()
      await expect(page).toHaveURL(/\/about$/)
      await expect.poll(() => page.locator('html').getAttribute('data-test-first-back-stage')).not.toBeNull()
      expect(JSON.parse((await page.locator('html').getAttribute('data-test-first-back-stage'))!)).toEqual({
        openDialogs: 0, covered: true, background: 'rgb(0, 0, 0)', opacity: '1',
      })
    }
    await expect(page.locator('video.actual-video')).toHaveCount(0)
    await expect.poll(async () => (await sample()).connected).toBe(false)
    await expect.poll(async () => (await sample()).paused).toBe(true)
    const stopped = await sample()
    await page.waitForTimeout(400)
    const later = await sample()
    expect(later.time).toBeCloseTo(stopped.time, 2)
    expect(later.error).toBeNull()
    await testInfo.attach(`native-film-${action}-lifecycle`, {
      body: JSON.stringify({ playing, stopped, later }, null, 2), contentType: 'application/json',
    })
  })
}
