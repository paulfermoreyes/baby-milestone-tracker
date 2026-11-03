import { describe, it, expect, vi } from "vitest";
import {
  downloadPediatricCSV,
  downloadJSON,
  ClinicalExportBundle,
} from "@/lib/exportData";

describe("exportData engine", () => {
  const mockBundle: ClinicalExportBundle = {
    exportDate: "2026-11-04T00:00:00.000Z",
    babyProfile: {
      id: "baby_1",
      name: "Leo",
      birthDate: "2026-01-01",
      gender: "boy",
      birthWeightGram: 3300,
      birthLengthCm: 50,
      birthHeadCircumferenceCm: 35,
    },
    growthLogs: [
      {
        date: "2026-03-01",
        weightKg: 5.6,
        weightPercentile: 50.0,
        lengthCm: 58.4,
        lengthPercentile: 50.0,
        notes: "2 month checkup",
      },
    ],
    careLogs: [
      {
        date: "2026-03-01",
        type: "feeding",
        detail: "120 ml",
        notes: "Formula",
      },
    ],
    bloodSugarLogs: [
      {
        date: "2025-12-01",
        value: 92,
        unit: "mg/dL",
        type: "Fasting",
      },
    ],
    symptomLogs: [
      {
        date: "2025-11-15",
        symptom: "Fatigue",
        severity: "mild",
      },
    ],
  };

  it("triggers CSV download with properly formatted headers and rows", () => {
    let capturedBlob: Blob | null = null;

    // Mock createObjectURL & revokeObjectURL
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;

    URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock-url";
    });
    URL.revokeObjectURL = vi.fn();

    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

    downloadPediatricCSV(mockBundle, "test-report");

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(capturedBlob).toBeDefined();
    expect((capturedBlob as Blob | null)?.type).toContain("text/csv");

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });

  it("triggers JSON download with valid JSON payload", async () => {
    let capturedBlob: Blob | null = null;

    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;

    URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock-url";
    });
    URL.revokeObjectURL = vi.fn();

    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

    downloadJSON(mockBundle, "test-backup");

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(capturedBlob).toBeDefined();
    expect((capturedBlob as Blob | null)?.type).toContain("application/json");

    // Read the blob text
    if (capturedBlob) {
      const text = await (capturedBlob as Blob).text();
      const parsed = JSON.parse(text);
      expect(parsed.babyProfile.name).toBe("Leo");
      expect(parsed.growthLogs.length).toBe(1);
    }

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });
});
