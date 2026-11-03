import {
  collection,
  doc,
  setDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
  Firestore,
} from "firebase/firestore";
import {
  BabyProfile,
  CareLog,
  GrowthLog,
  AchievementRecord,
} from "@shared/types";

// Helper path builder
export function getBabyCollectionPath(familyId: string | null, userId: string): string {
  const fid = familyId || userId;
  return `families/${fid}/babies`;
}

export async function fetchBabyProfile(
  db: Firestore,
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
  db: Firestore,
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
  db: Firestore,
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
  db: Firestore,
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
  db: Firestore,
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
  db: Firestore,
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
  db: Firestore,
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
  db: Firestore,
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
