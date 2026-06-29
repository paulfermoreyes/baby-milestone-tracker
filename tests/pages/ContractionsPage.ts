import { Locator, Page } from "@playwright/test";

export class ContractionsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly actionBtn: Locator;
  readonly timerDisplay: Locator;
  readonly emptyLogText: Locator;
  readonly logsContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Contraction Timer" });
    this.actionBtn = page.locator("button:has-text('Contraction')");
    this.timerDisplay = page.locator("span.font-mono.tracking-wider");
    this.emptyLogText = page.getByText("No contractions logged yet.");
    this.logsContainer = page.locator("div.max-h-\\[140px\\]");
  }

  async goto() {
    await this.page.goto("/trackers/contractions", { waitUntil: "domcontentloaded" });
    await this.page.waitForSelector("header", { state: "visible", timeout: 15000 });
  }

  async startContraction() {
    await this.actionBtn.click();
  }

  async stopContraction() {
    await this.actionBtn.click();
  }
}
