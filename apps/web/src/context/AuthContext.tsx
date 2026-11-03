"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  updateDoc,
  writeBatch,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "husband" | "wife";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  familyId: string | null;
  pregnancyWeek?: number;
  expectedLaborDate?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  familyId: string | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    partnerCode?: string,
    pregnancyWeek?: number,
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  generateInviteCode: () => Promise<string>;
  redeemInviteCode: (code: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Generate a cryptographically random 8-char alphanumeric invite code */
function makeCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  return result;
}

/**
 * Joins the family referenced by an invite code (invites/{code}).
 * The family update and invite deletion are committed atomically; Firestore
 * rules verify the invite is valid, unexpired and that only the caller is appended.
 * Returns the joined family id.
 */
async function joinFamilyWithCode(uid: string, rawCode: string): Promise<string> {
  const code = rawCode.trim().toUpperCase();
  const inviteSnap = code ? await getDoc(doc(db, "invites", code)) : null;
  if (!inviteSnap || !inviteSnap.exists()) {
    throw new Error("Invalid invite code. Please double-check and try again.");
  }
  const invite = inviteSnap.data();
  if (new Date() > (invite.expiresAt as Timestamp).toDate()) {
    throw new Error(
      "This invite code has expired. Ask your partner to generate a new one.",
    );
  }
  const familyRef = doc(db, "families", invite.familyId as string);
  // Security rules do not allow non-members to read the family, so rely on rules for capacity.
  const batch = writeBatch(db);
  batch.update(familyRef, {
    members: arrayUnion(uid),
    joinedWithCode: code,
  });
  batch.delete(inviteSnap.ref);
  await batch.commit();
  return invite.familyId as string;
}

/**
 * Ensures a user belongs to a family document. If currentFamilyId is valid, returns it.
 * Otherwise, provisions a new family where uid is the sole member and updates users/{uid}.
 */
