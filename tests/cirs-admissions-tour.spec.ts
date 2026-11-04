import { expect, test, type Page } from "@playwright/test";

const targets = [
  { label: "Portal", id: "portal", x: 118, y: 799, width: 230, height: 53 },
  { label: "Process", id: "process", x: 376, y: 813, width: 177, height: 27 },
  { label: "Enquiries", id: "enquiries", x: 117, y: 881, width: 961, height: 95 },
] as const;

async function ready(page: Page) {
  await page.goto("/projects/cirs");
  await page.evaluate(() => document.fonts.ready);
  const image = page.locator(".cirs-tour-image");
  await image.scrollIntoViewIfNeeded();
  await image.evaluate((element) => (element as HTMLImageElement).decode());
  // Settle the existing outer reader surface before comparing inner coordinates.
  await image.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top - 110,
    behavior: "instant",
  }));
  return page.locator(".cirs-tour");
}

async function assertAligned(page: Page, target: typeof targets[number]) {
  await expect.poll(async () => page.locator(".cirs-tour").evaluate((element, target) => {
    const image = element.querySelector("img")!.getBoundingClientRect();
    const frame = element.querySelector(".cirs-tour-frame")!.getBoundingClientRect();
    return Math.max(
      Math.abs(frame.x - image.x - image.width * target.x / 1440),
      Math.abs(frame.y - image.y - image.height * target.y / 1000),
      Math.abs(frame.width - image.width * target.width / 1440),
      Math.abs(frame.height - image.height * target.height / 1000),
    );
  }, target)).toBeLessThan(0.6);
}

test("the real capture stays clear while each note outlines its actual source coordinates", async ({ page }, testInfo) => {
  const tour = await ready(page);
  const image = tour.locator("img");
  await expect(image).toHaveAttribute("src", "/media/cirs-admissions.webp");
  expect(await image.evaluate((element) => [
    (element as HTMLImageElement).naturalWidth,
    (element as HTMLImageElement).naturalHeight,
  ])).toEqual([1440, 1000]);
  await expect(image).toHaveCSS("padding", "0px");
  await expect(image).toHaveCSS("filter", "none");
  await expect(image).toHaveCSS("transform", "none");
  await expect(tour).toHaveAttribute("data-note", "overview");
  const before = await tour.boundingBox();
  const observations = [];
  for (const target of targets) {
    const button = tour.getByRole("button", { name: target.label, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(tour.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(tour).toHaveAttribute("data-note", target.id);
    await assertAligned(page, target);
    await expect(tour.locator(".cirs-tour-note")).not.toBeEmpty();
    expect((await tour.boundingBox())!.height).toBeCloseTo(before!.height, 1);
    observations.push({ note: target.id, frame: await tour.locator(".cirs-tour-frame").boundingBox() });
  }
  await tour.getByRole("button", { name: "Enquiries", exact: true }).click();
  await expect(tour).toHaveAttribute("data-note", "overview");
  await expect(tour.locator('[aria-pressed="true"]')).toHaveCount(0);
  await expect(tour.locator(".cirs-tour-frame")).toHaveAttribute("data-visible", "false");
  await expect(page.locator(".case-admissions figcaption")).toContainText("public Admissions page");
  await expect(page.getByRole("link", { name: "Visit the Admissions Guide" })).toHaveAttribute("href", "https://cirschool.org/admissions.html");
  await testInfo.attach("capture-coordinate-alignment.json", {
    body: JSON.stringify(observations, null, 2), contentType: "application/json",
  });
});

test("native keyboard notes keep focus, toggle to overview and never select themselves on scroll", async ({ page }) => {
  const tour = await ready(page);
  const portal = tour.getByRole("button", { name: "Portal", exact: true });
  const process = tour.getByRole("button", { name: "Process", exact: true });
  const enquiries = tour.getByRole("button", { name: "Enquiries", exact: true });
  await portal.focus();
  await page.keyboard.press("Enter");
  await expect(portal).toBeFocused();
  await expect(portal).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Tab");
  await expect(process).toBeFocused();
  await page.keyboard.press("Space");
  await expect(process).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Tab");
  await expect(enquiries).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(enquiries).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: "instant" }));
  await expect(tour).toHaveAttribute("data-note", "enquiries");
  await expect(enquiries).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(tour).toHaveAttribute("data-note", "overview");
});

test("Motion off leaves the annotation instant while case anchors, cuts and progress still work", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => localStorage.setItem("ap-motion", "off"));
  const tour = await ready(page);
  await expect(tour).toHaveAttribute("data-motion", "off");
  await expect(tour.locator(".cirs-tour-frame")).toHaveCSS("transition-duration", "0s");
  await expect(page.locator(".case-page")).not.toHaveAttribute("data-reader-depth", "");
  await expect(page.locator(".glass-arrow-cursor")).toHaveCount(0);
  await tour.getByRole("button", { name: "Process", exact: true }).click();
  await assertAligned(page, targets[1]);
  await page.getByRole("button", { name: "Quick cut", exact: true }).click();
  await expect(page.locator(".case-stage")).toHaveCount(3);
  await page.getByRole("button", { name: "Director’s cut", exact: true }).click();
  await expect(page.locator(".case-stage")).toHaveCount(4);
  const admissionLink = page.getByRole("navigation", { name: "Case study chapters" })
    .getByRole("link", { name: "The Admissions page", exact: true });
  await admissionLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#case-cirs-admissions$/);
  await expect(page.locator("#case-cirs-admissions")).toBeFocused();
  await expect.poll(() => page.getByRole("progressbar").evaluate((element) => (element as HTMLProgressElement).value)).toBeGreaterThan(50);
});

