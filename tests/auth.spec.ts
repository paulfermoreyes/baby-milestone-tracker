import { test, expect } from "@playwright/test";
import { LandingPage } from "./pages/LandingPage";

test.describe("Lumina Authentication Flow UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();
  });

  test("should toggle between Sign In and Register forms", async ({ page }) => {
    const landingPage = new LandingPage(page);

    // Default to Sign In tab
    await expect(landingPage.submitBtn).toHaveText("Access Dashboard");
    await expect(landingPage.nameInput).not.toBeVisible();
    await expect(landingPage.weekInput).not.toBeVisible();
    await expect(landingPage.partnerCodeInput).not.toBeVisible();

    // Toggle to Register
    await landingPage.switchToRegister();
    await expect(landingPage.submitBtn).toHaveText("Create Free Account");
    await expect(landingPage.nameInput).toBeVisible();
    await expect(landingPage.weekInput).toBeVisible();
    await expect(landingPage.partnerCodeInput).toBeVisible();

    // Toggle back to Sign In
    await landingPage.switchToSignIn();
    await expect(landingPage.submitBtn).toHaveText("Access Dashboard");
    await expect(landingPage.nameInput).not.toBeVisible();
  });

  test("should show validation error alert with invalid credentials", async ({ page }) => {
    const landingPage = new LandingPage(page);

    await landingPage.fillSignInForm("nonexistent-test-user-playwright@example.com", "invalidpassword123");
    await landingPage.submitForm();

    // Verify Firebase error message matches expected warning
    await expect(landingPage.errorAlert).toBeVisible({ timeout: 10000 });
    await expect(landingPage.errorAlert).toContainText("Invalid email or password. Please try again.");
  });
});
