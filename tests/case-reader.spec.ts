import { expect, test, type Locator, type Page } from "@playwright/test";

async function ready(page: Page, path = "/projects/community") {
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".case-media img").evaluate((image) =>
    (image as HTMLImageElement).decode(),
  );
}

async function readChapter(page: Page, chapter: Locator, fraction = 0.45) {
  await chapter.evaluate((element, fraction) => {
    const rect = element.getBoundingClientRect();
    window.scrollTo({
      top:
        window.scrollY +
        rect.top +
        rect.height * fraction -
        Math.max(120, window.innerHeight * 0.32),
      behavior: "instant",
    });
  }, fraction);
  await expect(chapter).toHaveAttribute("data-reading", "");
  await expect(
    page.getByRole("navigation", { name: "Case study chapters" }).locator('[aria-current="location"]'),
  ).toHaveAttribute("href", `#${await chapter.getAttribute("id")}`);
}

async function progress(page: Page) {
  return page.getByRole("progressbar", { name: "Case study reading progress" }).evaluate(
    (element) => (element as HTMLProgressElement).value,
  );
}

test.describe("case-study reading motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("progress, chapter edge and index follow forward and reverse reading without moving the writing", async ({ page }) => {
    await ready(page);
    await expect.poll(() => progress(page)).toBe(0);
    const chapters = page.locator(".case-stage");
    await readChapter(page, chapters.nth(1));
    const middle = await progress(page);
    // Genuine evidence now follows the text. Assert forward/reverse reading,
    // not a percentage tied to the former text-only page length.
    expect(middle).toBeGreaterThan(0);
    expect(middle).toBeLessThan(100);
    await expect(chapters.nth(1)).toHaveCSS("transform", "none");
    await expect(chapters.nth(1).locator("p")).toHaveCSS("transform", "none");
    await expect.poll(() => chapters.nth(1).evaluate((element) =>
      getComputedStyle(element, "::before").opacity,
    )).toBe("1");
    const trace = await chapters.nth(1).evaluate((element) =>
      new DOMMatrix(getComputedStyle(element, "::after").transform).d,
    );
    expect(trace).toBeGreaterThan(0.4);
    expect(trace).toBeLessThan(0.5);
    await readChapter(page, chapters.nth(3));
    expect(await progress(page)).toBeGreaterThan(middle);
    await readChapter(page, chapters.nth(0));
    expect(await progress(page)).toBeLessThan(middle);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect.poll(() => progress(page)).toBe(0);
  });

  test("real media arrives in depth, settles clear, and the reader does no work while idle", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
      Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
    });
    await ready(page);
    await expect(page.locator(".case-page")).toHaveAttribute("data-reader-depth", "");
    const media = page.locator(".case-media [data-reader-media]");
    expect(await media.evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
    await media.evaluate((element) => window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().top - 100,
      behavior: "instant",
    }));
    await expect.poll(() => media.evaluate((element) =>
      Number(getComputedStyle(element).getPropertyValue("--media-arrival")),
    )).toBe(1);
    const image = media.locator("img");
    expect(await image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(300);
    await expect(image).toHaveCSS("filter", "none");
    await page.waitForTimeout(300);
    const idleMutations = await page.locator(".case-page").evaluate((element) =>
      new Promise<number>((resolve) => {
        let changes = 0;
        const observer = new MutationObserver((records) => { changes += records.length; });
        observer.observe(element, { subtree: true, attributes: true, attributeFilter: ["style"] });
        window.setTimeout(() => { observer.disconnect(); resolve(changes); }, 350);
      }),
    );
    expect(idleMutations).toBe(0);
  });

  test("native keyboard chapter anchors, reading cuts and case changes keep one accurate index", async ({ page }) => {
    await ready(page, "/projects/cirs");
    const navigation = page.getByRole("navigation", { name: "Case study chapters" });
    const admissions = navigation.getByRole("link", { name: "The Admissions page", exact: true });
    await admissions.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#case-cirs-admissions$/);
    await expect(page.locator("#case-cirs-admissions")).toBeFocused();
    await expect(admissions).toHaveAttribute("aria-current", "location");
    await page.getByRole("button", { name: "Quick cut", exact: true }).click();
    await expect(page.locator(".case-stage")).toHaveCount(3);
    await expect(navigation.getByRole("link")).toHaveCount(5);
    await expect(navigation.getByRole("link", { name: "The website launch film", exact: true })).toHaveAttribute("href", "#case-cirs-launch");
    await readChapter(page, page.locator(".case-stage").nth(1));
    await page.getByRole("button", { name: "Director’s cut", exact: true }).click();
    await expect(page.locator(".case-stage")).toHaveCount(4);
    await expect(navigation.getByRole("link")).toHaveCount(6);
    await expect(page.locator(".case-admissions img")).toHaveAttribute("src", /cirs-admissions/);
    await page.locator(".case-next-story").click();
    await expect(page).toHaveURL(/\/projects\/community$/);
    await expect.poll(() => progress(page)).toBe(0);
    await readChapter(page, page.locator(".case-stage").nth(2));
    await page.goBack();
    await expect(page.locator(".case-page")).toHaveAttribute("data-project", "cirs");
    await expect(page.getByRole("progressbar")).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Case study chapters" })).toHaveCount(1);
    await readChapter(page, page.locator(".case-stage").nth(0));
  });
});

