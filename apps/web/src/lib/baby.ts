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
function getBabyCollectionPath(familyId: string | null, userId: string): string {
  if (familyId) {
    return `families/${familyId}/babies`;
  }
  return `users/${userId}/babies`;
}

export async function fetchBabyProfile(
  familyId: string | null,
  userId: string,
): Promise<BabyProfile | null> {
  const basePath = getBabyCollectionPath(familyId, userId);
  const snap = await getDocs(collection(db, basePath));
  if (snap.empty) return null;
  const docData = snap.docs[0];
  return { id: docData.id, ...docData.data() } as BabyProfile;
}

export async function saveBabyProfile(
  familyId: string | null,
  userId: string,
  profile: Omit<BabyProfile, "id">,
): Promise<BabyProfile> {
  const basePath = getBabyCollectionPath(familyId, userId);
  const snap = await getDocs(collection(db, basePath));
  let refDoc;
  if (!snap.empty) {
    refDoc = doc(db, basePath, snap.docs[0].id);
    await setDoc(refDoc, { ...profile, updatedAt: new Date().toISOString() }, { merge: true });
  } else {
    refDoc = doc(collection(db, basePath));
    await setDoc(refDoc, { ...profile, createdAt: new Date().toISOString() });
  }
  return { id: refDoc.id, ...profile };
}

export async function addCareLog(
  familyId: string | null,
  userId: string,
  babyId: string,
  log: Omit<CareLog, "id" | "babyId" | "loggedBy">,
): Promise<void> {
  const basePath = getBabyCollectionPath(familyId, userId);
  const logsRef = collection(db, `${basePath}/${babyId}/careLogs`);
  await addDoc(logsRef, {
    ...log,
    babyId,
    loggedBy: userId,
    createdAt: serverTimestamp(),
  });
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
  await addDoc(growthRef, {
    ...growth,
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
