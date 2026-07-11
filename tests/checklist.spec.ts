import { test, expect } from "@playwright/test";
import { ChecklistPage } from "./pages/ChecklistPage";

test.describe("Birth Preparation Checklist E2E UI Tests", () => {
  test("should load checklist, create a custom category, and add items in guest preview mode", async ({ page }) => {
    const checklistPage = new ChecklistPage(page);
    await checklistPage.goto();

    // Verify page heading is visible
    await expect(checklistPage.heading).toBeVisible();

    // Create a new custom category named "Shower Supplies"
    await checklistPage.addCustomCategory("Shower Supplies");

    // Locate the newly created category card
    const categoryContainer = page.locator("div.glass-card").filter({
      has: page.locator("span", { hasText: "Shower Supplies" })
    });
    await expect(categoryContainer).toBeVisible();

    // Add an item to "Shower Supplies"
    const addItemInput = categoryContainer.getByPlaceholder("Add item…");
    await addItemInput.fill("Diaper Cake decoration");
    await categoryContainer.getByTitle("Add item").click();

    // Verify the item is added and displayed
    await expect(categoryContainer).toContainText("Diaper Cake decoration");
  });
});