async function ensureUserFamily(uid: string, currentFamilyId?: string | null): Promise<string> {
  if (currentFamilyId) return currentFamilyId;

  const newFamilyRef = doc(collection(db, "families"));
  await setDoc(newFamilyRef, {
    createdBy: uid,
    members: [uid],
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "users", uid), { familyId: newFamilyRef.id });
  return newFamilyRef.id;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const familyId = userProfile?.familyId ?? null;

  /** Fetch the Firestore profile for a given uid and return it */
  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        uid,
        email: data.email ?? null,
        displayName: data.displayName ?? null,
        photoURL: data.photoURL ?? null,
        role: data.role ?? "wife",
        familyId: data.familyId ?? null,
        pregnancyWeek: data.pregnancyWeek,
        expectedLaborDate: data.expectedLaborDate,
      };
    } catch (e) {
      console.error("Failed to fetch user profile:", e);
      return null;
    }
  };

  /** Public refresh so components can force a re-read after linking */
  const refreshProfile = async () => {
    if (!user) return;
    const profile = await fetchProfile(user.uid);
    setUserProfile(profile);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), data);
    setUserProfile((prev) => (prev ? { ...prev, ...data } : prev));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        let profile = await fetchProfile(currentUser.uid);
        if (profile && !profile.familyId) {
          try {
            const fid = await ensureUserFamily(currentUser.uid);
            profile = { ...profile, familyId: fid };
          } catch (e) {
            console.error("Failed to auto-provision family for user:", e);
          }
        }
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle profile fetch
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    partnerCode?: string,
    pregnancyWeek?: number,
  ) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const createdUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(createdUser, { displayName });

      let initialFamilyId: string | null = null;

      if (partnerCode) {
        try {
          initialFamilyId = await joinFamilyWithCode(
            createdUser.uid,
            partnerCode,
          );
        } catch (e) {
          console.error("Failed to link partner code during sign up:", e);
        }
      }

      // If user did not join a partner family, provision their own family
      if (!initialFamilyId) {
        const newFamilyRef = doc(collection(db, "families"));
        await setDoc(newFamilyRef, {
          createdBy: createdUser.uid,
          members: [createdUser.uid],
          createdAt: serverTimestamp(),
        });
        initialFamilyId = newFamilyRef.id;
      }

      // Create a user record in Firestore with role
      const userData: {
        uid: string;
        email: string | null;
        displayName: string;
        role: UserRole;
        familyId: string | null;
        createdAt: unknown;
        pregnancyWeek?: number;
      } = {
        uid: createdUser.uid,
        email: createdUser.email,
        displayName,
        role,
        familyId: initialFamilyId,
        createdAt: serverTimestamp(),
      };

      if (pregnancyWeek !== undefined) {
        userData.pregnancyWeek = pregnancyWeek;
        const daysRemaining = (40 - pregnancyWeek) * 7;
        const edd = new Date(Date.now() + daysRemaining * 86400000).toISOString().split("T")[0];
        (userData as Record<string, unknown>).expectedLaborDate = edd;
      }

      await setDoc(doc(db, "users", createdUser.uid), userData);

      // Update local state
      const profile: UserProfile = {
        uid: createdUser.uid,
        email: createdUser.email,
        displayName,
        photoURL: null,
        role,
        familyId: initialFamilyId,
        pregnancyWeek,
      };
      setUser({ ...createdUser, displayName } as User);
      setUserProfile(profile);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;

      // Check if profile already exists (to preserve role + familyId)
      const existing = await getDoc(doc(db, "users", loggedUser.uid));
      let initialFamilyId: string | null = null;

      if (!existing.exists() || !existing.data().familyId) {
        const newFamilyRef = doc(collection(db, "families"));
        await setDoc(newFamilyRef, {
          createdBy: loggedUser.uid,
          members: [loggedUser.uid],
          createdAt: serverTimestamp(),
        });
        initialFamilyId = newFamilyRef.id;
      }

      await setDoc(
        doc(db, "users", loggedUser.uid),
        {
          uid: loggedUser.uid,
          email: loggedUser.email,
          displayName: loggedUser.displayName || "Google Caregiver",
          photoURL: loggedUser.photoURL,
          // Only set role/familyId defaults if this is a brand-new user or missing familyId
          ...(existing.exists()
            ? initialFamilyId
              ? { familyId: initialFamilyId }
              : {}
            : { role: "wife", familyId: initialFamilyId }),
          lastLoginAt: serverTimestamp(),
        },
        { merge: true },
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Creates a families document if needed and a short-lived invite document
   * (invites/{code}). Returns the generated invite code.
   */
  const generateInviteCode = async (): Promise<string> => {
    if (!user) throw new Error("Must be signed in to generate an invite code.");

    let targetFamilyId = familyId;

    if (!targetFamilyId) {
      const newFamilyRef = doc(collection(db, "families"));
      await setDoc(newFamilyRef, {
        createdBy: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
      });
      targetFamilyId = newFamilyRef.id;

      // Link the user to this family
      await updateDoc(doc(db, "users", user.uid), { familyId: targetFamilyId });
      setUserProfile((prev) =>
        prev ? { ...prev, familyId: targetFamilyId } : prev,
      );
    }

    const code = makeCode();
    await setDoc(doc(db, "invites", code), {
      familyId: targetFamilyId,
      createdBy: user.uid,
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24 hours
      createdAt: serverTimestamp(),
    });

    return code;
  };

  /**
   * Redeems an invite code, adds the current user to the family
   * and links their profile.
   */
  const redeemInviteCode = async (code: string): Promise<void> => {
    if (!user) throw new Error("Must be signed in to redeem an invite code.");

    let targetFamilyId: string;
    try {
      targetFamilyId = await joinFamilyWithCode(user.uid, code);
    } catch (e) {
      if ((e as { code?: string }).code === "permission-denied") {
        throw new Error(
          "Unable to join: the code is invalid, expired, or the family is already full.",
        );
      }
      throw e;
    }

    await updateDoc(doc(db, "users", user.uid), { familyId: targetFamilyId });
    setUserProfile((prev) =>
      prev ? { ...prev, familyId: targetFamilyId } : prev,
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        familyId,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
        generateInviteCode,
        redeemInviteCode,
        refreshProfile,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
