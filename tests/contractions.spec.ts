import { test, expect } from "@playwright/test";
import { ContractionsPage } from "./pages/ContractionsPage";

test.describe("Contractions Tracker E2E UI Tests", () => {
  test("should start, stop, log, and render contraction timer correctly", async ({ page }) => {
    const contractionsPage = new ContractionsPage(page);
    await contractionsPage.goto();

    // Verify page loads successfully
    await expect(contractionsPage.heading).toBeVisible();
    await expect(contractionsPage.emptyLogText).toBeVisible();

    // Start contraction timer
    await contractionsPage.startContraction();

    // Button should now read "Stop Contraction" and timer should animate/pulse
    await expect(contractionsPage.actionBtn).toHaveText(/Stop Contraction/);
    await expect(contractionsPage.timerDisplay).toBeVisible();

    // Wait a brief moment to simulate a 1-second contraction
    await page.waitForTimeout(1100);

    // Stop contraction timer
    await contractionsPage.stopContraction();

    // Button flips back and log is successfully added to the log layout
    await expect(contractionsPage.actionBtn).toHaveText(/Start Contraction/);
    await expect(contractionsPage.emptyLogText).not.toBeVisible();
    await expect(contractionsPage.logsContainer).toContainText("Contraction #1");
  });
});
