import { test, expect } from "@playwright/test";
import { ChecklistPage } from "./pages/ChecklistPage";

test.describe("Birth Preparation Checklist E2E UI Tests", () => {
  test("should load checklist, create a custom category, and add items in guest preview mode", async ({
    page,
  }) => {
    const checklistPage = new ChecklistPage(page);
    await checklistPage.goto();

    // Verify page heading is visible
    await expect(checklistPage.heading).toBeVisible();

    // Create a new custom category named "Shower Supplies"
    await checklistPage.addCustomCategory("Shower Supplies");

    // Locate the newly created category card
    const categoryContainer = page.locator("div.glass-card").filter({
      has: page.locator("span", { hasText: "Shower Supplies" }),
    });
    await expect(categoryContainer).toBeVisible();

    // Add an item to "Shower Supplies"
    const addItemInput = categoryContainer.getByPlaceholder("Add item…");
    await addItemInput.fill("Diaper Cake decoration");
    await categoryContainer.getByTitle("Add item").click();

    // Verify the item is added and displayed
    await expect(categoryContainer).toContainText("Diaper Cake decoration");
  });

  test("should adjust item quantity and specify item cost with total budget updates", async ({
    page,
  }) => {
    const checklistPage = new ChecklistPage(page);
    await checklistPage.goto();

    // Verify overall progress card is visible
    await expect(
      page.locator("text=Overall Progress & Inventory"),
    ).toBeVisible();

    // Find the first item container (e.g. Crib / bassinet)
    const cribItem = page
      .locator("div.group")
      .filter({
        hasText: "Crib / bassinet",
      })
      .first();

    await expect(cribItem).toBeVisible();

    // Click quantity increase button (+)
    const increaseBtn = cribItem.getByTitle("Increase quantity");
    await increaseBtn.click();
    await increaseBtn.click(); // Quantity should now be 3

    // Verify quantity counter displays 3
    await expect(cribItem).toContainText("3");

    // Click Cost button to open cost edit field
    const costBtn = cribItem.getByTitle("Specify item cost");
    await costBtn.click();

    // Enter cost 150.00
    const costInput = cribItem.getByPlaceholder("0.00");
    await costInput.fill("150.00");

    // Click Save
    await cribItem.getByRole("button", { name: "Save" }).click();

    // Verify item displays updated cost tag
    await expect(cribItem).toContainText("$450.00");

    // Verify top summary displays total estimated cost of at least $450.00
    await expect(page.getByText("$450.00", { exact: true })).toBeVisible();
  });

  test("should persist custom categories and items across session reloads and support progress reset", async ({
    page,
  }) => {
    const checklistPage = new ChecklistPage(page);
    await checklistPage.goto();

    // Session #1: Create categories "Consumables" and "Grooming", add "toothbrush" under Grooming
    await checklistPage.addCustomCategory("Consumables");
    await checklistPage.addCustomCategory("Grooming");

    const groomingCard = page.locator("div.glass-card").filter({
      has: page.locator("span", { hasText: "Grooming" }),
    });
    await expect(groomingCard).toBeVisible();

    const addItemInput = groomingCard.getByPlaceholder("Add item…");
    await addItemInput.fill("toothbrush");
    await groomingCard.getByTitle("Add item").click();
    await expect(groomingCard).toContainText("toothbrush");

    // Session #2: Reload the page to simulate new session
    await page.reload();
    await expect(checklistPage.heading).toBeVisible();

    // Verify categories Consumables and Grooming and toothbrush still exist
    const consumablesCardAfterReload = page.locator("div.glass-card").filter({
      has: page.locator("span", { hasText: "Consumables" }),
    });
    const groomingCardAfterReload = page.locator("div.glass-card").filter({
      has: page.locator("span", { hasText: "Grooming" }),
    });

    await expect(consumablesCardAfterReload).toBeVisible();
    await expect(groomingCardAfterReload).toBeVisible();
    await expect(groomingCardAfterReload).toContainText("toothbrush");

    // Test Reset Session modal
    await page.getByTitle("Reset Session / Checklist").click();
    await expect(page.getByText("Reset Checklist Session")).toBeVisible();

    // Click "Reset Progress Only"
    await page
      .getByText("Reset Progress Only (Preserve Categories & Items)")
      .click();

    // Ensure custom categories & toothbrush are still preserved
    await expect(consumablesCardAfterReload).toBeVisible();
    await expect(groomingCardAfterReload).toBeVisible();
    await expect(groomingCardAfterReload).toContainText("toothbrush");
  });
});
