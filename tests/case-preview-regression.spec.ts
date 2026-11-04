import { expect, test, type Locator, type Page } from "@playwright/test";

async function geometry(element: Locator) {
  return element.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    return {
      width: bounds.width,
      height: bounds.height,
      documentTop: bounds.top + window.scrollY,
      documentBottom: bounds.bottom + window.scrollY,
    };
  });
}

async function capablePointer(page: Page) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
    sessionStorage.setItem("ap-atelier-loader-v4", "seen");
    localStorage.setItem("ap-motion", "on");
  });
}

async function intentionalHover(page: Page, target: Locator) {
  await page.evaluate(() => document.fonts.ready);
  await target.scrollIntoViewIfNeeded();
  // Finish the scroll before aiming at a moving target. Stationary-pointer
  // scrolling now resamples the surface instead of hiding the arrow.
  await target.evaluate((node) => new Promise<void>((resolve, reject) => {
    let previous = { x: Number.NaN, y: Number.NaN, scrollY: Number.NaN };
    let stableFrames = 0;
    let frames = 0;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      const next = { x: rect.x, y: rect.y, scrollY: window.scrollY };
      stableFrames =
        Math.abs(next.x - previous.x) < 0.1 &&
        Math.abs(next.y - previous.y) < 0.1 &&
        Math.abs(next.scrollY - previous.scrollY) < 0.1
          ? stableFrames + 1
          : 0;
      previous = next;
      if (stableFrames >= 3) resolve();
      else if (++frames >= 120) reject(new Error("Pointer target did not settle after scrolling"));
      else requestAnimationFrame(measure);
    };
    requestAnimationFrame(measure);
  }));
  const bounds = await target.boundingBox();
  expect(bounds).not.toBeNull();
  const x = bounds!.x + bounds!.width * 0.5;
  const y = bounds!.y + bounds!.height * 0.5;
  await page.mouse.move(x - 1, y);
  await page.mouse.move(x, y);
}

