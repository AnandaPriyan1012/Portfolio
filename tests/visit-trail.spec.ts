import { test, expect, type Page } from "@playwright/test";

const key = "ap-visit-trail-v1";
const navigation = (page: Page) => page.getByRole("navigation", { name: "Main navigation" });
const trail = (page: Page) => page.locator(".ap-select-trail");

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => { throw error; });

});

async function home(page: Page) {
  await page.locator(".atelier-navigation .wordmark").click();
  await expect(page).toHaveURL(/\/$/);
  await page.locator(".state-opening").waitFor({ state: "detached" });
}

async function visits(page: Page) {
  return page.evaluate((storageKey) => JSON.parse(sessionStorage.getItem(storageKey) ?? "[]"), key);
}

test("actual main-page visits survive Back, deduplicate and persist on reload", async ({ page }) => {
  await page.goto("/");
  await expect(trail(page)).toContainText("0 / 3 pages visited");
  await navigation(page).getByRole("link", { name: "Work", exact: true }).click();
  await navigation(page).getByRole("link", { name: "Studio", exact: true }).click();
  await page.goBack();
  await expect(page).toHaveURL(/\/work$/);
  await navigation(page).getByRole("link", { name: "About", exact: true }).click();
  await home(page);
  await expect(trail(page)).toContainText("3 / 3 pages visited");
  expect(await visits(page)).toEqual(["/work", "/studio", "/about"]);
  await page.reload();
  await expect(trail(page)).toContainText("3 / 3 pages visited");
  expect(await visits(page)).toEqual(["/work", "/studio", "/about"]);
});

test("Home, case studies, unknown routes, hover and another tab do not invent visits", async ({ page, context }) => {
  await page.goto("/projects/cirs");
  expect(await visits(page)).toEqual([]);
  await page.goto("/nothing-here");
  expect(await visits(page)).toEqual([]);
  await page.goto("/");
  await page.locator(".state-opening").waitFor({ state: "detached" });
  const work = navigation(page).getByRole("link", { name: "Work", exact: true });
  await work.hover();
  await expect(trail(page)).toContainText("0 / 3 pages visited");
  const [tab] = await Promise.all([
    context.waitForEvent("page"),
    work.click({ modifiers: ["ControlOrMeta"] }),
  ]);
  await expect(tab).toHaveURL(/\/work$/);
  await expect.poll(() => visits(tab)).toEqual(["/work"]);
  await expect(page).toHaveURL(/\/$/);
  expect(await visits(page)).toEqual([]);
  await expect(trail(page)).toContainText("0 / 3 pages visited");
  await tab.close();
});

test("reset clears only this trail and the next real visit starts a new trail", async ({ page }) => {
  await page.goto("/work");
  await page.evaluate(() => {
    localStorage.setItem("ap-motion", "off");
    localStorage.setItem("ap-atelier-theme", "light");
    sessionStorage.setItem("unrelated-session-note", "keep");
  });
  await home(page);
  await expect(trail(page)).toContainText("1 / 3 pages visited");
  await page.getByRole("button", { name: "Reset visit trail", exact: true }).click();
  await expect(trail(page)).toContainText("0 / 3 pages visited");
  await expect.poll(() => visits(page)).toEqual([]);
  expect(await page.evaluate(() => [localStorage.getItem("ap-motion"), localStorage.getItem("ap-atelier-theme"), sessionStorage.getItem("unrelated-session-note")])).toEqual(["off", "light", "keep"]);
  await page.reload();
  await expect(trail(page)).toContainText("0 / 3 pages visited");
  await navigation(page).getByRole("link", { name: "Studio", exact: true }).click();
  await home(page);
  await expect(trail(page)).toContainText("1 / 3 pages visited");
  expect(await visits(page)).toEqual(["/studio"]);
});

test("stored data is whitelisted and deduplicated before display", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((storageKey) => sessionStorage.setItem(storageKey, JSON.stringify([
    "/work", "/work", "/projects/cirs", "/", "/studio/", "/about#contact", 7, { path: "/about" }, "/studio",
  ])), key);
  await page.reload();
  await expect(trail(page)).toContainText("2 / 3 pages visited");
  expect(await visits(page)).toEqual(["/work", "/studio"]);
  await page.goto("/about/?from=trail");
  await home(page);
  await expect(trail(page)).toContainText("3 / 3 pages visited");
  expect(await visits(page)).toEqual(["/work", "/studio", "/about"]);
});

test("malformed or non-array storage never creates visits or errors", async ({ page }) => {
  await page.goto("/");
  for (const value of ["not-json", "null", '{"path":"/work"}']) {
    await page.evaluate(({ storageKey, value }) => sessionStorage.setItem(storageKey, value), { storageKey: key, value });
    await page.reload();
    await expect(trail(page)).toContainText("0 / 3 pages visited");
    expect(await visits(page)).toEqual([]);
  }
});

for (const failure of ["read", "write"] as const) {
  test(`denied storage ${failure} keeps exploration and reset usable in memory`, async ({ page }) => {
    await page.addInitScript((failure) => {
      if (failure === "read") Object.defineProperty(window, "sessionStorage", { get() { throw new DOMException("Denied", "SecurityError"); } });
      else {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key === "ap-visit-trail-v1") throw new DOMException("Full", "QuotaExceededError");
          original.call(this, key, value);
        };
      }
    }, failure);
    await page.goto("/work");
    await navigation(page).getByRole("link", { name: "About", exact: true }).click();
    await home(page);
    await expect(trail(page)).toContainText("2 / 3 pages visited");
    await page.getByRole("button", { name: "Reset visit trail", exact: true }).click();
    await expect(trail(page)).toContainText("0 / 3 pages visited");
    await navigation(page).getByRole("link", { name: "Studio", exact: true }).click();
    await home(page);
    await expect(trail(page)).toContainText("1 / 3 pages visited");
    await page.reload();
    await expect(trail(page)).toContainText("0 / 3 pages visited");
  });
}
