"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Drop, ArrowUpRight, SunHorizon, Sun, Moon } from "@phosphor-icons/react";

interface BloodSugarSummaryCardProps {
  mode: "large" | "small";
}

interface BloodSugarLog {
  id: string;
  value: number;
  slot: "fasting" | "post-lunch" | "post-dinner";
  date: string;
  timestamp: Date;
}

export default function BloodSugarSummaryCard({ mode }: BloodSugarSummaryCardProps) {
  const { user, familyId } = useAuth();
  const [logs, setLogs] = useState<BloodSugarLog[]>([]);

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };

  const todayStr = getLocalDateString();

  useEffect(() => {
    if (!user) {
      // offline preview mode
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLogs([
        { id: "1", value: 92, slot: "fasting", date: todayStr, timestamp: new Date(Date.now() - 1000 * 60 * 600) },
        { id: "2", value: 125, slot: "post-lunch", date: todayStr, timestamp: new Date(Date.now() - 1000 * 60 * 200) },
      ]);
      return;
    }

    let q;
    if (familyId) {
      q = query(
        collection(db, "families", familyId, "bloodsugar"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
    } else {
      q = query(
        collection(db, "bloodsugar"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(20)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bsLogs: BloodSugarLog[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.createdAt ? data.createdAt.toDate() : new Date();
        bsLogs.push({
          id: doc.id,
          value: Number(data.value),
          slot: data.slot,
          date: data.date,
          timestamp,
        });
      });
      setLogs(bsLogs);
    });

    return () => unsubscribe();
  }, [user, familyId, todayStr]);

  const todayLogs = logs.filter((l) => l.date === todayStr);
  const latestLog = logs[0];

  const getClassification = (value: number, slot: "fasting" | "post-lunch" | "post-dinner") => {
    if (value < 70) return { label: "Low", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
    if (slot === "fasting") {
      return value < 95
        ? { label: "Normal", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
        : { label: "Elevated", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
    } else {
      return value < 140
        ? { label: "Normal", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
        : { label: "Elevated", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
    }
  };

  const slotConfigs = {
    fasting: { label: "Fasting", icon: SunHorizon, color: "text-cyan-400 bg-cyan-500/10" },
    "post-lunch": { label: "Post-Lunch", icon: Sun, color: "text-emerald-400 bg-emerald-500/10" },
    "post-dinner": { label: "Post-Dinner", icon: Moon, color: "text-rose-400 bg-rose-500/10" }
  };

  // Large Detailed Card Render
  if (mode === "large") {
    return (
      <div className="glass-card p-6 bg-slate-800/40 border border-slate-700/30 rounded-3xl relative overflow-hidden flex flex-col justify-between h-full group hover:border-indigo-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-450 dark:text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Drop size={16} weight="bold" className="text-indigo-400" />
            <span>Blood Sugar Tracker</span>
          </span>
          <Link
            href="/trackers/blood-sugar"
            className="w-7 h-7 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
            title="Open Full Page"
          >
            <ArrowUpRight size={14} weight="bold" />
          </Link>
        </div>

        {/* Content */}
        <div className="my-2 text-left">
          {latestLog ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
                    {latestLog.value}
                  </span>
                  <span className="text-xs font-black text-slate-400 uppercase">mg/dL</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                    getClassification(latestLog.value, latestLog.slot).color
                  }`}>
                    {getClassification(latestLog.value, latestLog.slot).label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    Last logged: {latestLog.slot === "fasting" ? "Fasting" : latestLog.slot === "post-lunch" ? "Post-Lunch" : "Post-Dinner"}
                  </span>
                </div>
              </div>

              {/* Slot checklist of today */}
              <div className="pt-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Today&apos;s Schedule</span>
                <div className="grid grid-cols-3 gap-2">
                  {(["fasting", "post-lunch", "post-dinner"] as const).map((slot) => {
                    const todaySlotLog = todayLogs.find((l) => l.slot === slot);
                    const config = slotConfigs[slot];
                    const Icon = config.icon;
                    return (
                      <div
                        key={slot}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center gap-1 ${
                          todaySlotLog
                            ? "bg-slate-900/60 border-indigo-500/20 text-slate-200"
                            : "bg-slate-900/20 border-slate-850 text-slate-500"
                        }`}
                      >
                        <Icon size={14} className={todaySlotLog ? "text-indigo-400" : "text-slate-600"} />
                        <span className="text-[8px] font-bold uppercase tracking-wider block mt-0.5">{config.label}</span>
                        {todaySlotLog ? (
                          <span className="text-[10px] font-black text-indigo-400 mt-0.5">{todaySlotLog.value}</span>
                        ) : (
                          <span className="text-[8px] font-bold text-slate-600 mt-0.5">Empty</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 rounded-2xl bg-slate-900/40 border border-slate-850 text-slate-500 text-xs">
              No blood sugar logs recorded yet.
            </div>
          )}
        </div>

        {/* Quick Log Action (Link to tracker subpage) */}
        <Link
          href="/trackers/blood-sugar"
          className="w-full mt-4 py-2.5 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-350 font-extrabold text-xs cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Drop size={14} weight="bold" />
          <span>Record Sugar Level</span>
        </Link>
      </div>
    );
  }

  // Small Compact Row Render
  return (
    <Link
      href="/trackers/blood-sugar"
      className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 hover:bg-slate-900/50 border border-slate-850 hover:border-slate-800/80 transition-all duration-150 group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Drop size={18} weight="bold" className="text-indigo-400" />
        </div>
        <div className="text-left">
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest">Blood Sugar</h4>
          <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
            {latestLog ? `Last: ${latestLog.value} mg/dL (${latestLog.slot})` : "No readings logged"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {latestLog && (
          <div className="text-right">
            <span className="text-lg font-black text-white">{latestLog.value}</span>
            <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">mg/dL</span>
          </div>
        )}
        <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-450 group-hover:border-indigo-500/30 transition-colors">
          <ArrowUpRight size={12} weight="bold" />
        </div>
      </div>
    </Link>
  );
}
