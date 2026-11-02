import { test, expect } from "@playwright/test";

test.describe("Chat Flow", () => {
  test("should display chat conversations page", async ({ page }) => {
    await page.goto("/client/chats");
    await expect(page).toHaveURL(/chats/);
  });

  test("should show empty state when no chats", async ({ page }) => {
    await page.goto("/client/chats");
    await expect(page.locator("text=У вас пока нет чатов, text=Загрузка")).toBeVisible();
  });
});