test.describe("quiet case-study variants", () => {
  test("saved Motion off keeps a capable desktop flat through scrolling, reading cuts and reload", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
      Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
    });
    await page.goto("/about");
    await page.getByRole("button", { name: "Motion on", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
    expect(await page.evaluate(() => localStorage.getItem("ap-motion"))).toBe("off");
    await ready(page, "/projects/cirs");
    await page.reload();
    const reader = page.locator(".case-page");
    await expect(reader).toHaveAttribute("data-reader-motion", "off");
    await expect(reader).not.toHaveAttribute("data-reader-depth", "");
    const sources = page.locator("[data-reader-media]");
    for (const source of await sources.all()) await expect(source).toHaveCSS("transform", "none");
    await readChapter(page, page.locator(".case-stage").nth(1));
    expect(await progress(page)).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Quick cut", exact: true }).click();
    await expect(page.locator(".case-stage")).toHaveCount(3);
    await readChapter(page, page.locator(".case-stage").nth(2));
    await expect(reader).not.toHaveAttribute("data-reader-depth", "");
    for (const source of await sources.all()) await expect(source).toHaveCSS("transform", "none");
    await expect(page.locator(".case-stage").nth(2).locator("p")).toHaveCSS("transform", "none");
  });

  test("phone and reduced motion keep sources flat, text legible and progress functional", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: test.info().project.use.baseURL,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await ready(page, "/projects/accuflow");
    await expect(page.locator(".case-page")).not.toHaveAttribute("data-reader-depth", "");
    await expect(page.locator("[data-reader-media]")).toHaveCSS("transform", "none");
    await readChapter(page, page.locator(".case-stage").nth(2));
    const textProgress = await progress(page);
    expect(textProgress).toBeGreaterThan(0);
    expect(textProgress).toBeLessThan(100);
    await expect(page.locator(".case-stage").nth(2).locator("p")).toHaveCSS("transform", "none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await readChapter(page, page.locator("#case-accuflow-interfaces"));
    expect(await progress(page)).toBeGreaterThan(textProgress);
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await expect.poll(() => progress(page)).toBe(100);
    await context.close();
  });

  test("resource-constrained desktop retains a flat source and a working story index", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "deviceMemory", { get: () => 2 });
    });
    await ready(page);
    await expect(page.locator(".case-page")).not.toHaveAttribute("data-reader-depth", "");
    await expect(page.locator("[data-reader-media]")).toHaveCSS("transform", "none");
    await readChapter(page, page.locator(".case-stage").nth(0));
    const initial = await progress(page);
    await readChapter(page, page.locator(".case-stage").nth(2));
    const textProgress = await progress(page);
    expect(textProgress).toBeGreaterThan(initial);
    await readChapter(page, page.locator("#case-community-languages"));
    expect(await progress(page)).toBeGreaterThan(textProgress);
  });
});
