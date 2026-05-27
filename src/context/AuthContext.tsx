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
  onAuthStateChanged
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
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
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  familyId: string | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  generateInviteCode: () => Promise<string>;
  redeemInviteCode: (code: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Generate a random 6-char alphanumeric invite code */
function makeCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await fetchProfile(currentUser.uid);
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
    role: UserRole
  ) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const createdUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(createdUser, { displayName });

      // Create a user record in Firestore with role
      await setDoc(doc(db, "users", createdUser.uid), {
        uid: createdUser.uid,
        email: createdUser.email,
        displayName,
        role,
        familyId: null,
        createdAt: serverTimestamp(),
      });

      // Update local state
      const profile: UserProfile = {
        uid: createdUser.uid,
        email: createdUser.email,
        displayName,
        photoURL: null,
        role,
        familyId: null,
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

      await setDoc(
        doc(db, "users", loggedUser.uid),
        {
          uid: loggedUser.uid,
          email: loggedUser.email,
          displayName: loggedUser.displayName || "Google Caregiver",
          photoURL: loggedUser.photoURL,
          // Only set role/familyId defaults if this is a brand-new user
          ...(existing.exists() ? {} : { role: "wife", familyId: null }),
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
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
   * Creates or refreshes a families document with a new invite code.
   * Returns the generated 6-char code.
   */
  const generateInviteCode = async (): Promise<string> => {
    if (!user) throw new Error("Must be signed in to generate an invite code.");

    const code = makeCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    let targetFamilyId = familyId;

    if (targetFamilyId) {
      // Update existing family document
      await updateDoc(doc(db, "families", targetFamilyId), {
        inviteCode: code,
        inviteCodeExpiresAt: Timestamp.fromDate(expiresAt),
      });
    } else {
      // Create a new family document
      const newFamilyRef = doc(collection(db, "families"));
      await setDoc(newFamilyRef, {
        createdBy: user.uid,
        members: [user.uid],
        inviteCode: code,
        inviteCodeExpiresAt: Timestamp.fromDate(expiresAt),
        createdAt: serverTimestamp(),
      });
      targetFamilyId = newFamilyRef.id;

      // Link the user to this family
      await updateDoc(doc(db, "users", user.uid), { familyId: targetFamilyId });

      // Update local profile state
      setUserProfile((prev) =>
        prev ? { ...prev, familyId: targetFamilyId } : prev
      );
    }

    return code;
  };

  /**
   * Looks up a families document by invite code, validates it,
   * adds the current user to the family, and links their profile.
   */
  const redeemInviteCode = async (code: string): Promise<void> => {
    if (!user) throw new Error("Must be signed in to redeem an invite code.");

    const trimmedCode = code.trim().toUpperCase();

    // Find the family with this invite code
    const q = query(
      collection(db, "families"),
      where("inviteCode", "==", trimmedCode)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      throw new Error("Invalid invite code. Please double-check and try again.");
    }

    const familyDoc = snap.docs[0];
    const familyData = familyDoc.data();

    // Validate expiry
    const expiresAt = (familyData.inviteCodeExpiresAt as Timestamp).toDate();
    if (new Date() > expiresAt) {
      throw new Error(
        "This invite code has expired. Ask your partner to generate a new one."
      );
    }

    // Check capacity (max 2 members)
    const members: string[] = familyData.members ?? [];
    if (members.includes(user.uid)) {
      throw new Error("You are already linked to this family.");
    }
    if (members.length >= 2) {
      throw new Error("This family already has two members linked.");
    }

    const targetFamilyId = familyDoc.id;

    // Add user to family members
    await updateDoc(doc(db, "families", targetFamilyId), {
      members: arrayUnion(user.uid),
      // Clear invite code so it can't be reused
      inviteCode: null,
    });

    // Link user profile
    await updateDoc(doc(db, "users", user.uid), { familyId: targetFamilyId });

    // Update local state
    setUserProfile((prev) =>
      prev ? { ...prev, familyId: targetFamilyId } : prev
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
