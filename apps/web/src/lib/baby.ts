import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface BabyProfile {
  id: string;
  name: string;
  gender: "boy" | "girl" | "other";
  birthDate: string; // YYYY-MM-DD
  birthWeightGram?: number;
  birthLengthCm?: number;
  birthHeadCircumferenceCm?: number;
  photoUrl?: string;
  createdAt?: string;
}

export type CareLogType = "feeding" | "diaper" | "sleep" | "tummy_time" | "health";

export interface CareLog {
  id?: string;
  babyId: string;
  loggedBy: string;
  type: CareLogType;
  timestamp: string; // ISO string
  // Feeding details
  feedingMethod?: "breast" | "bottle_milk" | "bottle_formula" | "solids";
  leftBreastMinutes?: number;
  rightBreastMinutes?: number;
  lastBreastSide?: "left" | "right";
  amountMl?: number;
  // Diaper details
  diaperType?: "wet" | "dirty" | "both" | "dry";
  stoolColor?: "yellow" | "green" | "brown" | "clay" | "black";
  // Sleep & Tummy Time details
  durationMinutes?: number;
  // Health details
  temperatureC?: number;
  medicationName?: string;
  dosage?: string;
  notes?: string;
}

export interface GrowthLog {
  id?: string;
  babyId: string;
  loggedBy: string;
  date: string; // YYYY-MM-DD
  weightKg?: number;
  lengthCm?: number;
  headCircumferenceCm?: number;
  notes?: string;
  timestamp?: number;
}

export interface MilestoneCategory {
  id: string;
  title: string;
  category: "motor" | "cognitive" | "social" | "sensory";
  targetAgeMonths: number;
  description: string;
}

export interface AchievementRecord {
  id?: string;
  milestoneId: string;
  achievedDate: string; // YYYY-MM-DD
  notes?: string;
  loggedBy: string;
}

export const PREDEFINED_MILESTONES: MilestoneCategory[] = [
  // 0-2 Months
  {
    id: "smile_first",
    title: "First Social Smile",
    category: "social",
    targetAgeMonths: 2,
    description: "Smiles responsively at parents or caregivers.",
  },
  {
    id: "lifts_head_briefly",
    title: "Lifts Head During Tummy Time",
    category: "motor",
    targetAgeMonths: 2,
    description: "Briefly raises head and neck while lying on tummy.",
  },
  {
    id: "tracks_objects",
    title: "Tracks Objects Visually",
    category: "sensory",
    targetAgeMonths: 2,
    description: "Follows moving items or faces across visual field.",
  },
  {
    id: "coos_sounds",
    title: "Coos & Makes Sounds",
    category: "cognitive",
    targetAgeMonths: 2,
    description: "Produces soft vowel cooing noises.",
  },

  // 3-4 Months
  {
    id: "pushes_elbows",
    title: "Pushes Up on Chest & Elbows",
    category: "motor",
    targetAgeMonths: 4,
    description: "Pushes chest up using arms during tummy time.",
  },
  {
    id: "giggles_laughs",
    title: "First Gasp or Laugh",
    category: "social",
    targetAgeMonths: 4,
    description: "Chuckles or laughs out loud in response to play.",
  },
  {
    id: "reaches_toys",
    title: "Reaches for & Holds Rattles",
    category: "motor",
    targetAgeMonths: 4,
    description: "Grasps hanging toys or rattles intentionally.",
  },
  {
    id: "holds_head_steady",
    title: "Holds Head Steady Unsupported",
    category: "motor",
    targetAgeMonths: 4,
    description: "Keeps head erect without support when held upright.",
  },

  // 5-6 Months
  {
    id: "rolls_over",
    title: "Rolls Over (Front to Back / Back to Front)",
    category: "motor",
    targetAgeMonths: 6,
    description: "Flips independently from tummy to back or back to tummy.",
  },
  {
    id: "babbles_consonants",
    title: "Babbles Consonants (Ba-ba, Da-da)",
    category: "cognitive",
    targetAgeMonths: 6,
    description: "Strings together consonant-vowel combinations.",
  },
  {
    id: "sits_with_support",
    title: "Sits Up with Support",
    category: "motor",
    targetAgeMonths: 6,
    description: "Maintains upright sitting pose supported by hands or pillows.",
  },
  {
    id: "responds_to_name",
    title: "Responds to Own Name",
    category: "social",
    targetAgeMonths: 6,
    description: "Turns head or reacts when name is spoken.",
  },

  // 7-9 Months
  {
    id: "sits_unsupported",
    title: "Sits Unsupported",
    category: "motor",
    targetAgeMonths: 9,
    description: "Sits steadily without leaning on arms or cushions.",
  },
  {
    id: "crawls_scooters",
    title: "Begins Crawling / Scooting",
    category: "motor",
    targetAgeMonths: 9,
    description: "Moves across floor on hands and knees or tummy scooting.",
  },
  {
    id: "pincer_grasp",
    title: "Pincer Grasp (Thumb + Index)",
    category: "motor",
    targetAgeMonths: 9,
    description: "Picks up small objects using thumb and index fingertip.",
  },
  {
    id: "stranger_anxiety",
    title: "Shows Preference / Stranger Caution",
    category: "social",
    targetAgeMonths: 9,
    description: "Shows clear attachment to familiar caregivers.",
  },

  // 10-12 Months
  {
    id: "pulls_to_stand",
    title: "Pulls Self Up to Stand",
    category: "motor",
    targetAgeMonths: 12,
    description: "Uses furniture or rails to stand up vertically.",
  },
  {
    id: "cruises_furniture",
    title: "Cruises Along Furniture",
    category: "motor",
    targetAgeMonths: 12,
    description: "Steps sideways while holding onto sofa or table edges.",
  },
  {
    id: "first_word",
    title: "Says First Word",
    category: "cognitive",
    targetAgeMonths: 12,
    description: "Utters first meaningful word (e.g. Mama, Dada, Bye).",
  },
  {
    id: "first_steps",
    title: "Takes First Independent Steps",
    category: "motor",
    targetAgeMonths: 12,
    description: "Takes 1-3 unsupported steps forward.",
  },
];

