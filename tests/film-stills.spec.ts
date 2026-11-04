import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { test, expect, type Locator } from '@playwright/test'

const approvedFrames = [
  {
    filmId: 'cck-trailer',
    title: 'CCK trailer',
    path: '/media/cck-trailer-still.jpg',
    sourceId: '1FXMI8GoosQllewx87S8_lJDXRULukrYA',
    sourceSha256: '97841116daa6cc6ea6365c5a03a7180a9c0cd7b39accf292bd246e81a4d8cded',
    sha256: 'f6e48a30129b680660a6423512b8513c4a0d310be1ef5c5fb1b5d167c911e6da',
    bytes: 34891,
    duration: '2:22',
  },
  {
    filmId: 'farewell-video',
    title: 'Farewell video',
    path: '/media/farewell-film-still.jpg',
    sourceId: '1zxuYX1UAG8FwYlfYhWP-SAnP4jaRx5MN',
    sourceSha256: '416277ca1fdea4b895c8125f53d09833c9904a41423faeae211a5e50ba79aa75',
    sha256: '47c270fc2f27826901933427c3ec3b98602140a1b3dbd073625392f4e24f2d75',
    bytes: 46028,
    duration: '4:18',
  },
]

test('local posters preserve the exact approved 5-second frames and their source evidence', async () => {
  const manifest = JSON.parse(await readFile(new URL('../docs/film-still-sources.json', import.meta.url), 'utf8'))
  expect(manifest.frames).toHaveLength(2)
  expect(manifest.processing).toMatchObject({
    crop: false, colourGrading: false, retouching: false, addedText: false,
    generatedContent: false, originalLetterboxingAndMontagePreserved: true,
  })
  for (const approved of approvedFrames) {
    const frame = manifest.frames.find((candidate: { filmId: string }) => candidate.filmId === approved.filmId)
    expect(frame.requestedTimestampSeconds).toBe(5)
    expect(frame.source.fileId).toBe(approved.sourceId)
    expect(frame.source.previewUrl).toBe(`https://drive.google.com/file/d/${approved.sourceId}/preview`)
    expect(frame.source.sha256).toBe(approved.sourceSha256)
    expect(frame.image).toEqual({
      publicPath: approved.path, format: 'JPEG', width: 640, height: 360,
      bytes: approved.bytes, sha256: approved.sha256,
    })
    const bytes = await readFile(new URL(`../public${approved.path}`, import.meta.url))
    expect(bytes.byteLength).toBe(approved.bytes)
    expect(createHash('sha256').update(bytes).digest('hex'), 'Reviewed bytes prevent a cropped, graded or unrelated substitute').toBe(approved.sha256)
  }
  const farewell = manifest.frames.find((frame: { filmId: string }) => frame.filmId === 'farewell-video')
  expect(farewell.source.formatDurationSeconds).toBeCloseTo(258.005333, 6)
  expect(farewell.source.videoDurationSeconds).toBe(258)
})

async function expectCompleteFrame(image: Locator, path: string) {
  await expect(image).toHaveAttribute('src', path)
  await image.evaluate(node => (node as HTMLImageElement).decode())
  expect(await image.evaluate(node => {
    const image = node as HTMLImageElement
    const style = getComputedStyle(image)
    return {
      width: image.naturalWidth, height: image.naturalHeight,
      fit: style.objectFit, position: style.objectPosition, opacity: style.opacity,
      filter: style.filter, mask: style.maskImage, transform: style.transform,
    }
  })).toEqual({
    width: 640, height: 360, fit: 'contain', position: '50% 50%',
    opacity: '1', filter: 'none', mask: 'none', transform: 'none',
  })
}

for (const width of [320, 390, 1440]) {
  test(`both actual frames remain complete and keyboard-selectable at ${width}px without Google requests`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    const googleRequests: string[] = []
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route(/https:\/\/(?:[^/]*\.)?(?:google\.com|googleusercontent\.com|googleapis\.com|gstatic\.com)\//, async route => {
      googleRequests.push(route.request().url())
      await route.abort()
    })
    await page.goto('/studio')
    await page.evaluate(() => document.fonts.ready)
    await page.locator('.state-opening').waitFor({ state: 'detached' })
    const first = page.getByRole('radio', { name: 'CCK trailer', exact: true })
    await first.focus()
    for (const [index, approved] of approvedFrames.entries()) {
      if (index > 0) await page.keyboard.press('ArrowDown')
      await expect(page.getByRole('radio', { name: approved.title, exact: true })).toBeChecked()
      await expect(page.locator('.screening-title-card h3')).toHaveText(approved.title)
      await expectCompleteFrame(page.locator('.screening-still'), approved.path)
      await expect(page.locator('.screening-film-note')).toContainText(`Actual film still · ${index ? 'Farewell AA · ' : 'Trailer · Public export, '}${approved.duration}`)
      const aperture = (await page.locator('.screening-still-window').boundingBox())!
      const title = (await page.locator('.screening-title-card').boundingBox())!
      expect(aperture.width).toBeGreaterThan(100)
      expect(aperture.height).toBeGreaterThan(75)
      expect(aperture.x).toBeGreaterThanOrEqual(0)
      expect(aperture.x + aperture.width).toBeLessThanOrEqual(width)
      expect(title.y, 'The title and Watch control sit below the full frame').toBeGreaterThanOrEqual(aperture.y + aperture.height - 1)
      const reelImage = page.getByRole('button', { name: `Play ${approved.title}`, exact: true }).locator('img')
      await expectCompleteFrame(reelImage, approved.path)
      await expect(page.locator('iframe')).toHaveCount(0)
    }
    await page.keyboard.press('ArrowUp')
    await expect(first).toBeChecked()
    await expect(page.locator('.screening-still')).toHaveAttribute('src', approvedFrames[0].path)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    expect(googleRequests, 'Selecting a locally served still must not contact a Google provider').toEqual([])
    expect(errors).toEqual([])
  })
}
