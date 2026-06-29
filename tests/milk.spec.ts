import { test, expect } from "@playwright/test";
import { MilkPage } from "./pages/MilkPage";

test.describe("Milk Counter E2E UI Tests", () => {
  test("should load, log a milk serving and undo the action successfully", async ({ page }) => {
    const milkPage = new MilkPage(page);
    await milkPage.goto();

    // Verify page loads
    await expect(milkPage.heading).toBeVisible();
    expect(await milkPage.getServingsCount()).toBe(0);

    // Assert that the Undo button is not initially visible when count is 0
    await expect(milkPage.undoBtn).not.toBeVisible();

    // Log a milk serving
    await milkPage.logMilk();

    // Counter increments, Undo button appears, progress message updates
    expect(await milkPage.getServingsCount()).toBe(1);
    await expect(milkPage.undoBtn).toBeVisible();
    await expect(milkPage.progressMessage).toContainText("1 serving down");

    // Log another serving to meet the goal
    await milkPage.logMilk();
    expect(await milkPage.getServingsCount()).toBe(2);
    await expect(milkPage.progressMessage).toContainText("Daily calcium target met");

    // Undo the last log
    await milkPage.undoLast();
    expect(await milkPage.getServingsCount()).toBe(1);
    await expect(milkPage.progressMessage).toContainText("1 serving down");
  });
});
