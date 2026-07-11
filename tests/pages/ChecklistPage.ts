import { Locator, Page } from "@playwright/test";

export class ChecklistPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly categoryNameInput: Locator;
  readonly addCategoryBtn: Locator;
  readonly addCategoryHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Birth Preparation Checklist" });
    this.categoryNameInput = page.getByPlaceholder("Category name…");
    this.addCategoryHeader = page.getByRole("heading", { name: "Add Custom Category" });
    // Find button within the Add Custom Category container
    this.addCategoryBtn = page.locator("div.glass-card").filter({
      has: page.getByRole("heading", { name: "Add Custom Category" })
    }).getByRole("button");
  }

  async goto() {
    await this.page.goto("/trackers/birth-preparation-checklist", { waitUntil: "domcontentloaded" });
    await this.page.waitForSelector("header", { state: "visible", timeout: 15000 });
  }

  async addCustomCategory(name: string) {
    await this.categoryNameInput.fill(name);
    await this.addCategoryBtn.click();
  }
}
