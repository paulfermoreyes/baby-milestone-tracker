import { Locator, Page } from "@playwright/test";

export class SymptomsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly symptomSelect: Locator;
  readonly severitySelect: Locator;
  readonly notesInput: Locator;
  readonly submitBtn: Locator;
  readonly emptyLogText: Locator;
  readonly logsContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Symptom Diary" });
    
    // Select dropdowns
    this.symptomSelect = page.locator("select").first();
    this.severitySelect = page.locator("select").nth(1);
    
    // Notes input
    this.notesInput = page.getByPlaceholder("e.g. Occurred morning, helped with ginger tea...");
    
    // Submit button
    this.submitBtn = page.locator("main form button[type='submit']");
    
    this.emptyLogText = page.getByText("No symptoms logged today.");
    this.logsContainer = page.locator("div.overflow-y-auto").first();
  }

  async goto() {
    await this.page.goto("/trackers/symptoms", { waitUntil: "domcontentloaded" });
    await this.page.waitForSelector("header", { state: "visible", timeout: 15000 });
  }

  async selectSymptom(value: string) {
    await this.symptomSelect.selectOption(value);
  }

  async selectSeverity(value: "Mild" | "Moderate" | "Severe") {
    await this.severitySelect.selectOption(value);
  }

  async enterNotes(notes: string) {
    await this.notesInput.fill(notes);
  }

  async submitSymptom() {
    await this.submitBtn.click();
  }
}
