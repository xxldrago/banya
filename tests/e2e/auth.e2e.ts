import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Вход|Sign in|Login/i);
  });

  test("should show register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/register/);
  });

  test("should redirect unauthenticated users from catalog to homepage", async ({ page }) => {
    // /catalog без cityId-куки → 307 → главная (/parda.html)
    await page.goto("/catalog");
    await expect(page).toHaveURL(/parda\.html|^\/$/);
  });
});
