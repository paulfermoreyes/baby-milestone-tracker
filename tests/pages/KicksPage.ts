import { Locator, Page } from "@playwright/test";

export class KicksPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly recordBtn: Locator;
  readonly undoBtn: Locator;
  readonly counterText: Locator;
  readonly emptyLogText: Locator;
  readonly logsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Fetal Kick Counter" });
    this.recordBtn = page.getByRole("button", { name: "Record a Kick" });
    this.undoBtn = page.getByRole("button", { name: "Undo Last" });
    this.counterText = page.locator("span.bg-gradient-to-r.from-cyan-400");
    this.emptyLogText = page.getByText("No kicks recorded in this session yet.");
    this.logsList = page.locator("div.max-h-\\[160px\\]");
  }

  async goto() {
    await this.page.goto("/trackers/kicks", { waitUntil: "domcontentloaded" });
    await this.page.waitForSelector("header", { state: "visible", timeout: 15000 });
  }

  async recordKick() {
    await this.recordBtn.click();
  }

  async undoLast() {
    await this.undoBtn.click();
  }

  async getLoggedKicksCount(): Promise<number> {
    const text = await this.counterText.innerText();
    return parseInt(text.trim(), 10);
  }
}
