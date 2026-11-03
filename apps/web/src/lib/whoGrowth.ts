/**
 * WHO Child Growth Standards Calculation Library
 * Based on the World Health Organization (WHO) Multicentre Growth Reference Study (MGRS).
 * Standards for infants and children aged 0 to 24 months.
 */

export interface WHOReferencePoint {
  month: number;
  // LMS Parameters or Percentile Medians & Standard Deviations
  mWeight: number; // Median weight in kg
  sdWeight: number; // Standard Deviation weight
  mLength: number; // Median length in cm
  sdLength: number; // Standard Deviation length
  mHead: number; // Median head circumference in cm
  sdHead: number; // Standard Deviation head circumference
}

// WHO Growth Reference for Boys (0 - 24 months)
const WHO_BOYS: WHOReferencePoint[] = [
  { month: 0, mWeight: 3.3, sdWeight: 0.48, mLength: 49.9, sdLength: 1.89, mHead: 34.5, sdHead: 1.25 },
  { month: 1, mWeight: 4.5, sdWeight: 0.58, mLength: 54.7, sdLength: 1.95, mHead: 36.9, sdHead: 1.28 },
  { month: 2, mWeight: 5.6, sdWeight: 0.66, mLength: 58.4, sdLength: 2.02, mHead: 38.8, sdHead: 1.30 },
  { month: 3, mWeight: 6.4, sdWeight: 0.73, mLength: 61.4, sdLength: 2.10, mHead: 40.3, sdHead: 1.33 },
  { month: 4, mWeight: 7.0, sdWeight: 0.79, mLength: 63.9, sdLength: 2.17, mHead: 41.5, sdHead: 1.35 },
  { month: 5, mWeight: 7.5, sdWeight: 0.84, mLength: 65.9, sdLength: 2.24, mHead: 42.5, sdHead: 1.37 },
  { month: 6, mWeight: 7.9, sdWeight: 0.89, mLength: 67.6, sdLength: 2.30, mHead: 43.3, sdHead: 1.39 },
  { month: 7, mWeight: 8.3, sdWeight: 0.93, mLength: 69.2, sdLength: 2.36, mHead: 44.0, sdHead: 1.40 },
  { month: 8, mWeight: 8.6, sdWeight: 0.97, mLength: 70.6, sdLength: 2.42, mHead: 44.5, sdHead: 1.41 },
  { month: 9, mWeight: 8.9, sdWeight: 1.01, mLength: 72.0, sdLength: 2.48, mHead: 45.0, sdHead: 1.42 },
  { month: 10, mWeight: 9.2, sdWeight: 1.04, mLength: 73.3, sdLength: 2.53, mHead: 45.4, sdHead: 1.43 },
  { month: 11, mWeight: 9.4, sdWeight: 1.07, mLength: 74.5, sdLength: 2.58, mHead: 45.8, sdHead: 1.44 },
  { month: 12, mWeight: 9.6, sdWeight: 1.10, mLength: 75.7, sdLength: 2.63, mHead: 46.1, sdHead: 1.45 },
  { month: 15, mWeight: 10.3, sdWeight: 1.18, mLength: 79.1, sdLength: 2.76, mHead: 46.8, sdHead: 1.47 },
  { month: 18, mWeight: 10.9, sdWeight: 1.25, mLength: 82.3, sdLength: 2.88, mHead: 47.4, sdHead: 1.49 },
  { month: 21, mWeight: 11.5, sdWeight: 1.33, mLength: 85.1, sdLength: 3.00, mHead: 47.9, sdHead: 1.51 },
  { month: 24, mWeight: 12.2, sdWeight: 1.41, mLength: 87.8, sdLength: 3.12, mHead: 48.3, sdHead: 1.53 },
];

