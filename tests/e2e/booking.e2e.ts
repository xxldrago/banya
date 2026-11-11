import { test, expect } from "@playwright/test";

test.describe("Booking Flow", () => {
  test("should display catalog page", async ({ page }) => {
    await page.context().addCookies([
      { name: "cityId", value: "cmvz5bz4z0000ujhqxdog0q0p", url: "http://localhost:3000" },
    ]);
    await page.goto("/catalog");
    await expect(page).toHaveURL(/catalog/);
  });

  test("should display venue details", async ({ page }) => {
    await page.context().addCookies([
      { name: "cityId", value: "cmvz5bz4z0000ujhqxdog0q0p", url: "http://localhost:3000" },
    ]);
    await page.goto("/catalog");
    const firstVenue = page.locator('a[href^="/catalog/"]').first();
    await expect(firstVenue).toBeVisible();
    await firstVenue.click();
    await expect(page).toHaveURL(/catalog\//);
  });
});
