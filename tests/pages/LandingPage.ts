import { Locator, Page, expect } from "@playwright/test";

export class LandingPage {
  readonly page: Page;
  readonly headerTitle: Locator;
  readonly headerSubtitle: Locator;
  readonly heroHeading: Locator;
  readonly themeToggleBtn: Locator;
  readonly signInTabBtn: Locator;
  readonly registerTabBtn: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly nameInput: Locator;
  readonly weekInput: Locator;
  readonly partnerCodeInput: Locator;
  readonly submitBtn: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Header & Hero selectors
    this.headerTitle = page.locator("header h1");
    this.headerSubtitle = page.locator("header p");
    this.heroHeading = page.locator("main h2");
    
    // Theme toggle
    this.themeToggleBtn = page.locator("button.theme-toggle");
    
    // Auth Tab buttons
    this.signInTabBtn = page.getByRole("button", { name: "Sign In", exact: true });
    this.registerTabBtn = page.getByRole("button", { name: "Register", exact: true });
    
    // Auth Form Input selectors (using labels for accessibility/POM best practices)
    this.nameInput = page.locator("#name-input-form");
    this.weekInput = page.locator("#week-input-form");
    this.partnerCodeInput = page.locator("#partner-code-input-form");
    this.emailInput = page.locator("#email-input-form");
    this.passwordInput = page.locator("#password-input-form");
    
    // Submit button
    this.submitBtn = page.locator("form button[type='submit']");
    
    // Error notification block
    this.errorAlert = page.locator("form").locator("..").locator("div.bg-red-500\\/10");
  }

  async goto() {
    await this.page.goto("/", { waitUntil: "domcontentloaded" });
    // Verify that the layout is loaded (ensuring hydration/loader is gone)
    await this.page.waitForSelector("header", { state: "visible", timeout: 15000 });
  }

  async toggleTheme() {
    await this.themeToggleBtn.click();
  }

  async switchToRegister() {
    await this.registerTabBtn.click();
  }

  async switchToSignIn() {
    await this.signInTabBtn.click();
  }

  async fillSignInForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async fillRegisterForm(name: string, week: number, email: string, password: string) {
    await this.nameInput.fill(name);
    await this.weekInput.fill(String(week));
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submitForm() {
    await this.submitBtn.click();
  }
}
