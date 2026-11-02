import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard", () => {
  test("should display admin dashboard", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/admin/);
  });

  test("should display admin users page", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/admin\/users/);
  });

  test("should display admin venues page", async ({ page }) => {
    await page.goto("/admin/venues");
    await expect(page).toHaveURL(/admin\/venues/);
  });

  test("should display admin bookings page", async ({ page }) => {
    await page.goto("/admin/bookings");
    await expect(page).toHaveURL(/admin\/bookings/);
  });

  test("should display admin reviews page", async ({ page }) => {
    await page.goto("/admin/reviews");
    await expect(page).toHaveURL(/admin\/reviews/);
  });
});
