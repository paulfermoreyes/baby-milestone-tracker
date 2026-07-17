import { test, expect } from "@playwright/test";
import { BloodSugarPage } from "./pages/BloodSugarPage";

test.describe("Blood Sugar Tracker E2E UI Tests", () => {
  test("should record a blood sugar reading and allow deletion in preview mode", async ({ page }) => {
    const bloodSugarPage = new BloodSugarPage(page);
    await bloodSugarPage.goto();

    // Verify tracker heading is visible
    await expect(bloodSugarPage.heading).toBeVisible();

    // Export CSV button should not be visible when there are no logs
    await expect(page.getByRole("button", { name: "Export CSV" })).not.toBeVisible();

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

    // Click edit on Fasting card
    await bloodSugarPage.editLogBtn.click();
    await expect(bloodSugarPage.valueInput).toBeVisible();
    await expect(bloodSugarPage.valueInput).toHaveValue("90");

    // Change value to 85 and click update
    await bloodSugarPage.enterBloodSugar(85);
    await bloodSugarPage.updateBtn.click();

    // Form should close and Fasting card should now display "85"
    await expect(bloodSugarPage.valueInput).not.toBeVisible();
    await expect(bloodSugarPage.loggedValueText).toHaveText("85");

    // Click "Logbook" tab to verify it is recorded in historical data
    await bloodSugarPage.logbookViewBtn.click();
    await expect(page.locator("div.max-h-\\[220px\\]")).toContainText("Fasting");
    await expect(page.locator("div.max-h-\\[220px\\]")).toContainText("85");

    // Export CSV and verify the file download is triggered
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("blood_sugar_report_");
    expect(download.suggestedFilename()).toContain(".csv");

    // Switch back to "Record" and delete the reading
    await bloodSugarPage.recordViewBtn.click();
    await bloodSugarPage.removeLog();

    // Fasting card should reset and show "+ Log Reading" again
    await expect(bloodSugarPage.fastingLogBtn).toBeVisible();
    await expect(bloodSugarPage.loggedValueText).not.toBeVisible();
  });
});
