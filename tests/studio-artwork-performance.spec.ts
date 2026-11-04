import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'docs/film-thumbnail-delivery.json'), 'utf8'))
const originals = manifest.records.map((record: { original: string }) => record.original) as string[]
const derivatives = manifest.records.flatMap((record: { derivatives: { url: string }[] }) => record.derivatives.map(image => image.url)) as string[]
const artworkPaths = new Set([...originals, ...derivatives])

async function prepare(page: Page, baseline: boolean) {
  const requested = new Set<string>(), media: string[] = [], errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => {
    const url = new URL(request.url())
    if (artworkPaths.has(url.pathname)) requested.add(url.pathname)
    if (url.pathname.endsWith('.mp4') || /(?:google\.com|googleusercontent\.com|googleapis\.com|gstatic\.com)$/.test(url.hostname)) media.push(url.origin + url.pathname)
  })
  await page.route(/https:\/\/(?:[^/]*\.)?(?:google\.com|googleusercontent\.com|googleapis\.com|gstatic\.com)\//, route => route.abort())
  if (baseline) await page.route('**/src/content.ts*', async route => {
    const response = await route.fetch()
    await route.fulfill({ response, body: `${await response.text()}\n;creativeMedia.forEach(film => {film.thumbnailSrcSet=undefined;});\n` })
  })
  await page.goto('/studio')
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.state-opening').waitFor({ state: 'detached' })
  await expect(page.locator('.studio-contact-sheet img')).toHaveCount(5)
  for (const image of await page.locator('.studio-contact-sheet img').all()) {
    await image.scrollIntoViewIfNeeded()
    await image.evaluate(node => (node as HTMLImageElement).decode())
  }
  for (const button of await page.locator('.screening-ready-films .reel-frame').all()) {
    await button.focus()
    await button.locator('img').scrollIntoViewIfNeeded()
    await button.locator('img').evaluate(node => (node as HTMLImageElement).decode())
  }
  return { requested, media, errors }
}

for (const [width, scale] of [[320, 1], [390, 1], [1440, 1], [390, 2]]) test(`${width}px at ${scale}x loads smaller complete artwork before Watch while keeping the large original`, async ({ browser }, testInfo) => {
  const evidence: Record<string, unknown> = { width, deviceScaleFactor: scale }
  let baselineBytes = 0
  for (const baseline of [true, false]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', deviceScaleFactor: scale, isMobile: width < 768, hasTouch: width < 768 })
    const page = await context.newPage()
    const result = await prepare(page, baseline)
    const bytes = [...result.requested].reduce((total, path) => total + readFileSync(resolve(process.cwd(), 'public' + path)).byteLength, 0)
    evidence[baseline ? 'baseline' : 'responsive'] = { distinctRequestedArtworkBytes: bytes, paths: [...result.requested] }
    expect(result.media, 'Artwork selection and scrolling must not load films or Google').toEqual([])
    expect(result.errors).toEqual([])
    await expect(page.locator('#studio video, iframe')).toHaveCount(0)
    await expect(page.locator('.screening-still')).toHaveAttribute('src', originals[0])
    await expect(page.locator('.screening-still')).not.toHaveAttribute('srcset')
    if (baseline) {
      baselineBytes = bytes
      expect(bytes).toBe(manifest.totals.original_bytes)
    } else {
      expect(bytes).toBeLessThan(baselineBytes * .5)
      for (const image of await page.locator('.studio-contact-sheet img, .screening-ready-films img').all()) {
        const state = await image.evaluate(node => {
          const image = node as HTMLImageElement
          return { path: new URL(image.currentSrc).pathname, fit: getComputedStyle(image).objectFit, fallback: image.getAttribute('src'), sizes: image.sizes }
        })
        expect(derivatives).toContain(state.path)
        expect(originals).toContain(state.fallback)
        expect(state.fit).toBe('contain')
        expect(state.sizes).toBeTruthy()
        const entry = manifest.records.flatMap((record: { derivatives: { url: string; dimensions: number[] }[] }) => record.derivatives).find((item: { url: string }) => item.url === state.path)
        const decoded = await image.evaluate(async node => {
          const bitmap = await createImageBitmap(await (await fetch((node as HTMLImageElement).currentSrc)).blob())
          const dimensions = [bitmap.width, bitmap.height]
          bitmap.close()
          return dimensions
        })
        expect(decoded).toEqual(entry.dimensions)
        expect(decoded[0] / decoded[1]).toBeCloseTo(16 / 9, 5)
      }
      for (const image of await page.locator('.studio-contact-sheet img').all()) await expect.poll(() => image.evaluate(node => new URL((node as HTMLImageElement).currentSrc).pathname)).toMatch(/-320\.webp$/)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    }
    await context.close()
  }
  await testInfo.attach('artwork-byte-comparison', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' })
})
