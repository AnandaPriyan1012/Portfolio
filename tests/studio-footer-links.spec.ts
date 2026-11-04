import { test, expect } from "@playwright/test";

for (const action of ["modified", "middle"] as const) {
  test(`Studio Contact keeps native ${action} opening without changing the current page`, async ({ page, context }) => {
    await page.goto("/studio");
    await expect(page.locator(".state-opening")).toHaveCount(0);
    const link = page.locator(".screening-contact").getByRole("link");
    await expect(link).toHaveAttribute("href", "/about#contact");
    const popup = context.waitForEvent("page");
    await link.click(action === "middle" ? { button: "middle" } : { modifiers: ["Control"] });
    const opened = await popup;
    await expect(opened).toHaveURL(/\/about#contact$/);
    await expect(page).toHaveURL(/\/studio$/);
    await opened.close();
  });
}

test("Studio Contact still performs ordinary keyboard navigation to the email", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.locator(".state-opening")).toHaveCount(0);
  const link = page.locator(".screening-contact").getByRole("link");
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/about#contact$/);
  await expect(page.locator(".state-opening")).toHaveCount(0);
  await expect(page.locator("#contact h2")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "anandapriyan1012@gmail.com", exact: true })).toBeFocused();
});
