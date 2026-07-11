import { Locator, Page } from "@playwright/test";

export class BloodSugarPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly recordViewBtn: Locator;
  readonly graphViewBtn: Locator;
  readonly logbookViewBtn: Locator;
  
  // Fasting slot locators
  readonly fastingContainer: Locator;
  readonly fastingLogBtn: Locator;
  readonly valueInput: Locator;
  readonly saveBtn: Locator;
  readonly updateBtn: Locator;
  readonly closeFormBtn: Locator;
  readonly loggedValueText: Locator;
  readonly editLogBtn: Locator;
  readonly removeLogBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Daily Blood Sugar Logs" });
    
    // View tabs
    this.recordViewBtn = page.getByRole("button", { name: "Record", exact: true });
    this.graphViewBtn = page.getByRole("button", { name: "Graph", exact: true });
    this.logbookViewBtn = page.getByRole("button", { name: "Logbook", exact: true });

    // Fasting card slot
    this.fastingContainer = page.locator("div.rounded-2xl").filter({ has: page.locator("h4", { hasText: "Before Breakfast" }) }).first();
    this.fastingLogBtn = this.fastingContainer.getByRole("button", { name: "+ Log Reading" });
    
    // Entry Form Pop-up
    this.valueInput = page.getByPlaceholder("Blood sugar level (e.g. 95)");
    this.saveBtn = page.getByRole("button", { name: "Save Log" });
    this.updateBtn = page.getByRole("button", { name: "Update Log" });
    this.closeFormBtn = page.getByRole("button", { name: "Close" });
    
    // Logged values in slot cards
    this.loggedValueText = this.fastingContainer.locator("span.text-2xl");
    this.editLogBtn = this.fastingContainer.getByTitle("Edit log");
    this.removeLogBtn = this.fastingContainer.getByTitle("Remove log");
  }

  async goto() {
    await this.page.goto("/trackers/blood-sugar", { waitUntil: "domcontentloaded" });
    await this.page.waitForSelector("header", { state: "visible", timeout: 15000 });
  }

  async clickLogFasting() {
    await this.fastingLogBtn.click();
  }

  async enterBloodSugar(value: number) {
    await this.valueInput.fill(String(value));
  }

  async saveLog() {
    await this.saveBtn.click();
  }

  async removeLog() {
    await this.removeLogBtn.click();
  }
}
