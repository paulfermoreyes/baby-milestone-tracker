import { test, expect } from "@playwright/test";

test.describe("Lumina Production App UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the production URL configured in playwright.config.ts
    // Wait for the HTML structure to load
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Wait for the loader to vanish and the header/layout to be visible (ensuring hydration)
    await page.waitForSelector("header", { state: "visible", timeout: 15000 });
  });

  test("should display the homepage title and essential headings", async ({ page }) => {
    // Verify the page title
    await expect(page).toHaveTitle(/Lumina/);

    // Verify the main header branding
    const headerTitle = page.locator("header h1");
    await expect(headerTitle).toContainText("Lumina");

    const headerSubtitle = page.locator("header p");
    await expect(headerSubtitle).toContainText("Prenatal Suite");

    // Verify the hero heading
    const heroHeading = page.locator("main h2");
    await expect(heroHeading).toContainText("Simplify Your Prenatal Journey");
  });

  test("should toggle between Sign In and Register forms", async ({ page }) => {
    // By default, Sign In tab should be active
    const signInButton = page.locator("form button[type='submit']");
    await expect(signInButton).toHaveText("Access Dashboard");

    // Register-specific inputs should NOT be visible initially
    await expect(page.locator("#name-input-form")).not.toBeVisible();
    await expect(page.locator("#week-input-form")).not.toBeVisible();
    await expect(page.locator("#partner-code-input-form")).not.toBeVisible();

    // Click on the Register tab button
    // It's the button inside the tab container that contains 'Register'
    const registerTabBtn = page.getByRole("button", { name: "Register", exact: true });
    await registerTabBtn.click();

    // Verify that the submit button text changes to Create Free Account
    await expect(signInButton).toHaveText("Create Free Account");

    // Verify Register-specific inputs are now visible
    await expect(page.locator("#name-input-form")).toBeVisible();
    await expect(page.locator("#week-input-form")).toBeVisible();
    await expect(page.locator("#partner-code-input-form")).toBeVisible();

    // Toggle back to Sign In
    const signInTabBtn = page.getByRole("button", { name: "Sign In", exact: true });
    await signInTabBtn.click();

    // Verify that the form elements toggle back
    await expect(signInButton).toHaveText("Access Dashboard");
    await expect(page.locator("#name-input-form")).not.toBeVisible();
  });

  test("should toggle the dark/light theme classes on html tag", async ({ page }) => {
    const htmlLocator = page.locator("html");
    const themeBtn = page.locator("button.theme-toggle");

    // Get current dark theme state
    const isDarkInitially = await htmlLocator.evaluate((el) => el.classList.contains("dark"));

    // Click the toggle button
    await themeBtn.click();

    // Verify theme state flips
    const isDarkAfterClick = await htmlLocator.evaluate((el) => el.classList.contains("dark"));
    expect(isDarkAfterClick).toBe(!isDarkInitially);

    // Click toggle button again
    await themeBtn.click();

    // Verify theme state flips back
    const isDarkAfterSecondClick = await htmlLocator.evaluate((el) => el.classList.contains("dark"));
    expect(isDarkAfterSecondClick).toBe(isDarkInitially);
  });

  test("should show an error alert when attempting to sign in with invalid credentials", async ({ page }) => {
    // Fill in email and password
    await page.fill("#email-input-form", "nonexistent-test-user-playwright@example.com");
    await page.fill("#password-input-form", "invalidpassword123");

    // Submit the form
    const submitBtn = page.locator("form button[type='submit']");
    await submitBtn.click();

    // Since it talks to the live Firebase on production, it should return an authentication error
    // Find the error alert container and verify it displays the expected error message
    const errorAlert = page.locator("form").locator("..").locator("div.bg-red-500\\/10");
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText("Invalid email or password. Please try again.");
  });
});
