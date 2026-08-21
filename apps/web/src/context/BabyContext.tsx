"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  BabyProfile,
  fetchBabyProfile,
  saveBabyProfile,
} from "@/lib/baby";

interface BabyContextType {
  baby: BabyProfile | null;
  loading: boolean;
  activeMode: "prenatal" | "newborn";
  setActiveMode: (mode: "prenatal" | "newborn") => void;
  updateBabyProfile: (profile: Omit<BabyProfile, "id">) => Promise<void>;
  refreshBaby: () => Promise<void>;
}

const BabyContext = createContext<BabyContextType | undefined>(undefined);

export function BabyProvider({ children }: { children: React.ReactNode }) {
  const { user, familyId } = useAuth();
  const [baby, setBaby] = useState<BabyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<"prenatal" | "newborn">("prenatal");

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      Promise.resolve().then(() => {
        if (!isMounted) return;
        setBaby(null);
        setLoading(false);
      });
      return;
    }

    fetchBabyProfile(familyId, user.uid)
      .then((b) => {
        if (!isMounted) return;
        setBaby(b);
        if (b) {
          setActiveMode("newborn");
        }
      })
      .catch((e) => console.error("Failed to fetch baby profile:", e))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, familyId]);

  const updateBabyProfile = async (profileData: Omit<BabyProfile, "id">) => {
    if (!user) return;
    const saved = await saveBabyProfile(familyId, user.uid, profileData);
    setBaby(saved);
    setActiveMode("newborn");
  };

  const refreshBaby = async () => {
    if (!user) return;
    const b = await fetchBabyProfile(familyId, user.uid);
    setBaby(b);
  };

  return (
    <BabyContext.Provider
      value={{
        baby,
        loading,
        activeMode,
        setActiveMode,
        updateBabyProfile,
        refreshBaby,
      }}
    >
      {children}
    </BabyContext.Provider>
  );
}

export function useBaby() {
  const context = useContext(BabyContext);
  if (!context) {
    throw new Error("useBaby must be used within a BabyProvider");
  }
  return context;
}
