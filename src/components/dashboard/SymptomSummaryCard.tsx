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
import { ThermometerHot, ArrowUpRight } from "@phosphor-icons/react";

interface SymptomSummaryCardProps {
  mode: "large" | "small";
}

interface SymptomLog {
  id: string;
  symptoms: string[];
  severity: "mild" | "moderate" | "severe";
  notes?: string;
  date: string;
  timestamp: Date;
}

export default function SymptomSummaryCard({ mode }: SymptomSummaryCardProps) {
  const { user, familyId } = useAuth();
  const [todayLogs, setTodayLogs] = useState<SymptomLog[]>([]);

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };

  const todayStr = getLocalDateString();

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTodayLogs([
        { id: "1", symptoms: ["Back Pain", "Mild Fatigue"], severity: "mild", date: todayStr, timestamp: new Date() },
        { id: "2", symptoms: ["Nausea"], severity: "moderate", date: todayStr, timestamp: new Date() }
      ]);
      return;
    }

    let q;
    if (familyId) {
      q = query(
        collection(db, "families", familyId, "symptoms"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
    } else {
      q = query(
        collection(db, "symptoms"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(20)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsList: SymptomLog[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.createdAt ? data.createdAt.toDate() : new Date();
        if (data.date === todayStr) {
          logsList.push({
            id: doc.id,
            symptoms: data.symptoms || [],
            severity: data.severity || "mild",
            notes: data.notes || "",
            date: data.date,
            timestamp,
          });
        }
      });
      setTodayLogs(logsList);
    });

    return () => unsubscribe();
  }, [user, familyId, todayStr]);

  // Extract all symptoms logged today
  const allLoggedSymptoms = todayLogs.reduce<string[]>((acc, log) => {
    log.symptoms.forEach((s) => {
      if (!acc.includes(s)) acc.push(s);
    });
    return acc;
  }, []);

  const getSeverityBadgeClass = (severity: "mild" | "moderate" | "severe") => {
    switch (severity) {
      case "severe":
        return "bg-rose-500/15 border-rose-500/30 text-rose-450";
      case "moderate":
        return "bg-amber-500/15 border-amber-500/30 text-amber-500";
      default:
        return "bg-teal-500/15 border-teal-500/30 text-teal-450";
    }
  };

  const getSeverityLabel = (severity: "mild" | "moderate" | "severe") => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  // Large Detailed Card Render
  if (mode === "large") {
    return (
      <div className="glass-card p-6 bg-slate-800/40 border border-slate-700/30 rounded-3xl relative overflow-hidden flex flex-col justify-between h-full group hover:border-teal-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-450 dark:text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <ThermometerHot size={16} weight="bold" className="text-teal-400" />
            <span>Symptom Diary</span>
          </span>
          <Link
            href="/trackers/symptoms"
            className="w-7 h-7 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
            title="Open Full Page"
          >
            <ArrowUpRight size={14} weight="bold" />
          </Link>
        </div>

        {/* Symptoms List Content */}
        <div className="my-2 text-left flex-1 flex flex-col justify-center">
          {todayLogs.length > 0 ? (
            <div className="space-y-3.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  {allLoggedSymptoms.length}
                </span>
                <span className="text-xs font-black text-slate-400 uppercase">Symptoms Today</span>
              </div>

              {/* Symptom badges list */}
              <div className="flex flex-wrap gap-2 pt-1 max-h-[85px] overflow-y-auto scrollbar-thin">
                {todayLogs.map((log) => 
                  log.symptoms.map((symptom) => (
                    <span
                      key={`${log.id}-${symptom}`}
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getSeverityBadgeClass(log.severity)}`}
                    >
                      {symptom} <span className="text-[8px] font-bold opacity-60 ml-1.5">({getSeverityLabel(log.severity)})</span>
                    </span>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 rounded-2xl bg-slate-900/40 border border-slate-850 text-slate-500 text-xs">
              Feeling good. No symptoms logged today.
            </div>
          )}
        </div>

        {/* Quick Log Action */}
        <Link
          href="/trackers/symptoms"
          className="w-full mt-4 py-2.5 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-teal-400 hover:text-teal-350 font-extrabold text-xs cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <ThermometerHot size={14} weight="bold" />
          <span>Update Symptoms Log</span>
        </Link>
      </div>
    );
  }

  // Small Compact Row Render
  return (
    <Link
      href="/trackers/symptoms"
      className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 hover:bg-slate-900/50 border border-slate-850 hover:border-slate-800/80 transition-all duration-150 group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <ThermometerHot size={18} weight="bold" className="text-teal-400" />
        </div>
        <div className="text-left">
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest">Symptom Diary</h4>
          <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
            {allLoggedSymptoms.length > 0 ? `${allLoggedSymptoms.slice(0, 2).join(", ")}${allLoggedSymptoms.length > 2 ? "..." : ""}` : "No symptoms logged today"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-lg font-black text-white">{allLoggedSymptoms.length}</span>
          <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Logged</span>
        </div>
        <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-teal-450 group-hover:border-teal-500/30 transition-colors">
          <ArrowUpRight size={12} weight="bold" />
        </div>
      </div>
    </Link>
  );
}
