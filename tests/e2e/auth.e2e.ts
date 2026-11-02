import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Banya|Sauna|Login/i);
  });

  test("should show register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/register/);
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/login/);
  });
});
