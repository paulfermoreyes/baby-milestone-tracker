import { describe, it, expect } from "vitest";
import {
  calculateGestationalAge,
  calculateDueDateFromLMP,
  calculateDueDateFromWeek,
} from "@/lib/gestationalAge";

describe("gestationalAge library", () => {
  it("calculates due date from LMP accurately (Naegele's rule: +280 days)", () => {
    const lmp = "2026-01-01";
    const edd = calculateDueDateFromLMP(lmp);
    // 2026 is not a leap year. Jan 1 + 280 days = Oct 8, 2026
    expect(edd).toBe("2026-10-08");
  });

  it("calculates due date from current week", () => {
    const today = new Date();
    const edd = calculateDueDateFromWeek(20);
    const eddDate = new Date(edd);
    // 20 weeks remaining = 140 days ahead
    const diffDays = Math.round((eddDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(139);
    expect(diffDays).toBeLessThanOrEqual(141);
  });

  it("calculates gestational age from expected labor date", () => {
    // 70 days from now = 10 weeks remaining = 30 weeks gestational age
    const futureDate = new Date(Date.now() + 70 * 24 * 60 * 60 * 1000);
    const eddStr = futureDate.toISOString().split("T")[0];

    const result = calculateGestationalAge({ expectedLaborDate: eddStr });
    expect(result.currentWeek).toBe(30);
    expect(result.trimester).toBe(3);
    expect(result.daysRemaining).toBeCloseTo(70, -1);
    expect(result.babySizeComparison.fruitOrObject).toBeDefined();
  });

  it("handles fallback to static pregnancyWeek if no date provided", () => {
    const result = calculateGestationalAge({ pregnancyWeek: 14 });
    expect(result.currentWeek).toBe(14);
    expect(result.trimester).toBe(2);
  });
});
