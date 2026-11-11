import { test, expect } from "@playwright/test";

test.describe("Chat Flow", () => {
  test("should display chat conversations page", async ({ page }) => {
    await page.goto("/client/chats");
    await expect(page).toHaveURL(/client\/chats/);
  });

  test("should show empty state when no chats", async ({ page }) => {
    await page.goto("/client/chats");
    await expect(page.getByText("У вас пока нет чатов")).toBeVisible();
  });
});
