import { Locator, Page } from "@playwright/test";

export class BaptismPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly editEventBtn: Locator;
  
  // Event details form
  readonly eventDateInput: Locator;
  readonly eventTimeInput: Locator;
  readonly eventVenueNameInput: Locator;
  readonly eventVenueAddressInput: Locator;
  readonly saveDetailsBtn: Locator;
  readonly cancelEditBtn: Locator;
  
  // Displayed details
  readonly displayedVenueName: Locator;
  
  // Add Invitee Form
  readonly inviteeNameInput: Locator;
  readonly inviteeRoleSelect: Locator;
  readonly inviteeStatusSelect: Locator;
  readonly addInviteeBtn: Locator;
  
  // Invitees table / list
  readonly rsvpRateText: Locator;
  readonly godparentsText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Baptismal Event Organizer" });
    
    // Ceremony card buttons
    this.editEventBtn = page.getByRole("button", { name: "Edit" });
    
    // Form fields
    this.eventDateInput = page.locator("#event-date");
    this.eventTimeInput = page.locator("#event-time");
    this.eventVenueNameInput = page.locator("#event-venue-name");
    this.eventVenueAddressInput = page.locator("#event-venue-address");
    this.saveDetailsBtn = page.getByRole("button", { name: "Save Details" });
    this.cancelEditBtn = page.getByRole("button", { name: "Cancel" });
    
    // Displayed details
    this.displayedVenueName = page.locator("div.glass-card").first().locator("h3.text-xl");

    // Add Invitee
    this.inviteeNameInput = page.locator("#invitee-name");
    this.inviteeRoleSelect = page.locator("#invitee-role");
    this.inviteeStatusSelect = page.locator("#invitee-status");
    this.addInviteeBtn = page.getByRole("button", { name: "Add to List" });
    
    // Metrics
    this.rsvpRateText = page.locator("span.from-purple-400");
    this.godparentsText = page.locator("text=/.*RSVPs.*/");
  }

  async goto() {
    await this.page.goto("/trackers/baptism", { waitUntil: "domcontentloaded" });
    await this.page.waitForSelector("header", { state: "visible", timeout: 15000 });
  }

  async editEvent(date: string, time: string, venue: string, address: string) {
    await this.editEventBtn.click();
    await this.eventDateInput.fill(date);
    await this.eventTimeInput.fill(time);
    await this.eventVenueNameInput.fill(venue);
    await this.eventVenueAddressInput.fill(address);
    await this.saveDetailsBtn.click();
  }

  async addInvitee(name: string, role: string, status: string) {
    await this.inviteeNameInput.fill(name);
    await this.inviteeRoleSelect.selectOption(role);
    await this.inviteeStatusSelect.selectOption(status);
    await this.addInviteeBtn.click();
  }
}
