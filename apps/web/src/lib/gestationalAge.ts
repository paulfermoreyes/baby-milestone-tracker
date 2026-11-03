/**
 * Clinical Gestational Age & Pregnancy Progression Calculator
 * Based on ACOG (American College of Obstetricians and Gynecologists) & WHO guidelines.
 * Standard full-term pregnancy duration is 280 days (40 weeks) from LMP.
 */

export interface GestationalProgress {
  currentWeek: number;
  currentDay: number; // 0-6 days
  totalDaysElapsed: number;
  daysRemaining: number;
  trimester: 1 | 2 | 3;
  progressPercent: number; // 0 - 100
  dueDateString: string; // YYYY-MM-DD
  babySizeComparison: {
    fruitOrObject: string;
    lengthCm: number;
    weightGram: number;
  };
  clinicalHighlight: string;
}

const WEEKLY_DEVELOPMENT: Record<
  number,
  { fruitOrObject: string; lengthCm: number; weightGram: number; highlight: string }
> = {
  4: {
    fruitOrObject: "Poppy Seed",
    lengthCm: 0.1,
    weightGram: 0.1,
    highlight: "Blastocyst implants into uterine wall. Placenta begins producing hCG.",
  },
  6: {
    fruitOrObject: "Sweet Pea",
    lengthCm: 0.6,
    weightGram: 0.5,
    highlight: "Early neural tube closes; heart tube begins rhythmic contractions.",
  },
  8: {
    fruitOrObject: "Raspberry",
    lengthCm: 1.6,
    weightGram: 1,
    highlight: "Webbed fingers and toes forming. Major organs undergo rapid differentiation.",
  },
  10: {
    fruitOrObject: "Prune",
    lengthCm: 3.1,
    weightGram: 4,
    highlight: "Embryonic period completes; now classified clinically as a fetus.",
  },
  12: {
    fruitOrObject: "Plum",
    lengthCm: 5.4,
    weightGram: 14,
    highlight: "End of First Trimester approaching. Reflexes develop and kidneys produce amniotic fluid.",
  },
  14: {
    fruitOrObject: "Lemon",
    lengthCm: 8.7,
    weightGram: 43,
    highlight: "Welcome to Second Trimester! Sucking reflex emerges and facial expressions begin.",
  },
  16: {
    fruitOrObject: "Avocado",
    lengthCm: 11.6,
    weightGram: 100,
    highlight: "Eyes can make slow movements. Scalp hair patterning starts.",
  },
  18: {
    fruitOrObject: "Bell Pepper",
    lengthCm: 14.2,
    weightGram: 190,
    highlight: "Myelin begins coating nerves. First fetal kicks (quickening) may be felt.",
  },
  20: {
    fruitOrObject: "Banana",
    lengthCm: 25.6,
    weightGram: 300,
    highlight: "Midpoint of pregnancy! Vernix caseosa and lanugo protect baby's developing skin.",
  },
  22: {
    fruitOrObject: "Papaya",
    lengthCm: 27.8,
    weightGram: 430,
    highlight: "Taste buds developing. Inner ear bones hardened enough to hear parental voices.",
  },
  24: {
    fruitOrObject: "Ear of Corn",
    lengthCm: 30.0,
    weightGram: 600,
    highlight: "Viability milestone reached. Lungs develop alveoli and start producing surfactant.",
  },
  26: {
    fruitOrObject: "Zucchini",
    lengthCm: 35.6,
    weightGram: 760,
    highlight: "Eyes open for the first time. Brain wave activity responds to sound and light.",
  },
  28: {
    fruitOrObject: "Eggplant",
    lengthCm: 37.6,
    weightGram: 1000,
    highlight: "Welcome to Third Trimester! Rapid brain tissue expansion and sleep/wake cycles.",
  },
  30: {
    fruitOrObject: "Cabbage",
    lengthCm: 39.9,
    weightGram: 1320,
    highlight: "Bone marrow takes over red blood cell production. Regular kick sessions advised.",
  },
  32: {
    fruitOrObject: "Jicama",
    lengthCm: 42.4,
    weightGram: 1700,
    highlight: "Fingernails reach fingertips. Practicing swallowing and breathing motions.",
  },
  34: {
    fruitOrObject: "Butternut Squash",
    lengthCm: 45.0,
    weightGram: 2150,
    highlight: "Central nervous system and lungs mature substantially. Immune antibodies transfer.",
  },
  36: {
    fruitOrObject: "Honeydew Melon",
    lengthCm: 47.4,
    weightGram: 2600,
    highlight: "Early term approaching. Baby often descends into pelvis (lightening).",
  },
  38: {
    fruitOrObject: "Winter Melon",
    lengthCm: 49.8,
    weightGram: 3100,
    highlight: "Full term reached! Firm grasp reflex ready for birth.",
  },
  40: {
    fruitOrObject: "Watermelon",
    lengthCm: 51.2,
    weightGram: 3400,
    highlight: "Official Due Date! Baby is fully prepared for postpartum life.",
  },
};

