import { test, expect } from "@playwright/test";
import { BaptismPage } from "./pages/BaptismPage";

test.describe("Baptism Organizer E2E UI Tests", () => {
  test("should update ceremony details and manage guests list in preview mode", async ({ page }) => {
    const baptismPage = new BaptismPage(page);
    await baptismPage.goto();

    // Verify organizer page loads
    await expect(baptismPage.heading).toBeVisible();

    // Update event ceremony details
    await baptismPage.editEvent(
      "2026-08-15",
      "10:00",
      "St. John the Baptist Parish",
      "789 Cathedral Way, Grace City"
    );

    // Verify updated details display on screen
    await expect(baptismPage.displayedVenueName).toHaveText("St. John the Baptist Parish");
    await expect(page.locator("text=789 Cathedral Way, Grace City")).toBeVisible();

    // Add a Godfather invitee with confirmed status
    await baptismPage.addInvitee("Robert Smith", "godfather", "confirmed");

    // Add a Guest invitee with pending status
    await baptismPage.addInvitee("Sarah Davis", "guest", "pending");

    // Verify RSVP metric updates and names appear in the guest lists
    await expect(page.locator("text=Robert Smith")).toBeVisible();
    await expect(page.locator("text=Sarah Davis")).toBeVisible();

    // Check that godfather role badge shows up
    await expect(page.locator("span:has-text('Godfather')").first()).toBeVisible();
  });
});
