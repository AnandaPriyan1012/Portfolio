import { test, expect } from "@playwright/test";

for (const width of [320, 390, 1440]) {
  test(`creative case uses all five real artworks without a pending-media panel at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const prematureMedia: string[] = [];
    page.on("request", (request) => {
      if (/\.mp4(?:\?|$)|drive\.google\.com|googlevideo\.com/.test(request.url())) prematureMedia.push(request.url());
    });
    await page.goto("/projects/creative");
    await expect(page.locator(".state-opening")).toHaveCount(0);
    const collection = page.locator(".case-film-collection");
    await expect(collection.locator("figure")).toHaveCount(5);
    await expect(page.locator(".case-media-pending")).toHaveCount(0);
    await expect(page.locator(".case-cut-controls")).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText(/awaiting verification|details still to follow|Original media to be added/);
    await expect(collection).toContainText("Vantara");
    await expect(collection).toContainText("Masquerade trailer");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for (const image of await collection.locator("img").all()) {
      await image.evaluate((node) => (node as HTMLImageElement).decode());
      expect(await image.evaluate((node) => {
        const image = node as HTMLImageElement, box = image.getBoundingClientRect();
        const aperture = image.parentElement!.getBoundingClientRect();
        const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
        const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
        return getComputedStyle(image).objectFit === "contain" &&
          box.x + (box.width - w) / 2 >= aperture.x - 1 &&
          box.y + (box.height - h) / 2 >= aperture.y - 1 &&
          box.x + (box.width + w) / 2 <= aperture.right + 1 &&
          box.y + (box.height + h) / 2 <= aperture.bottom + 1;
      })).toBe(true);
    }
    expect(prematureMedia).toEqual([]);
    const link = collection.getByRole("link", { name: "Watch the films", exact: true });
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/studio$/);
    await expect(page.locator(".state-opening")).toHaveCount(0);
    await expect(page.locator("main h1")).toBeFocused();
    await expect(page.getByRole("radio")).toHaveCount(6);
    expect(prematureMedia).toEqual([]);
  });
}

test("modified creative collection links keep the case open and use a real Studio destination", async ({ page, context }) => {
  await page.goto("/projects/creative");
  await expect(page.locator(".state-opening")).toHaveCount(0);
  const popup = context.waitForEvent("page");
  await page.getByRole("link", { name: "Watch the films", exact: true }).click({ modifiers: ["Control"] });
  const opened = await popup;
  await expect(opened).toHaveURL(/\/studio$/);
  await expect(page).toHaveURL(/\/projects\/creative$/);
  await expect(page.locator(".case-film-collection")).toBeVisible();
  await opened.close();
});

test("the desktop's real Film app reaches its full collection and then playable Studio", async ({ page }) => {
  const prematureMedia: string[] = [];
  page.on("request", request => {
    if (/\.mp4(?:\?|$)|drive\.google\.com|googlevideo\.com/.test(request.url())) prematureMedia.push(request.url());
  });
  await page.goto("/work");
  await expect(page.locator(".state-opening")).toHaveCount(0);
  await page.getByRole("button", { name: "AP OS", exact: true }).click();
  const desktop = page.getByRole("dialog", { name: "AP OS", exact: true });
  await desktop.getByRole("button", { name: "Open Film", exact: true }).click();
  const filmWindow = desktop.locator('[data-window="creative"]');
  await expect(filmWindow.locator(".os-passport-visual img")).toHaveAttribute("src", "/media/vantara-masquerade-poster.jpg");
  await expect(filmWindow).not.toContainText(/to be added|awaiting verification/);
  await filmWindow.getByRole("button", { name: "Open the full case study", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/creative$/);
  await expect(desktop).toHaveCount(0);
  await expect(page.locator(".state-opening")).toHaveCount(0);
  await page.getByRole("link", { name: "Watch the films", exact: true }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.locator(".state-opening")).toHaveCount(0);
  expect(prematureMedia).toEqual([]);
});
