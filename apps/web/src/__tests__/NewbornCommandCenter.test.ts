import { describe, it, expect } from "vitest";
import {
  calculateCareSummary24h,
  getDayOfLifeClinicalInfo,
  CareLog,
} from "@/lib/baby";

describe("Newborn Command Center & Clinical Helpers", () => {
  const referenceTime = new Date("2026-09-14T12:00:00.000Z");

  describe("calculateCareSummary24h", () => {
    it("should compute accurate 24-hour feeding totals and elapsed duration", () => {
      const mockLogs: CareLog[] = [
        {
          id: "1",
          babyId: "baby1",
          loggedBy: "user1",
          type: "feeding",
          feedingMethod: "breast",
          leftBreastMinutes: 15,
          rightBreastMinutes: 10,
          lastBreastSide: "right",
          timestamp: new Date("2026-09-14T10:30:00.000Z").toISOString(), // 90 min ago
        },
        {
          id: "2",
          babyId: "baby1",
          loggedBy: "user1",
          type: "feeding",
          feedingMethod: "bottle_formula",
          amountMl: 45,
          timestamp: new Date("2026-09-14T06:00:00.000Z").toISOString(), // 6 hours ago
        },
        // Old feed beyond 24h boundary
        {
          id: "3",
          babyId: "baby1",
          loggedBy: "user1",
          type: "feeding",
          feedingMethod: "bottle_formula",
          amountMl: 60,
          timestamp: new Date("2026-09-12T12:00:00.000Z").toISOString(), // 48 hours ago
        },
      ];

      const summary = calculateCareSummary24h(mockLogs, referenceTime);

      expect(summary.totalFeeds).toBe(2);
      expect(summary.nursingFeeds).toBe(1);
      expect(summary.bottleFeeds).toBe(1);
      expect(summary.totalNursingMinutes).toBe(25);
      expect(summary.totalBottleMl).toBe(45);
      expect(summary.timeSinceLastFeedMinutes).toBe(90);
      expect(summary.nextBreastSide).toBe("left"); // last was "right", so next is "left"
    });

    it("should compute accurate diaper output within 24 hours", () => {
      const mockLogs: CareLog[] = [
        {
          id: "d1",
          babyId: "baby1",
          loggedBy: "user1",
          type: "diaper",
          diaperType: "wet",
          timestamp: new Date("2026-09-14T11:15:00.000Z").toISOString(), // 45 min ago
        },
        {
          id: "d2",
          babyId: "baby1",
          loggedBy: "user1",
          type: "diaper",
          diaperType: "dirty",
          timestamp: new Date("2026-09-14T08:00:00.000Z").toISOString(), // 4 hours ago
        },
        {
          id: "d3",
          babyId: "baby1",
          loggedBy: "user1",
          type: "diaper",
          diaperType: "both",
          timestamp: new Date("2026-09-13T16:00:00.000Z").toISOString(), // 20 hours ago
        },
      ];

      const summary = calculateCareSummary24h(mockLogs, referenceTime);

      expect(summary.wetDiapers).toBe(2); // 1 wet + 1 both
      expect(summary.dirtyDiapers).toBe(2); // 1 dirty + 1 both
      expect(summary.bothDiapers).toBe(1);
      expect(summary.totalDiapers).toBe(3);
      expect(summary.timeSinceLastDiaperMinutes).toBe(45);
    });
  });

  describe("getDayOfLifeClinicalInfo", () => {
    it("should provide Day 1 of life (Birth Day) clinical metrics", () => {
      const birthDate = "2026-09-14";
      const today = new Date("2026-09-14T10:00:00.000Z");

      const info = getDayOfLifeClinicalInfo(birthDate, today);

      expect(info.dayNumber).toBe(1);
      expect(info.phaseTitle).toContain("Day 1");
      expect(info.stomachSizeName).toContain("cherry");
      expect(info.targetWetDiapers).toContain("1 wet");
      expect(info.stoolAppearance).toContain("meconium");
      expect(info.quickQuestions.length).toBeGreaterThanOrEqual(3);
    });

    it("should provide Night 2 Cluster Feeding guidance on Day 2", () => {
      const birthDate = "2026-09-13";
      const today = new Date("2026-09-14T10:00:00.000Z");

      const info = getDayOfLifeClinicalInfo(birthDate, today);

      expect(info.dayNumber).toBe(2);
      expect(info.phaseTitle).toContain("Night 2 Cluster Feeding");
      expect(info.stomachSizeName).toContain("walnut");
      expect(info.targetWetDiapers).toContain("2 wet");
    });

    it("should provide Day 5+ established feeding and hydration goals", () => {
      const birthDate = "2026-09-07";
      const today = new Date("2026-09-14T10:00:00.000Z");

      const info = getDayOfLifeClinicalInfo(birthDate, today);

      expect(info.dayNumber).toBe(8);
      expect(info.targetWetDiapers).toContain("6+ heavy");
      expect(info.targetDirtyDiapers).toContain("mustard-yellow");
    });
  });
});
