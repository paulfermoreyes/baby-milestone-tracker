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
import { Timer, ArrowUpRight } from "@phosphor-icons/react";

interface ContractionSummaryCardProps {
  mode: "large" | "small";
}

interface ContractionRecord {
  id: string;
  duration: number; // seconds
  interval?: number; // seconds
  createdAt: Date;
}

export default function ContractionSummaryCard({ mode }: ContractionSummaryCardProps) {
  const { user, familyId } = useAuth();
  const [recentContractions, setRecentContractions] = useState<ContractionRecord[]>([]);

  useEffect(() => {
    if (!user) {
      // simulated preview
      setRecentContractions([
        { id: "1", duration: 45, interval: 300, createdAt: new Date(Date.now() - 1000 * 60 * 12) },
        { id: "2", duration: 55, interval: 280, createdAt: new Date(Date.now() - 1000 * 60 * 17) },
      ]);
      return;
    }

    let q;
    if (familyId) {
      q = query(
        collection(db, "families", familyId, "contractions"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
    } else {
      q = query(
        collection(db, "contractions"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: ContractionRecord[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
        records.push({
          id: doc.id,
          duration: data.duration,
          interval: data.interval || undefined,
          createdAt,
        });
      });
      setRecentContractions(records);
    });

    return () => unsubscribe();
  }, [user, familyId]);

  const lastContraction = recentContractions[0];

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatTimeAgo = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000); // seconds
    if (diff < 60) return "Just now";
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // Large Detailed Card Render
  if (mode === "large") {
    return (
      <div className="glass-card p-6 bg-slate-800/40 border border-slate-700/30 rounded-3xl relative overflow-hidden flex flex-col justify-between h-full group hover:border-rose-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-450 dark:text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Timer size={16} weight="bold" className="text-rose-450 animate-pulse" />
            <span>Contraction Vitals</span>
          </span>
          <Link
            href="/trackers/contractions"
            className="w-7 h-7 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-450 transition-colors cursor-pointer"
            title="Open Full Page"
          >
            <ArrowUpRight size={14} weight="bold" />
          </Link>
        </div>

        {/* Content */}
        <div className="my-2">
          {lastContraction ? (
            <div className="space-y-4">
              <div className="flex items-baseline justify-between text-left">
                <div>
                  <span className="text-4xl font-black bg-gradient-to-r from-rose-450 to-amber-500 bg-clip-text text-transparent">
                    {formatTimeAgo(lastContraction.createdAt)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 block uppercase mt-0.5 tracking-wider">Last Contraction Logged</span>
                </div>
              </div>

              {/* Contraction Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-850">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Duration</span>
                  <p className="text-lg font-black text-white mt-0.5">
                    {formatDuration(lastContraction.duration)}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-850">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Interval</span>
                  <p className="text-lg font-black text-white mt-0.5">
                    {lastContraction.interval ? formatDuration(lastContraction.interval) : "First entry"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 rounded-2xl bg-slate-900/40 border border-slate-850 text-slate-500 text-xs leading-relaxed">
              No contractions logged. Get ready before labor starts.
            </div>
          )}
        </div>

        {/* Quick Action button redirects & triggers timer */}
        <Link
          href="/trackers/contractions?start=true"
          className="w-full mt-4 py-2.5 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-rose-400 hover:text-rose-350 font-extrabold text-xs cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Timer size={14} weight="bold" />
          <span>Start Active Timer</span>
        </Link>
      </div>
    );
  }

  // Small Compact Row Render
  return (
    <Link
      href="/trackers/contractions"
      className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 hover:bg-slate-900/50 border border-slate-850 hover:border-slate-800/80 transition-all duration-150 group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Timer size={18} weight="bold" className="text-rose-400 animate-pulse" />
        </div>
        <div className="text-left">
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest">Contraction Timer</h4>
          <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
            {lastContraction ? `Last entry: ${formatTimeAgo(lastContraction.createdAt)}` : "No sessions logged"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {lastContraction && (
          <div className="text-right">
            <span className="text-base font-black text-white">
              {formatDuration(lastContraction.duration)}
            </span>
            <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Dur</span>
          </div>
        )}
        <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-rose-450 group-hover:border-rose-500/30 transition-colors">
          <ArrowUpRight size={12} weight="bold" />
        </div>
      </div>
    </Link>
  );
}
