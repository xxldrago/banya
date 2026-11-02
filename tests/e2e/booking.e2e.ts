import { test, expect } from "@playwright/test";

test.describe("Booking Flow", () => {
  test("should display catalog page", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page).toHaveURL(/catalog/);
  });

  test("should display venue details", async ({ page }) => {
    await page.goto("/catalog");
    const firstVenue = page.locator('a[href^="/catalog/"]').first();
    if (await firstVenue.isVisible()) {
      await firstVenue.click();
      await expect(page).toHaveURL(/catalog\//);
    }
  });
});
