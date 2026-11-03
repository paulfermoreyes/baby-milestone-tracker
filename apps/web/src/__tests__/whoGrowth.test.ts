import { describe, it, expect } from "vitest";
import {
  calculateAgeInMonths,
  zScoreToPercentile,
  assessWeight,
  assessLength,
  assessHeadCircumference,
} from "@/lib/whoGrowth";

describe("whoGrowth library", () => {
  it("calculates age in months accurately", () => {
    // 60.875 days ~= 2 months
    const birth = "2026-01-01";
    const measure = "2026-03-02"; // ~60 days
    const age = calculateAgeInMonths(birth, measure);
    expect(age).toBeCloseTo(2.0, 0);
  });

  it("converts z-score to percentile correctly", () => {
    expect(zScoreToPercentile(0)).toBe(50.0);
    expect(zScoreToPercentile(1.96)).toBeCloseTo(97.5, 1);
    expect(zScoreToPercentile(-1.96)).toBeCloseTo(2.5, 1);
  });

  it("assesses infant weight against WHO standards", () => {
    // A 0-month boy weighing 3.3kg is at the 50th percentile
    const assessment = assessWeight("boy", 0, 3.3);
    expect(assessment.percentile).toBeCloseTo(50.0, 0);
    expect(assessment.status).toBe("typical");

    // A 0-month boy weighing 2.0kg is underweight (< 3rd percentile)
    const low = assessWeight("boy", 0, 2.0);
    expect(low.percentile).toBeLessThan(3);
    expect(low.status).toBe("low");
  });

  it("assesses infant length against WHO standards", () => {
    // A 0-month girl with length 49.1cm is at the 50th percentile
    const assessment = assessLength("girl", 0, 49.1);
    expect(assessment.percentile).toBeCloseTo(50.0, 0);
    expect(assessment.status).toBe("typical");
  });

  it("assesses infant head circumference against WHO standards", () => {
    const assessment = assessHeadCircumference("boy", 6, 43.3);
    expect(assessment.percentile).toBeCloseTo(50.0, 0);
    expect(assessment.status).toBe("typical");
  });
});
