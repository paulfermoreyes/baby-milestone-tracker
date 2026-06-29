import { Locator, Page } from "@playwright/test";

export class WeightPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly weightInput: Locator;
  readonly submitBtn: Locator;
  readonly emptyLogText: Locator;
  readonly logsContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Weight Logger" });
    this.weightInput = page.getByPlaceholder("Weight (kg)");
    this.submitBtn = page.getByRole("button", { name: "Log" });
    this.emptyLogText = page.getByText("No weight logs recorded yet.");
    this.logsContainer = page.locator("div.max-h-\\[110px\\]");
  }

  async goto() {
    await this.page.goto("/trackers/weight", { waitUntil: "domcontentloaded" });
    await this.page.waitForSelector("header", { state: "visible", timeout: 15000 });
  }

  async logWeight(weight: number) {
    await this.weightInput.fill(String(weight));
    await this.submitBtn.click();
  }
}