test("capable desktop uses a finite outline transition and one arrow on annotation buttons", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
  });
  const tour = await ready(page);
  await expect(tour).toHaveAttribute("data-motion", "on");
  const duration = await tour.locator(".cirs-tour-frame").evaluate((element) =>
    Math.max(...getComputedStyle(element).transitionDuration.split(",").map(Number.parseFloat)),
  );
  expect(duration).toBeGreaterThan(0);
  expect(duration).toBeLessThanOrEqual(0.5);
  await expect(page.locator(".glass-arrow-cursor")).toHaveCount(1);
  const process = tour.getByRole("button", { name: "Process", exact: true });
  await process.hover();
  await expect(page.locator(".glass-arrow-cursor")).toHaveAttribute("data-visible", "true");
  await process.click();
  await assertAligned(page, targets[1]);
  await expect(page.locator("html")).not.toHaveAttribute("data-glass-pointer", "visible");
  expect(await tour.evaluate((element) => element.getAnimations({ subtree: true }).some((animation) => animation.playState === "running"))).toBe(false);
});

for (const width of [320, 390, 767, 768]) {
  test(`touch at ${width}px keeps the entire capture, readable controls and instant notes`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width, height: 844 }, isMobile: true, hasTouch: true,
      reducedMotion: "no-preference", baseURL: testInfo.project.use.baseURL,
    });
    const page = await context.newPage();
    const tour = await ready(page);
    await expect(tour.locator(".cirs-tour-frame")).toHaveCSS("transition-duration", "0s");
    await expect(page.locator(".glass-arrow-cursor")).toHaveCount(0);
    const imageBounds = (await tour.locator("img").boundingBox())!;
    expect(imageBounds.width / imageBounds.height).toBeCloseTo(1.44, 2);
    const controlBounds = (await tour.locator(".cirs-tour-controls").boundingBox())!;
    if (width <= 767) {
      // Phone/tablet controls occupy real layout space before the full capture.
      expect(controlBounds.y + controlBounds.height).toBeLessThanOrEqual(imageBounds.y - 8);
    } else {
      // Wider layouts keep the toolbar above the captured heading/body.
      expect(controlBounds.y + controlBounds.height).toBeLessThan(imageBounds.y + imageBounds.height * 0.605);
    }
    const height = (await tour.boundingBox())!.height;
    for (const target of targets) {
      const button = tour.getByRole("button", { name: target.label, exact: true });
      const bounds = (await button.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      await button.tap();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await assertAligned(page, target);
      expect((await tour.boundingBox())!.height).toBeCloseTo(height, 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await testInfo.attach(`touch-${width}.png`, { body: await page.locator(".case-admissions").screenshot(), contentType: "image/png" });
    await context.close();
  });
}

test("forced colors retain an obvious selected note and keyboard focus", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  const tour = await ready(page);
  const portal = tour.getByRole("button", { name: "Portal", exact: true });
  await portal.focus();
  await page.keyboard.press("Enter");
  await expect(portal).toBeFocused();
  await expect(portal).toHaveAttribute("aria-pressed", "true");
  await expect(portal).toHaveCSS("outline-style", "solid");
  await expect(tour.locator(".cirs-tour-frame")).toHaveAttribute("data-visible", "true");
});

test("saved Light theme keeps image-note labels and selected text readable", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ap-atelier-theme", "light"));
  const tour = await ready(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await tour.getByRole("button", { name: "Portal", exact: true }).click();
  const contrasts = await tour.locator(".cirs-tour-controls").evaluate((panel) => {
    const color = (value: string) => value.match(/[\d.]+/g)!.map(Number);
    const blend = (foreground: number[], background: number[]) => {
      const alpha = foreground[3] ?? 1;
      return foreground.slice(0, 3).map((channel, index) => channel * alpha + background[index] * (1 - alpha));
    };
    const luminance = (rgb: number[]) => rgb.reduce((value, channel, index) => {
      const normalized = channel / 255;
      const linear = normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      return value + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
    const stops = getComputedStyle(panel).backgroundImage.match(/rgba?\([^)]+\)/g)!.map(color);
    // White behind the nearly opaque glass is the lightest possible source pixel.
    return Array.from(panel.querySelectorAll("button, .cirs-tour-label")).map((element) => {
      const style = getComputedStyle(element);
      const ink = luminance(color(style.color));
      return Math.min(...stops.map((stop) => {
        const glass = blend(stop, [255, 255, 255]);
        const paper = luminance(blend(color(style.backgroundColor), glass));
        return (Math.max(ink, paper) + 0.05) / (Math.min(ink, paper) + 0.05);
      }));
    });
  });
  contrasts.forEach((ratio) => expect(ratio).toBeGreaterThanOrEqual(4.5));
});
