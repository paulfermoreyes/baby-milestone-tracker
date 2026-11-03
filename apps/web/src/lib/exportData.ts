/**
 * Pediatric & Prenatal Health Data Export Engine
 * Generates formatted CSV and JSON reports for pediatrician appointments and medical records.
 */

import { collection, getDocs, query, orderBy, Firestore } from "firebase/firestore";
import { BabyProfile } from "@shared/types";
import { assessWeight, assessLength, assessHeadCircumference, calculateAgeInMonths } from "./whoGrowth";

export interface ClinicalExportBundle {
  exportDate: string;
  babyProfile: BabyProfile | null;
  growthLogs: Array<{
    date: string;
    weightKg?: number;
    weightPercentile?: number;
    lengthCm?: number;
    lengthPercentile?: number;
    headCircumferenceCm?: number;
    headPercentile?: number;
    notes?: string;
  }>;
  careLogs: Array<{
    date: string;
    type: string;
    detail: string;
    notes?: string;
  }>;
  bloodSugarLogs: Array<{
    date: string;
    value: number;
    unit: string;
    type?: string;
  }>;
  symptomLogs: Array<{
    date: string;
    symptom: string;
    severity?: string;
    notes?: string;
  }>;
}

export async function fetchClinicalExportData(
  db: Firestore,
  familyId: string,
  baby: BabyProfile | null,
): Promise<ClinicalExportBundle> {
  const bundle: ClinicalExportBundle = {
    exportDate: new Date().toISOString(),
    babyProfile: baby,
    growthLogs: [],
    careLogs: [],
    bloodSugarLogs: [],
    symptomLogs: [],
  };

  const gender = baby?.gender === "boy" || baby?.gender === "girl" ? baby.gender : "boy";

  // 1. Growth Logs
  if (baby?.id) {
    try {
      const gSnap = await getDocs(
        query(
          collection(db, "families", familyId, "babies", baby.id, "growth"),
          orderBy("date", "asc"),
        ),
      );
      bundle.growthLogs = gSnap.docs.map((d) => {
        const data = d.data();
        const ageMonths = baby.birthDate ? calculateAgeInMonths(baby.birthDate, data.date) : 0;
        const wAssess = data.weightKg && baby.birthDate ? assessWeight(gender, ageMonths, data.weightKg) : null;
        const lAssess = data.lengthCm && baby.birthDate ? assessLength(gender, ageMonths, data.lengthCm) : null;
        const hAssess = data.headCircumferenceCm && baby.birthDate ? assessHeadCircumference(gender, ageMonths, data.headCircumferenceCm) : null;

        return {
          date: data.date || "",
          weightKg: data.weightKg,
          weightPercentile: wAssess?.percentile,
          lengthCm: data.lengthCm,
          lengthPercentile: lAssess?.percentile,
          headCircumferenceCm: data.headCircumferenceCm,
          headPercentile: hAssess?.percentile,
          notes: data.notes || "",
        };
      });
    } catch (err) {
      console.warn("Could not fetch growth logs for export", err);
    }

    // 2. Care Logs
    try {
      const cSnap = await getDocs(
        query(
          collection(db, "families", familyId, "babies", baby.id, "care"),
          orderBy("timestamp", "desc"),
        ),
      );
      bundle.careLogs = cSnap.docs.map((d) => {
        const data = d.data();
        const ts = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
        return {
          date: ts.toISOString().split("T")[0],
          type: data.type || "care",
          detail: data.amount ? `${data.amount} ml` : data.status || "",
          notes: data.notes || "",
        };
      });
    } catch (err) {
      console.warn("Could not fetch care logs for export", err);
    }
  }

  // 3. Blood Sugar
  try {
    const bsSnap = await getDocs(collection(db, "families", familyId, "bloodsugar"));
    bundle.bloodSugarLogs = bsSnap.docs.map((d) => {
      const data = d.data();
      return {
        date: data.date || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split("T")[0] : ""),
        value: data.value || 0,
        unit: data.unit || "mg/dL",
        type: data.type || "",
      };
    });
  } catch (err) {
    console.warn("Could not fetch blood sugar logs for export", err);
  }

  // 4. Symptoms
  try {
    const symSnap = await getDocs(collection(db, "families", familyId, "symptoms"));
    bundle.symptomLogs = symSnap.docs.map((d) => {
      const data = d.data();
      const ts = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      return {
        date: ts.toISOString().split("T")[0],
        symptom: data.symptom || "",
        severity: data.severity || "",
        notes: data.notes || "",
      };
    });
  } catch (err) {
    console.warn("Could not fetch symptom logs for export", err);
  }

  return bundle;
}

/**
 * Downloads a structured JSON backup of health data.
 */
export function downloadJSON(bundle: ClinicalExportBundle, filenamePrefix = "pediatric-health-record") {
  const jsonStr = JSON.stringify(bundle, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
  triggerBrowserDownload(blob, `${filenamePrefix}-${new Date().toISOString().split("T")[0]}.json`);
}

/**
 * Downloads a formatted CSV for clinical review at pediatrician appointments.
 */
export function downloadPediatricCSV(bundle: ClinicalExportBundle, filenamePrefix = "pediatric-report") {
  const headers = ["Date", "Category", "Metric", "Value", "Unit", "Percentile_Or_Detail", "Notes"];
  const rows: string[][] = [headers];

  // Baby demographics
  if (bundle.babyProfile) {
    const b = bundle.babyProfile;
    rows.push([
      b.birthDate || "",
      "Demographics",
      "Birth Record",
      b.name,
      b.gender || "unknown",
      `Weight: ${b.birthWeightGram || 0}g, Length: ${b.birthLengthCm || 0}cm`,
      "",
    ]);
  }

  // Growth entries
  for (const g of bundle.growthLogs) {
    if (g.weightKg) {
      rows.push([g.date, "Growth", "Weight", String(g.weightKg), "kg", g.weightPercentile ? `${g.weightPercentile}%tile (WHO)` : "", g.notes || ""]);
    }
    if (g.lengthCm) {
      rows.push([g.date, "Growth", "Length", String(g.lengthCm), "cm", g.lengthPercentile ? `${g.lengthPercentile}%tile (WHO)` : "", g.notes || ""]);
    }
    if (g.headCircumferenceCm) {
      rows.push([g.date, "Growth", "Head Circumference", String(g.headCircumferenceCm), "cm", g.headPercentile ? `${g.headPercentile}%tile (WHO)` : "", g.notes || ""]);
    }
  }

  // Care entries
  for (const c of bundle.careLogs) {
    rows.push([c.date, "Care", c.type, c.detail, "", "", c.notes || ""]);
  }

  // Blood sugar
  for (const bs of bundle.bloodSugarLogs) {
    rows.push([bs.date, "Prenatal", "Blood Sugar", String(bs.value), bs.unit, bs.type || "", ""]);
  }

  // Symptoms
  for (const s of bundle.symptomLogs) {
    rows.push([s.date, "Prenatal", s.symptom, s.severity || "", "", "", s.notes || ""]);
  }

  const csvContent = rows
    .map((r) => r.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerBrowserDownload(blob, `${filenamePrefix}-${new Date().toISOString().split("T")[0]}.csv`);
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
