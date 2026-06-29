import { test, expect } from "@playwright/test";
import { LandingPage } from "./pages/LandingPage";

test.describe("Lumina Theme Toggle UI Tests", () => {
  test("should toggle the dark/light theme classes on html tag", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    const htmlLocator = page.locator("html");

    // Get current dark theme state
    const isDarkInitially = await htmlLocator.evaluate((el) => el.classList.contains("dark"));

    // Click the toggle button
    await landingPage.toggleTheme();

    // Verify theme state flips
    const isDarkAfterClick = await htmlLocator.evaluate((el) => el.classList.contains("dark"));
    expect(isDarkAfterClick).toBe(!isDarkInitially);

    // Click toggle button again
    await landingPage.toggleTheme();

    // Verify theme state flips back
    const isDarkAfterSecondClick = await htmlLocator.evaluate((el) => el.classList.contains("dark"));
    expect(isDarkAfterSecondClick).toBe(isDarkInitially);
  });
});