/**
 * Derives a gestational development benchmark for a given week.
 */
export function getWeeklyBenchmark(week: number) {
  const boundedWeek = Math.min(42, Math.max(4, week));
  const availableWeeks = Object.keys(WEEKLY_DEVELOPMENT)
    .map(Number)
    .sort((a, b) => a - b);

  // Find closest matching milestone
  let closest = availableWeeks[0];
  for (const w of availableWeeks) {
    if (w <= boundedWeek) closest = w;
  }
  return WEEKLY_DEVELOPMENT[closest] || WEEKLY_DEVELOPMENT[20];
}

/**
 * Calculates current dynamic pregnancy progress based on EDD (expectedLaborDate)
 * or falls back to static pregnancyWeek.
 */
export function calculateGestationalAge(params: {
  expectedLaborDate?: string | null;
  pregnancyWeek?: number | null;
  referenceDate?: Date;
}): GestationalProgress {
  const today = params.referenceDate || new Date();
  today.setHours(0, 0, 0, 0);

  let dueDate: Date;

  if (params.expectedLaborDate) {
    dueDate = new Date(params.expectedLaborDate);
    dueDate.setHours(0, 0, 0, 0);
  } else if (params.pregnancyWeek && params.pregnancyWeek >= 1 && params.pregnancyWeek <= 42) {
    // Estimate due date based on entered week: 40 - week weeks from now
    const daysRemaining = (40 - params.pregnancyWeek) * 7;
    dueDate = new Date(today.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
  } else {
    // Default fallback: 20 weeks remaining
    dueDate = new Date(today.getTime() + 140 * 24 * 60 * 60 * 1000);
  }

  // Calculate days remaining and elapsed
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / msPerDay);
  const totalDaysElapsed = Math.max(0, Math.min(294, 280 - daysRemaining));

  const currentWeek = Math.floor(totalDaysElapsed / 7);
  const currentDay = totalDaysElapsed % 7;

  // Determine Trimester
  let trimester: 1 | 2 | 3 = 1;
  if (currentWeek >= 28) {
    trimester = 3;
  } else if (currentWeek >= 14) {
    trimester = 2;
  }

  const progressPercent = Math.min(100, Math.max(0, Math.round((totalDaysElapsed / 280) * 100)));
  const benchmark = getWeeklyBenchmark(currentWeek);

  const dueDateString = dueDate.toISOString().split("T")[0];

  return {
    currentWeek: Math.max(1, currentWeek),
    currentDay,
    totalDaysElapsed,
    daysRemaining: Math.max(0, daysRemaining),
    trimester,
    progressPercent,
    dueDateString,
    babySizeComparison: {
      fruitOrObject: benchmark.fruitOrObject,
      lengthCm: benchmark.lengthCm,
      weightGram: benchmark.weightGram,
    },
    clinicalHighlight: benchmark.highlight,
  };
}

/**
 * Calculates Expected Date of Delivery (EDD) from Last Menstrual Period (LMP) using Naegele's rule (+280 days).
 */
export function calculateDueDateFromLMP(lmpDateStr: string): string {
  const lmp = new Date(lmpDateStr);
  const edd = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
  return edd.toISOString().split("T")[0];
}

/**
 * Calculates Estimated Date of Delivery based on currently stated pregnancy week.
 */
export function calculateDueDateFromWeek(currentWeek: number): string {
  const remainingWeeks = Math.max(0, 40 - currentWeek);
  const targetDate = new Date(Date.now() + remainingWeeks * 7 * 24 * 60 * 60 * 1000);
  return targetDate.toISOString().split("T")[0];
}
