"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { ListChecks, ArrowUpRight, BagSimple, Sparkle } from "@phosphor-icons/react";

interface BirthChecklistSummaryCardProps {
  mode: "large" | "small";
}

interface ChecklistItem {
  id: string;
  label: string;
  status: "pending" | "ready" | "in-bag";
}

interface Category {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export default function BirthChecklistSummaryCard({ mode }: BirthChecklistSummaryCardProps) {
  const { user, familyId } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (!user) {
      // Guest local storage fallback
      const localData = localStorage.getItem("lumina_guest_checklist");
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCategories(parsed.categories || []);
        } catch (e) {
          console.error("Failed to parse guest checklist data inside summary card", e);
        }
      }
      return;
    }

    const docRef = familyId
      ? doc(db, "families", familyId, "checklist", "data")
      : doc(db, "users", user.uid, "checklist", "data");

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCategories(data.categories || []);
        }
      },
      (err) => {
        console.error("Error reading checklist in summary card:", err);
      }
    );

    return () => unsubscribe();
  }, [user, familyId, isClient]);

  // Calculations
  const allItems = categories.flatMap((c) => c.items || []);
  const totalItems = allItems.length;
  const readyItems = allItems.filter((i) => i.status === "ready" || i.status === "in-bag").length;
  const packedItems = allItems.filter((i) => i.status === "in-bag").length;
  const progressPct = totalItems > 0 ? Math.round((readyItems / totalItems) * 100) : 0;

  // Large Detailed Card Render
  if (mode === "large") {
    return (
      <div className="glass-card p-6 bg-slate-800/40 border border-slate-700/30 rounded-3xl relative overflow-hidden flex flex-col justify-between h-full group hover:border-emerald-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-450 dark:text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Sparkle size={16} weight="fill" className="text-emerald-400" />
            <span>Birth Checklist</span>
          </span>
          <Link
            href="/trackers/birth-preparation-checklist"
            className="w-7 h-7 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            title="Open Checklist"
          >
            <ArrowUpRight size={14} weight="bold" />
          </Link>
        </div>

        {/* Card Main Info */}
        <div className="my-2 text-left space-y-1">
          <div className="flex items-baseline justify-between mb-1">
            <h4 className="text-lg font-black text-white truncate max-w-[180px]">
              Ready & Packed
            </h4>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
              {progressPct}% Done
            </span>
          </div>
          <p className="text-xs text-slate-400">{readyItems} of {totalItems} items prepared</p>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-900/70 mt-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-850/40 mt-4">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Categories</span>
              <span className="text-lg font-black text-white">{categories.length}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Sections active
              </span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Hospital Bag</span>
              <span className="text-lg font-black text-white flex items-center gap-1">
                <BagSimple size={14} weight="fill" className="text-violet-400" />
                {packedItems}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Items packed</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href="/trackers/birth-preparation-checklist"
          className="w-full mt-5 py-2.5 px-4 rounded-xl font-extrabold text-xs text-center border border-slate-800 bg-slate-900/60 text-emerald-450 hover:text-emerald-350 hover:border-slate-700 hover:bg-slate-950 transition-all duration-150 flex items-center justify-center gap-1.5"
        >
          <span>Organize Checklist</span>
        </Link>
      </div>
    );
  }

  // Small Compact Row Render
  return (
    <Link
      href="/trackers/birth-preparation-checklist"
      className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 hover:bg-slate-900/50 border border-slate-850 hover:border-slate-800/80 transition-all duration-150 group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <ListChecks size={18} weight="bold" className="text-emerald-400" />
        </div>
        <div className="text-left">
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest">Birth Checklist</h4>
          <span className="text-[10px] text-slate-500 font-bold block mt-0.5 truncate max-w-[130px] sm:max-w-none">
            {readyItems}/{totalItems} items ready • {packedItems} packed
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-lg font-black text-white">{progressPct}%</span>
          <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Ready</span>
        </div>
        <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-450 group-hover:border-emerald-500/30 transition-colors">
          <ArrowUpRight size={12} weight="bold" />
        </div>
      </div>
    </Link>
  );
}