const previews = [
  {
    from: "cirs",
    to: "community",
    source: "/media/vallalar-website-desktop.webp",
  },
  {
    from: "community",
    to: "accuflow",
    source: "/media/accuflow-prototype-desktop.webp",
  },
  {
    from: "accuflow",
    to: "cirs",
    source: "/media/cirs-home-desktop.webp",
  },
] as const;

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "phone", width: 390, height: 844 },
]) {
  test.describe(`next-project media on ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const preview of previews) {
      test(`${preview.from} reserves the actual ${preview.to} capture while its lazy request is held`, async ({ page }, testInfo) => {
        let release!: () => void;
        const held = new Promise<void>((resolve) => { release = resolve; });
        let requested = false;
        await page.route(`**${preview.source}`, async (route) => {
          requested = true;
          await held;
          await route.continue();
        });

        try {
          await page.goto(`/projects/${preview.from}`);
          await page.evaluate(() => document.fonts.ready);
          const next = page.locator(".case-next-story");
          await expect(next).toHaveAttribute("href", `/projects/${preview.to}`);
          const image = next.locator("img");
          await expect(image).toHaveAttribute("src", preview.source);
          await expect(image).toHaveAttribute("loading", "lazy");
          await next.scrollIntoViewIfNeeded();
          await expect.poll(() => requested).toBe(true);
          expect(await image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBe(0);
          expect(await image.evaluate((node) => (node as HTMLImageElement).complete)).toBe(false);

          const before = {
            image: await geometry(image),
            next: await geometry(next),
            closing: await geometry(page.locator(".case-closing")),
          };
          expect(before.image.height).toBeGreaterThan(80);
          await expect(image).toHaveCSS("object-fit", "contain");

          release();
          await image.evaluate((node) => (node as HTMLImageElement).decode());
          expect(await image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(300);
          const after = {
            image: await geometry(image),
            next: await geometry(next),
            closing: await geometry(page.locator(".case-closing")),
          };
          expect(Math.abs(after.image.height - before.image.height)).toBeLessThanOrEqual(0.5);
          expect(Math.abs(after.next.height - before.next.height)).toBeLessThanOrEqual(0.5);
          expect(Math.abs(after.closing.documentTop - before.closing.documentTop)).toBeLessThanOrEqual(0.5);
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
          await testInfo.attach(`held-${preview.from}-${preview.to}-${viewport.name}.json`, {
            body: JSON.stringify({ source: preview.source, before, after }, null, 2),
            contentType: "application/json",
          });
        } finally {
          release();
        }
      });
    }
  });
}

test("case links retain one crystal arrow across clicks, routes and back navigation", async ({ page }) => {
  await capablePointer(page);
  await page.goto("/projects/cirs");
  const arrow = page.locator(".glass-arrow-cursor");
  await expect(arrow).toHaveCount(1);
  const admissions = page.getByRole("navigation", { name: "Case study chapters" })
    .getByRole("link", { name: "The Admissions page", exact: true });
  await intentionalHover(page, admissions);
  await expect(arrow).toHaveAttribute("data-visible", "true");
  await expect(page.locator("html")).toHaveAttribute("data-glass-pointer", "visible");
  await expect(admissions).toHaveCSS("cursor", "none");
  await admissions.click();
  await expect(page).toHaveURL(/#case-cirs-admissions$/);
  await expect(arrow).toHaveAttribute("data-visible", "true");
  await expect(page.locator("html")).toHaveAttribute("data-glass-pointer", "visible");

  const next = page.locator(".case-next-story");
  await intentionalHover(page, next);
  await expect(arrow).toHaveAttribute("data-visible", "true");
  const oldTarget = await next.elementHandle();
  await next.click();
  await expect(page).toHaveURL(/\/projects\/community$/);
  await expect(arrow).toHaveCount(1);
  await expect(arrow).toHaveAttribute("data-visible", "true");
  await expect(page.locator("html")).toHaveAttribute("data-glass-pointer", "visible");
  expect(await oldTarget!.evaluate((node) => node.classList.contains("glass-pointer-target"))).toBe(false);
  await expect(page.locator(".glass-pointer-target")).toHaveCount(1);

  await page.goBack();
  await expect(page.locator(".case-page")).toHaveAttribute("data-project", "cirs");
  await expect(arrow).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("data-glass-pointer", "visible");
  const back = page.getByRole("button", { name: "Back to portfolio", exact: true });
  await intentionalHover(page, back);
  await expect(arrow).toHaveAttribute("data-visible", "true");
  await back.click();
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.locator(".case-page")).toHaveCount(0);
  await expect(arrow).toHaveCount(1);
  await expect(arrow).toHaveAttribute("data-visible", "true");
  await expect(page.locator("html")).toHaveAttribute("data-glass-pointer", "visible");
  await expect(page.locator(".glass-pointer-target")).toHaveCount(1);
});

test("system reduced motion keeps case links native and clears an active arrow", async ({ page }) => {
  await capablePointer(page);
  await page.goto("/projects/community");
  const back = page.getByRole("button", { name: "Back to portfolio", exact: true });
  await intentionalHover(page, back);
  await expect(page.locator(".glass-arrow-cursor")).toHaveAttribute("data-visible", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".glass-arrow-cursor")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-glass-pointer", "visible");
  await expect(page.locator(".glass-pointer-target")).toHaveCount(0);
  await intentionalHover(page, back);
  await expect(back).not.toHaveCSS("cursor", "none");
});

test("saved Motion off leaves a capable case page and its links native", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
    localStorage.setItem("ap-motion", "off");
  });
  await page.goto("/projects/cirs");
  await expect(page.locator(".case-page")).toHaveAttribute("data-reader-motion", "off");
  await expect(page.locator(".glass-arrow-cursor")).toHaveCount(0);
  const admissions = page.getByRole("link", { name: "Visit the Admissions Guide", exact: false });
  await intentionalHover(page, admissions);
  await expect(page.locator("html")).not.toHaveAttribute("data-glass-pointer", "visible");
  await expect(admissions).not.toHaveCSS("cursor", "none");
});

test.describe("touch case navigation", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "no-preference",
  });

  test("a real coarse touch pointer keeps native controls without an arrow", async ({ page }) => {
    await page.goto("/projects/cirs");
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    await expect(page.locator(".glass-arrow-cursor")).toHaveCount(0);
    const admissions = page.getByRole("navigation", { name: "Case study chapters" })
      .getByRole("link", { name: "The Admissions page", exact: true });
    await admissions.tap();
    await expect(page).toHaveURL(/#case-cirs-admissions$/);
    await expect(page.locator("html")).not.toHaveAttribute("data-glass-pointer", "visible");
    await expect(page.locator(".glass-pointer-target")).toHaveCount(0);
    await expect(page.locator(".glass-arrow-cursor")).toHaveCount(0);
  });
});
