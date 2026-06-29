import { Locator, Page } from "@playwright/test";

export class MilkPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly recordBtn: Locator;
  readonly undoBtn: Locator;
  readonly counterText: Locator;
  readonly progressMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Milk Counter" });
    this.recordBtn = page.getByRole("button", { name: "Log Milk Serving" });
    this.undoBtn = page.getByRole("button", { name: "Undo Last" });
    this.counterText = page.locator("span.text-3xl.text-sky-400");
    this.progressMessage = page.locator("p.text-xs.text-slate-400").first();
  }

  async goto() {
    await this.page.goto("/trackers/milk", { waitUntil: "domcontentloaded" });
    await this.page.waitForSelector("header", { state: "visible", timeout: 15000 });
  }

  async logMilk() {
    await this.recordBtn.click();
  }

  async undoLast() {
    await this.undoBtn.click();
  }

  async getServingsCount(): Promise<number> {
    const text = await this.counterText.innerText();
    return parseInt(text.trim(), 10);
  }
}
