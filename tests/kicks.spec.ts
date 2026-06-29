import { test, expect } from "@playwright/test";
import { KicksPage } from "./pages/KicksPage";

test.describe("Kicks Tracker E2E UI Tests", () => {
  test("should load, record a kick and undo last session locally", async ({ page }) => {
    const kicksPage = new KicksPage(page);
    await kicksPage.goto();

    // Verify page loads with the heading
    await expect(kicksPage.heading).toBeVisible();

    // Check initial kick count is 0 and empty log text is present
    await expect(kicksPage.emptyLogText).toBeVisible();
    expect(await kicksPage.getLoggedKicksCount()).toBe(0);

    // Record first kick
    await kicksPage.recordKick();

    // Verify counter increments and log list updates
    expect(await kicksPage.getLoggedKicksCount()).toBe(1);
    await expect(kicksPage.emptyLogText).not.toBeVisible();
    await expect(page.locator("text=Kick #1")).toBeVisible();

    // Undo last kick
    await kicksPage.undoLast();

    // Verify counter resets to 0 and empty log is displayed again
    expect(await kicksPage.getLoggedKicksCount()).toBe(0);
    await expect(kicksPage.emptyLogText).toBeVisible();
  });
});
