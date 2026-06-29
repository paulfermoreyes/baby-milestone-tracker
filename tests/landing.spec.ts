import { test, expect } from "@playwright/test";
import { LandingPage } from "./pages/LandingPage";

test.describe("Lumina Homepage E2E UI Tests", () => {
  test("should display the homepage branding, headings, and details", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    // Verify page title
    await expect(page).toHaveTitle(/Lumina/);

    // Verify main header elements
    await expect(landingPage.headerTitle).toContainText("Lumina");
    await expect(landingPage.headerSubtitle).toContainText("Prenatal Suite");

    // Verify main hero title
    await expect(landingPage.heroHeading).toContainText("Simplify Your Prenatal Journey");
  });
});
