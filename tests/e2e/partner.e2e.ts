import { test, expect } from "@playwright/test";

test.describe("Partner Cabinet", () => {
  test("should display partner dashboard", async ({ page }) => {
    await page.goto("/partner");
    await expect(page).toHaveURL(/partner/);
  });

  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/login/);
  });

  test("should display venues page structure", async ({ page }) => {
    await page.goto("/partner/venues");
    await expect(page).toHaveURL(/partner\/venues/);
  });

  test("should display bookings page structure", async ({ page }) => {
    await page.goto("/partner/bookings");
    await expect(page).toHaveURL(/partner\/bookings/);
  });
});
