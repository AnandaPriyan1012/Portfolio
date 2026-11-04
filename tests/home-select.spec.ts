import { test, expect, type Page } from "@playwright/test";

async function ready(page: Page) {
  await page.goto("/");
  await page.locator(".state-opening").waitFor({ state: "detached" });
  await page.evaluate(() => document.fonts.ready);
}

test("Home selector uses real captures and separate optional previews", async ({
  page,
}) => {
  const errors: string[] = [],
    corridorRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("scroll-corridor.mp4"))
      corridorRequests.push(request.url());
  });
  await ready(page);
  const links = page
    .getByRole("navigation", { name: "Explore the portfolio" })
    .getByRole("link");
  await expect(links).toHaveCount(3);
  expect(
    await links.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("href")),
    ),
  ).toEqual(["/work", "/studio", "/about"]);
  await page
    .getByRole("button", { name: "Preview Vallalar capture", exact: true })
    .click();
  await expect(page.locator(".ap-select-art img")).toHaveAttribute(
    "src",
    "/media/vallalar-language-en-desktop.webp",
  );
  await page
    .getByRole("button", { name: "Preview AccuFlow capture", exact: true })
    .click();
  await expect(page.locator(".ap-select-art img")).toHaveAttribute(
    "src",
    "/media/accuflow-prototype-desktop.webp",
  );
  await page
    .getByRole("button", { name: "Preview Studio", exact: true })
    .click();
  await expect(page.locator(".ap-select-art img")).toHaveAttribute(
    "src",
    "/media/vantara-masquerade-poster.jpg",
  );
  await page
    .getByRole("button", {
      name: "Preview TED-Ed auditions poster",
      exact: true,
    })
    .click();
  await expect(page.locator(".ap-select-art img")).toHaveAttribute(
    "src",
    "/media/teded-auditions-poster.jpg",
  );
  await expect
    .poll(() =>
      page
        .locator(".ap-select-art img")
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  expect(new URL(page.url()).pathname).toBe("/");
  expect(corridorRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("all three route anchors navigate on their first click", async ({
  page,
}) => {
  for (const path of ["/work", "/studio", "/about"]) {
    await ready(page);
    await page.locator(`.home-directory-pages a[href="${path}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await page.locator(".state-opening").waitFor({ state: "detached" });
    await expect(page.locator("h1")).toBeVisible();
  }
});

test("keyboard previews keep native link activation and modifier clicks open a separate page", async ({
  page,
  context,
}) => {
  await ready(page);
  const about = page.getByRole("button", {
    name: "Preview About",
    exact: true,
  });
  await about.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".ap-select-signature img")).toHaveAttribute(
    "src",
    "/media/ap-signature-champagne.png",
  );
  const work = page.locator('.home-directory-pages a[href="/work"]');
  await work.focus();
  await expect(page.locator(".home-directory")).toHaveAttribute(
    "data-selection",
    "work",
  );
  await expect(work).toBeFocused();
  const popupPromise = context.waitForEvent("page");
  await work.click({ modifiers: ["Control"] });
  const popup = await popupPromise;
  await popup.waitForURL("**/work");
  expect(new URL(page.url()).pathname).toBe("/");
  await popup.close();
  await work.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/work$/);
});

test("phone previews are optional and the first route tap opens Studio without overflow", async ({
  browser,
  baseURL,
}) => {
  for (const width of [320, 390]) {
    const context = await browser.newContext({
      baseURL,
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await ready(page);
    await page
      .getByRole("button", { name: "Preview Studio", exact: true })
      .tap();
    await expect(page.locator(".ap-select-art img")).toHaveAttribute(
      "src",
      "/media/vantara-masquerade-poster.jpg",
    );
    await page
      .getByRole("button", { name: "Preview About", exact: true })
      .tap();
    await expect(page.locator(".ap-select-signature img")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator('.home-directory-pages a[href="/studio"]').tap();
    await expect(page).toHaveURL(/\/studio$/);
    await context.close();
  }
});

test("desktop scroll stages the actual artwork and reduced motion leaves it static", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  const directory = page.locator(".home-directory");
  const display = page.locator(".ap-select-display");
  const top = await directory.evaluate(
    (element) => element.getBoundingClientRect().top + scrollY,
  );
  await page.evaluate((y) => scrollTo(0, y), top - 900);
  await page.waitForTimeout(150);
  const first = await display.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await page.mouse.move(8, 500);
  await page.mouse.wheel(0, 800);
  await expect
    .poll(() =>
      display.evaluate((element) => getComputedStyle(element).transform),
    )
    .not.toBe(first);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      display.evaluate((element) => getComputedStyle(element).transform),
    )
    .toBe("none");
  await expect(page.locator(".ap-select-art img")).toBeVisible();
});

for (const capability of ["save-data", "low-cpu", "low-memory"] as const) {
  test(`Home remains static with no selector triggers on ${capability}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.addInitScript((variant) => {
      if (variant === "save-data")
        Object.defineProperty(navigator, "connection", {
          value: { saveData: true },
          configurable: true,
        });
      if (variant === "low-cpu")
        Object.defineProperty(navigator, "hardwareConcurrency", {
          value: 2,
          configurable: true,
        });
      if (variant === "low-memory")
        Object.defineProperty(navigator, "deviceMemory", {
          value: 2,
          configurable: true,
        });
    }, capability);
    await ready(page);
    const activeIds = await page.evaluate(async () => {
      // Read the already-loaded instance in both Vite and production builds.
      const moduleUrl = performance
        .getEntriesByType("resource")
        .map((item) => item.name)
        .find((name) =>
          /(?:gsap_ScrollTrigger|motion-vendor)[^/]*\.js(?:\?|$)/.test(name),
        );
      if (!moduleUrl) throw new Error("Loaded scroll module was not found");
      const loaded = await import(moduleUrl);
      const trigger = Object.values(loaded).find(
        (value) =>
          typeof (value as { getAll?: unknown })?.getAll === "function",
      ) as { getAll: () => { vars: { id?: string } }[] } | undefined;
      if (!trigger)
        throw new Error("Loaded ScrollTrigger instance was not found");
      return trigger.getAll().map((item) => item.vars.id);
    });
    expect(activeIds).not.toContain("ap-select-arrival");
    expect(activeIds).not.toContain("ap-select-light");
    for (const selector of [".ap-select-display", ".ap-select-scroll-light"]) {
      await expect(page.locator(selector)).not.toHaveAttribute(
        "style",
        /transform/,
      );
      expect(
        await page
          .locator(selector)
          .evaluate((element) => getComputedStyle(element).transform),
      ).toBe("none");
    }
    await page
      .getByRole("button", { name: "Preview Studio", exact: true })
      .click();
    await expect(page.locator(".ap-select-art figcaption")).toContainText(
      "Film poster",
    );
    await page.locator('.home-directory-pages a[href="/studio"]').click();
    await expect(page).toHaveURL(/\/studio$/);
  });
}
