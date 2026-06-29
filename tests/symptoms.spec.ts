import { test, expect } from "@playwright/test";
import { SymptomsPage } from "./pages/SymptomsPage";

test.describe("Symptoms Diary E2E UI Tests", () => {
  test("should select details, write notes, and log symptoms successfully", async ({ page }) => {
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

    const symptomsPage = new SymptomsPage(page);
    await symptomsPage.goto();

    // Verify page loads
    await expect(symptomsPage.heading).toBeVisible();
    await expect(symptomsPage.emptyLogText).toBeVisible();

    // Fill form details
    await symptomsPage.selectSymptom("Fatigue");
    await symptomsPage.selectSeverity("Severe");
    await symptomsPage.enterNotes("Felt very tired in the afternoon.");

    // Submit symptom log
    await symptomsPage.submitSymptom();

    // Log list updates and empty message is hidden
    await expect(symptomsPage.emptyLogText).not.toBeVisible();
    await expect(symptomsPage.logsContainer).toContainText("Fatigue");
    await expect(symptomsPage.logsContainer).toContainText("Severe");
    await expect(symptomsPage.logsContainer).toContainText("Felt very tired");
  });
});
