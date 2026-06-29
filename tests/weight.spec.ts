import { test, expect } from "@playwright/test";
import { WeightPage } from "./pages/WeightPage";

test.describe("Weight Tracker E2E UI Tests", () => {
  test("should input and save weight entries", async ({ page }) => {
    const weightPage = new WeightPage(page);
    await weightPage.goto();

    // Verify page elements
    await expect(weightPage.heading).toBeVisible();
    await expect(weightPage.emptyLogText).toBeVisible();

    // Log a weight entry of 65.5 kg
    await weightPage.logWeight(65.5);

    // Verify entry is logged successfully
    await expect(weightPage.emptyLogText).not.toBeVisible();
    await expect(weightPage.logsContainer).toContainText("65.5 kg");
  });
});
