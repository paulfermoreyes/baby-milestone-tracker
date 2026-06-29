import { test, expect } from "@playwright/test";
import { BloodSugarPage } from "./pages/BloodSugarPage";

test.describe("Blood Sugar Tracker E2E UI Tests", () => {
  test("should record a blood sugar reading and allow deletion in preview mode", async ({ page }) => {
    const bloodSugarPage = new BloodSugarPage(page);
    await bloodSugarPage.goto();

    // Verify tracker heading is visible
    await expect(bloodSugarPage.heading).toBeVisible();

    // Confirm that the view tab defaults to "Record" and "Fasting" slot exists
    await expect(bloodSugarPage.fastingLogBtn).toBeVisible();

    // Click "+ Log Reading" under Fasting
    await bloodSugarPage.clickLogFasting();

    // The pop-up input form should open
    await expect(bloodSugarPage.valueInput).toBeVisible();

    // Fill in a valid level (e.g. 90) and click save
    await bloodSugarPage.enterBloodSugar(90);
    await bloodSugarPage.saveLog();

    // Form should close, and Fasting card should display the recorded value "90"
    await expect(bloodSugarPage.valueInput).not.toBeVisible();
    await expect(bloodSugarPage.loggedValueText).toHaveText("90");

    // Click "Logbook" tab to verify it is recorded in historical data
    await bloodSugarPage.logbookViewBtn.click();
    await expect(page.locator("div.max-h-\\[220px\\]")).toContainText("Fasting");
    await expect(page.locator("div.max-h-\\[220px\\]")).toContainText("90");

    // Switch back to "Record" and delete the reading
    await bloodSugarPage.recordViewBtn.click();
    await bloodSugarPage.removeLog();

    // Fasting card should reset and show "+ Log Reading" again
    await expect(bloodSugarPage.fastingLogBtn).toBeVisible();
    await expect(bloodSugarPage.loggedValueText).not.toBeVisible();
  });
});