// WHO Growth Reference for Girls (0 - 24 months)
const WHO_GIRLS: WHOReferencePoint[] = [
  { month: 0, mWeight: 3.2, sdWeight: 0.45, mLength: 49.1, sdLength: 1.87, mHead: 33.9, sdHead: 1.22 },
  { month: 1, mWeight: 4.2, sdWeight: 0.55, mLength: 53.7, sdLength: 1.93, mHead: 36.2, sdHead: 1.25 },
  { month: 2, mWeight: 5.1, sdWeight: 0.63, mLength: 57.1, sdLength: 2.00, mHead: 37.9, sdHead: 1.27 },
  { month: 3, mWeight: 5.8, sdWeight: 0.70, mLength: 59.8, sdLength: 2.07, mHead: 39.3, sdHead: 1.30 },
  { month: 4, mWeight: 6.4, sdWeight: 0.76, mLength: 62.1, sdLength: 2.14, mHead: 40.5, sdHead: 1.32 },
  { month: 5, mWeight: 6.9, sdWeight: 0.81, mLength: 64.0, sdLength: 2.21, mHead: 41.5, sdHead: 1.34 },
  { month: 6, mWeight: 7.3, sdWeight: 0.86, mLength: 65.7, sdLength: 2.27, mHead: 42.2, sdHead: 1.36 },
  { month: 7, mWeight: 7.6, sdWeight: 0.90, mLength: 67.3, sdLength: 2.33, mHead: 42.8, sdHead: 1.37 },
  { month: 8, mWeight: 7.9, sdWeight: 0.94, mLength: 68.7, sdLength: 2.39, mHead: 43.4, sdHead: 1.38 },
  { month: 9, mWeight: 8.2, sdWeight: 0.98, mLength: 70.1, sdLength: 2.45, mHead: 43.8, sdHead: 1.39 },
  { month: 10, mWeight: 8.5, sdWeight: 1.01, mLength: 71.5, sdLength: 2.50, mHead: 44.2, sdHead: 1.40 },
  { month: 11, mWeight: 8.7, sdWeight: 1.04, mLength: 72.8, sdLength: 2.55, mHead: 44.6, sdHead: 1.41 },
  { month: 12, mWeight: 8.9, sdWeight: 1.07, mLength: 74.0, sdLength: 2.60, mHead: 44.9, sdHead: 1.42 },
  { month: 15, mWeight: 9.6, sdWeight: 1.15, mLength: 77.5, sdLength: 2.73, mHead: 45.6, sdHead: 1.44 },
  { month: 18, mWeight: 10.2, sdWeight: 1.22, mLength: 80.7, sdLength: 2.85, mHead: 46.2, sdHead: 1.46 },
  { month: 21, mWeight: 10.9, sdWeight: 1.30, mLength: 83.7, sdLength: 2.97, mHead: 46.7, sdHead: 1.48 },
  { month: 24, mWeight: 11.5, sdWeight: 1.38, mLength: 86.4, sdLength: 3.09, mHead: 47.2, sdHead: 1.50 },
];

/**
 * Standard Normal Cumulative Distribution Function (CDF) approximation (Abramowitz & Stegun).
 * Converts a Z-Score to a percentile (0.0 to 100.0).
 */
export function zScoreToPercentile(z: number): number {
  if (z < -4) return 0.1;
  if (z > 4) return 99.9;

  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c2 = 0.3989422804; // 1 / sqrt(2 * pi)

  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z);
  const t = 1.0 / (1.0 + p * absZ);
  const poly = ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t;
  const pdf = c2 * Math.exp(-0.5 * absZ * absZ);
  const cdf = 1.0 - pdf * poly;

  const result = sign === 1 ? cdf : 1.0 - cdf;
  return Math.round(result * 1000) / 10;
}

/**
 * Linearly interpolates WHO reference points for an exact age in months.
 */
function interpolateWHO(gender: "boy" | "girl" | "other", ageMonths: number): WHOReferencePoint {
  const table = gender === "girl" ? WHO_GIRLS : WHO_BOYS;
  const boundedAge = Math.max(0, Math.min(24, ageMonths));

  if (boundedAge <= 0) return table[0];
  if (boundedAge >= 24) return table[table.length - 1];

  let lower = table[0];
  let upper = table[table.length - 1];

  for (let i = 0; i < table.length - 1; i++) {
    if (table[i].month <= boundedAge && table[i + 1].month >= boundedAge) {
      lower = table[i];
      upper = table[i + 1];
      break;
    }
  }

  const fraction = (boundedAge - lower.month) / (upper.month - lower.month || 1);

  return {
    month: boundedAge,
    mWeight: lower.mWeight + fraction * (upper.mWeight - lower.mWeight),
    sdWeight: lower.sdWeight + fraction * (upper.sdWeight - lower.sdWeight),
    mLength: lower.mLength + fraction * (upper.mLength - lower.mLength),
    sdLength: lower.sdLength + fraction * (upper.sdLength - lower.sdLength),
    mHead: lower.mHead + fraction * (upper.mHead - lower.mHead),
    sdHead: lower.sdHead + fraction * (upper.sdHead - lower.sdHead),
  };
}

