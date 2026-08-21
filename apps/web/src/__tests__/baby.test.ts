import { describe, it, expect } from "vitest";
import { PREDEFINED_MILESTONES } from "@/lib/baby";

describe("Baby Milestones Data Model", () => {
  it("should contain standard 0-12 month milestones across categories", () => {
    expect(PREDEFINED_MILESTONES.length).toBeGreaterThanOrEqual(16);

    const categories = new Set(PREDEFINED_MILESTONES.map((m) => m.category));
    expect(categories.has("motor")).toBe(true);
    expect(categories.has("social")).toBe(true);
    expect(categories.has("cognitive")).toBe(true);
    expect(categories.has("sensory")).toBe(true);
  });

  it("should include 2, 4, 6, 9, and 12 month age targets", () => {
    const ageTargets = new Set(PREDEFINED_MILESTONES.map((m) => m.targetAgeMonths));
    expect(ageTargets.has(2)).toBe(true);
    expect(ageTargets.has(4)).toBe(true);
    expect(ageTargets.has(6)).toBe(true);
    expect(ageTargets.has(9)).toBe(true);
    expect(ageTargets.has(12)).toBe(true);
  });
});