// Firestore Helpers
export function getBabyCollectionPath(familyId: string | null, userId: string): string {
  const fid = familyId || userId;
  return `families/${fid}/babies`;
}

function cleanUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      result[k] = v;
    }
  }
  return result as Partial<T>;
}

export async function fetchBabyProfile(
  familyId: string | null,
  userId: string,
): Promise<BabyProfile | null> {
  try {
    const basePath = getBabyCollectionPath(familyId, userId);
    const snap = await getDocs(collection(db, basePath));
    if (!snap.empty) {
      const docData = snap.docs[0];
      return { id: docData.id, ...docData.data() } as BabyProfile;
    }
    // Fallback & automatic migration: if not in family collection, check legacy solo user collection
    if (familyId) {
      const userSnap = await getDocs(collection(db, `users/${userId}/babies`));
      if (!userSnap.empty) {
        const docData = userSnap.docs[0];
        const data = docData.data();
        const profile = { id: docData.id, ...data } as BabyProfile;
        // Auto-migrate to family collection so partner can see it
        try {
          await setDoc(doc(db, basePath, docData.id), {
            ...cleanUndefined(data),
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (migrateErr) {
          console.warn("Could not auto-migrate solo baby to family:", migrateErr);
        }
        return profile;
      }
    }
    return null;
  } catch (err) {
    console.error("fetchBabyProfile error:", err);
    return null;
  }
}

export async function saveBabyProfile(
  familyId: string | null,
  userId: string,
  profile: Omit<BabyProfile, "id">,
): Promise<BabyProfile> {
  const basePath = getBabyCollectionPath(familyId, userId);
  const snap = await getDocs(collection(db, basePath));
  const cleaned = cleanUndefined(profile);
  let refDoc;
  if (!snap.empty) {
    refDoc = doc(db, basePath, snap.docs[0].id);
    await setDoc(
      refDoc,
      { ...cleaned, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  } else {
    refDoc = doc(collection(db, basePath));
    await setDoc(refDoc, { ...cleaned, createdAt: new Date().toISOString() });
  }
  return { id: refDoc.id, ...profile };
}

export async function addCareLog(
  familyId: string | null,
  userId: string,
  babyId: string,
  log: Omit<CareLog, "id" | "babyId" | "loggedBy">,
): Promise<string> {
  const basePath = getBabyCollectionPath(familyId, userId);
  const logsRef = collection(db, `${basePath}/${babyId}/careLogs`);
  const cleaned = cleanUndefined(log);
  const docRef = await addDoc(logsRef, {
    ...cleaned,
    babyId,
    loggedBy: userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteCareLog(
  familyId: string | null,
  userId: string,
  babyId: string,
  logId: string,
): Promise<void> {
  const basePath = getBabyCollectionPath(familyId, userId);
  const logRef = doc(db, `${basePath}/${babyId}/careLogs`, logId);
  await deleteDoc(logRef);
}

export function subscribeCareLogs(
  familyId: string | null,
  userId: string,
  babyId: string,
  callback: (logs: CareLog[]) => void,
) {
  const basePath = getBabyCollectionPath(familyId, userId);
  const logsRef = collection(db, `${basePath}/${babyId}/careLogs`);
  const q = query(logsRef, orderBy("timestamp", "desc"));
  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CareLog);
    callback(logs);
  });
}

export async function addGrowthLog(
  familyId: string | null,
  userId: string,
  babyId: string,
  growth: Omit<GrowthLog, "id" | "babyId" | "loggedBy">,
): Promise<void> {
  const basePath = getBabyCollectionPath(familyId, userId);
  const growthRef = collection(db, `${basePath}/${babyId}/growthLogs`);
  const cleaned = cleanUndefined(growth);
  await addDoc(growthRef, {
    ...cleaned,
    babyId,
    loggedBy: userId,
    timestamp: Date.now(),
  });
}

export function subscribeGrowthLogs(
  familyId: string | null,
  userId: string,
  babyId: string,
  callback: (logs: GrowthLog[]) => void,
) {
  const basePath = getBabyCollectionPath(familyId, userId);
  const growthRef = collection(db, `${basePath}/${babyId}/growthLogs`);
  const q = query(growthRef, orderBy("date", "asc"));
  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GrowthLog);
    callback(logs);
  });
}

export async function toggleMilestoneAchievement(
  familyId: string | null,
  userId: string,
  babyId: string,
  milestoneId: string,
  achievedDate?: string,
): Promise<void> {
  const basePath = getBabyCollectionPath(familyId, userId);
  const milestoneRef = doc(db, `${basePath}/${babyId}/milestones`, milestoneId);
  const existing = await getDoc(milestoneRef);
  if (existing.exists()) {
    await deleteDoc(milestoneRef);
  } else {
    await setDoc(milestoneRef, {
      milestoneId,
      achievedDate: achievedDate || new Date().toISOString().split("T")[0],
      loggedBy: userId,
      timestamp: serverTimestamp(),
    });
  }
}

export function subscribeMilestones(
  familyId: string | null,
  userId: string,
  babyId: string,
  callback: (achievements: Record<string, AchievementRecord>) => void,
) {
  const basePath = getBabyCollectionPath(familyId, userId);
  const milestonesRef = collection(db, `${basePath}/${babyId}/milestones`);
  return onSnapshot(milestonesRef, (snap) => {
    const map: Record<string, AchievementRecord> = {};
    snap.docs.forEach((d) => {
      map[d.id] = { id: d.id, ...d.data() } as AchievementRecord;
    });
    callback(map);
  });
}

export interface CareSummary24h {
  totalFeeds: number;
  nursingFeeds: number;
  bottleFeeds: number;
  totalNursingMinutes: number;
  totalBottleMl: number;
  wetDiapers: number;
  dirtyDiapers: number;
  bothDiapers: number;
  totalDiapers: number;
  latestFeed?: CareLog;
  latestDiaper?: CareLog;
  latestSleep?: CareLog;
  nextBreastSide?: "left" | "right";
  timeSinceLastFeedMinutes: number | null;
  timeSinceLastDiaperMinutes: number | null;
}

export function calculateCareSummary24h(
  logs: CareLog[],
  referenceTime: Date = new Date(),
): CareSummary24h {
  const past24hMs = referenceTime.getTime() - 24 * 60 * 60 * 1000;
  const recentLogs = logs.filter((l) => {
    const t = new Date(l.timestamp).getTime();
    return t >= past24hMs && t <= referenceTime.getTime();
  });

  let totalFeeds = 0;
  let nursingFeeds = 0;
  let bottleFeeds = 0;
  let totalNursingMinutes = 0;
  let totalBottleMl = 0;
  let wetDiapers = 0;
  let dirtyDiapers = 0;
  let bothDiapers = 0;

  recentLogs.forEach((l) => {
    if (l.type === "feeding") {
      totalFeeds++;
      if (l.feedingMethod === "breast") {
        nursingFeeds++;
        totalNursingMinutes +=
          (l.leftBreastMinutes || 0) + (l.rightBreastMinutes || 0);
      } else {
        bottleFeeds++;
        totalBottleMl += l.amountMl || 0;
      }
    } else if (l.type === "diaper") {
      if (l.diaperType === "wet") {
        wetDiapers++;
      } else if (l.diaperType === "dirty") {
        dirtyDiapers++;
      } else if (l.diaperType === "both") {
        bothDiapers++;
        wetDiapers++;
        dirtyDiapers++;
      }
    }
  });

  const latestFeed = logs.find((l) => l.type === "feeding");
  const latestDiaper = logs.find((l) => l.type === "diaper");
  const latestSleep = logs.find((l) => l.type === "sleep");

  let nextBreastSide: "left" | "right" | undefined;
  if (latestFeed?.feedingMethod === "breast") {
    if (latestFeed.lastBreastSide) {
      nextBreastSide = latestFeed.lastBreastSide === "left" ? "right" : "left";
    } else if (
      (latestFeed.rightBreastMinutes || 0) > 0 &&
      (latestFeed.leftBreastMinutes || 0) === 0
    ) {
      nextBreastSide = "left";
    } else if (
      (latestFeed.leftBreastMinutes || 0) > 0 &&
      (latestFeed.rightBreastMinutes || 0) === 0
    ) {
      nextBreastSide = "right";
    }
  }

  const timeSinceLastFeedMinutes = latestFeed
    ? Math.max(
        0,
        Math.floor(
          (referenceTime.getTime() - new Date(latestFeed.timestamp).getTime()) /
            (60 * 1000),
        ),
      )
    : null;

  const timeSinceLastDiaperMinutes = latestDiaper
    ? Math.max(
        0,
        Math.floor(
          (referenceTime.getTime() - new Date(latestDiaper.timestamp).getTime()) /
            (60 * 1000),
        ),
      )
    : null;

  return {
    totalFeeds,
    nursingFeeds,
    bottleFeeds,
    totalNursingMinutes,
    totalBottleMl,
    wetDiapers,
    dirtyDiapers,
    bothDiapers,
    totalDiapers: wetDiapers + dirtyDiapers - bothDiapers,
    latestFeed,
    latestDiaper,
    latestSleep,
    nextBreastSide,
    timeSinceLastFeedMinutes,
    timeSinceLastDiaperMinutes,
  };
}

export interface DayOfLifeClinicalInfo {
  dayNumber: number;
  phaseTitle: string;
  stomachSizeName: string;
  stomachCapacityMl: string;
  targetWetDiapers: string;
  targetDirtyDiapers: string;
  stoolAppearance: string;
  clinicalTip: string;
  quickQuestions: string[];
}

export function getDayOfLifeClinicalInfo(
  birthDateStr: string,
  currentDate: Date = new Date(),
): DayOfLifeClinicalInfo {
  const birth = new Date(birthDateStr);
  // Reset times to compare calendar days
  const d0 = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate());
  const d1 = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  );
  const diffDays = Math.max(
    1,
    Math.floor((d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );

  if (diffDays === 1) {
    return {
      dayNumber: 1,
      phaseTitle: "Day 1 of Life (Birth Day)",
      stomachSizeName: "Size of a cherry / marble",
      stomachCapacityMl: "5 - 7 ml per feed (1 - 1.4 tsp)",
      targetWetDiapers: "At least 1 wet diaper",
      targetDirtyDiapers: "At least 1 meconium diaper",
      stoolAppearance: "Thick, sticky, black or dark greenish-black (meconium)",
      clinicalTip:
        "Newborns are often very sleepy during the first 12-24 hours. Colostrum is liquid gold: concentrated in antibodies and perfectly matches baby's tiny cherry-sized stomach.",
      quickQuestions: [
        "Is sticky black meconium normal on Day 1?",
        "How often should our newborn nurse on Day 1?",
        "How do we wake a sleepy newborn to feed?",
      ],
    };
  }

  if (diffDays === 2) {
    return {
      dayNumber: 2,
      phaseTitle: "Day 2 of Life (Night 2 Cluster Feeding)",
      stomachSizeName: "Size of a walnut",
      stomachCapacityMl: "10 - 15 ml per feed (2 - 3 tsp)",
      targetWetDiapers: "At least 2 wet diapers",
      targetDirtyDiapers: "At least 2 transitional diapers",
      stoolAppearance: "Dark greenish-brown transitional stool",
      clinicalTip:
        "Night 2 is famously 'cluster feeding night'. Baby wakes up from the birth slumber and wants to nurse frequently to stimulate mom's mature milk production. This is completely normal!",
      quickQuestions: [
        "Why is baby nursing every 30-45 minutes tonight (Night 2)?",
        "How can parents survive the Night 2 cluster feed?",
        "What does transitional green poop look like?",
      ],
    };
  }

  if (diffDays === 3) {
    return {
      dayNumber: 3,
      phaseTitle: "Day 3 of Life (Milk Transition)",
      stomachSizeName: "Size of an apricot",
      stomachCapacityMl: "22 - 27 ml per feed (~0.75 - 1 oz)",
      targetWetDiapers: "At least 3 wet diapers",
      targetDirtyDiapers: "At least 3 greenish-yellow diapers",
      stoolAppearance: "Brownish-green transitioning to yellow",
      clinicalTip:
        "Mother's mature milk usually begins 'coming in' between Days 3 and 5. Breasts may feel fuller and warmer. Keep baby feeding every 2 to 3 hours.",
      quickQuestions: [
        "How do I know if mature breast milk is coming in?",
        "How much formula or pumped milk per bottle on Day 3?",
        "What are early hunger cues vs late hunger crying?",
      ],
    };
  }

  if (diffDays === 4) {
    return {
      dayNumber: 4,
      phaseTitle: "Day 4 of Life (Hydration Ramp-Up)",
      stomachSizeName: "Size of a large apricot",
      stomachCapacityMl: "30 - 45 ml per feed (1 - 1.5 oz)",
      targetWetDiapers: "At least 4 - 5 wet diapers",
      targetDirtyDiapers: "At least 3 - 4 yellow/seedy stools",
      stoolAppearance: "Yellowish, starting to show seedy texture",
      clinicalTip:
        "Diapers should be getting noticeably heavier and clearer. Stools should lose all black/brown traces and turn yellow.",
      quickQuestions: [
        "What should normal yellow seedy newborn poop look like?",
        "Signs baby is getting enough milk on Day 4",
        "How to care for the umbilical cord stump?",
      ],
    };
  }

  // Day 5+
  return {
    dayNumber: diffDays,
    phaseTitle: `Day ${diffDays} of Life (First Weeks)`,
    stomachSizeName: "Size of a large hen egg",
    stomachCapacityMl: "45 - 60+ ml per feed (1.5 - 2+ oz)",
    targetWetDiapers: "6+ heavy pale/clear wet diapers daily",
    targetDirtyDiapers: "3 - 4+ mustard-yellow seedy stools daily",
    stoolAppearance: "Mustard yellow, loose with seedy curds",
    clinicalTip:
      "Babies normally lose up to 7-10% of birth weight initially and regain it by day 10-14. 6+ heavy wet diapers per 24 hours confirms healthy hydration.",
    quickQuestions: [
      "When should baby regain their birth weight?",
      "How to tell if baby has jaundice?",
      "Safe sleep ABCs for newborn at home",
    ],
  };
}