/**
 * Calculates exact age in decimal months between birth date and measurement date.
 */
export function calculateAgeInMonths(birthDateStr: string, measureDateStr?: string): number {
  const birth = new Date(birthDateStr);
  const measure = measureDateStr ? new Date(measureDateStr) : new Date();

  const diffTime = measure.getTime() - birth.getTime();
  const diffDays = Math.max(0, diffTime / (1000 * 60 * 60 * 24));
  return Math.round((diffDays / 30.4375) * 10) / 10; // 30.4375 avg days per month
}

export interface MetricAssessment {
  value: number;
  unit: string;
  percentile: number; // e.g. 50.0
  zScore: number;
  status: "low" | "typical" | "high";
  statusText: string;
}

/**
 * Assesses an infant's weight against WHO growth percentiles.
 */
export function assessWeight(
  gender: "boy" | "girl" | "other",
  ageMonths: number,
  weightKg: number,
): MetricAssessment {
  const ref = interpolateWHO(gender, ageMonths);
  const zScore = Math.round(((weightKg - ref.mWeight) / ref.sdWeight) * 100) / 100;
  const percentile = zScoreToPercentile(zScore);

  let status: "low" | "typical" | "high" = "typical";
  let statusText = "Healthy & Typical Weight Range";

  if (percentile < 3) {
    status = "low";
    statusText = "Below 3rd Percentile (Underweight)";
  } else if (percentile < 15) {
    status = "typical";
    statusText = "Lean / 3rd-15th Percentile";
  } else if (percentile > 97) {
    status = "high";
    statusText = "Above 97th Percentile";
  } else if (percentile > 85) {
    status = "typical";
    statusText = "Robust / 85th-97th Percentile";
  }

  return {
    value: weightKg,
    unit: "kg",
    percentile,
    zScore,
    status,
    statusText,
  };
}

/**
 * Assesses an infant's length against WHO growth percentiles.
 */
export function assessLength(
  gender: "boy" | "girl" | "other",
  ageMonths: number,
  lengthCm: number,
): MetricAssessment {
  const ref = interpolateWHO(gender, ageMonths);
  const zScore = Math.round(((lengthCm - ref.mLength) / ref.sdLength) * 100) / 100;
  const percentile = zScoreToPercentile(zScore);

  let status: "low" | "typical" | "high" = "typical";
  let statusText = "Typical Stature";

  if (percentile < 3) {
    status = "low";
    statusText = "Below 3rd Percentile";
  } else if (percentile > 97) {
    status = "high";
    statusText = "Above 97th Percentile";
  }

  return {
    value: lengthCm,
    unit: "cm",
    percentile,
    zScore,
    status,
    statusText,
  };
}

/**
 * Assesses an infant's head circumference against WHO growth percentiles.
 */
export function assessHeadCircumference(
  gender: "boy" | "girl" | "other",
  ageMonths: number,
  headCm: number,
): MetricAssessment {
  const ref = interpolateWHO(gender, ageMonths);
  const zScore = Math.round(((headCm - ref.mHead) / ref.sdHead) * 100) / 100;
  const percentile = zScoreToPercentile(zScore);

  let status: "low" | "typical" | "high" = "typical";
  let statusText = "Normal Head Circumference";

  if (percentile < 3) {
    status = "low";
    statusText = "Below 3rd Percentile (Microcephaly screen)";
  } else if (percentile > 97) {
    status = "high";
    statusText = "Above 97th Percentile (Macrocephaly screen)";
  }

  return {
    value: headCm,
    unit: "cm",
    percentile,
    zScore,
    status,
    statusText,
  };
}
