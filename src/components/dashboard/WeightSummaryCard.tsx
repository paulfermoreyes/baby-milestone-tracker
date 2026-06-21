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
import { Scales, ArrowUpRight } from "@phosphor-icons/react";

interface WeightSummaryCardProps {
  mode: "large" | "small";
}

interface WeightLog {
  id: string;
  weight: number; // lbs
  date: string;
  timestamp: Date;
}

export default function WeightSummaryCard({ mode }: WeightSummaryCardProps) {
  const { user, familyId } = useAuth();
  const [logs, setLogs] = useState<WeightLog[]>([]);

  useEffect(() => {
    if (!user) {
      setLogs([
        { id: "1", weight: 142.5, date: "2026-05-01", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
        { id: "2", weight: 144.2, date: "2026-05-15", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15) },
        { id: "3", weight: 145.8, date: "2026-05-25", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) },
        { id: "4", weight: 146.5, date: "2026-06-02", timestamp: new Date() }
      ]);
      return;
    }

    let q;
    if (familyId) {
      q = query(
        collection(db, "families", familyId, "weight"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
    } else {
      q = query(
        collection(db, "weight"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wLogs: WeightLog[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.createdAt ? data.createdAt.toDate() : new Date();
        wLogs.push({
          id: doc.id,
          weight: Number(data.value || data.weight),
          date: data.date,
          timestamp,
        });
      });
      // Sort in chronological order (oldest to newest)
      wLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setLogs(wLogs);
    });

    return () => unsubscribe();
  }, [user, familyId]);

  const latestLog = logs[logs.length - 1];
  const firstLog = logs[0];
  const netGain = latestLog && firstLog ? latestLog.weight - firstLog.weight : 0;

  // Large Detailed Card Render
  if (mode === "large") {
    // Generate mini sparkline coordinates
    const chartHeight = 40;
    const chartWidth = 140;
    const padding = 5;
    const weights = logs.map((l) => l.weight);
    const minW = Math.min(...weights, 100) - 2;
    const maxW = Math.max(...weights, 150) + 2;
    const getX = (idx: number) => padding + (idx / (logs.length - 1)) * (chartWidth - padding * 2);
    const getY = (val: number) => chartHeight - padding - ((val - minW) / (maxW - minW || 1)) * (chartHeight - padding * 2);

    const sparklinePoints = logs.map((val, idx) => ({ x: getX(idx), y: getY(val.weight) }));
    const pathD = sparklinePoints.length > 1
      ? sparklinePoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : "";

    return (
      <div className="glass-card p-6 bg-slate-800/40 border border-slate-700/30 rounded-3xl relative overflow-hidden flex flex-col justify-between h-full group hover:border-amber-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-450 dark:text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Scales size={16} weight="bold" className="text-amber-400" />
            <span>Weight Tracker</span>
          </span>
          <Link
            href="/trackers/weight"
            className="w-7 h-7 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-amber-450 transition-colors cursor-pointer"
            title="Open Full Page"
          >
            <ArrowUpRight size={14} weight="bold" />
          </Link>
        </div>

        {/* Content */}
        <div className="my-2 text-left flex items-baseline justify-between">
          {latestLog ? (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                  {latestLog.weight.toFixed(1)}
                </span>
                <span className="text-xs font-black text-slate-400 uppercase">lbs</span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold block mt-1.5 uppercase tracking-wide">
                {netGain >= 0 ? `+${netGain.toFixed(1)} lbs` : `${netGain.toFixed(1)} lbs`} since baseline
              </span>
            </div>
          ) : (
            <div className="text-center py-6 rounded-2xl bg-slate-900/40 border border-slate-850 text-slate-500 text-xs">
              No weight logs recorded yet.
            </div>
          )}

          {/* Sparkline chart */}
          {logs.length > 1 && (
            <div className="flex flex-col items-end">
              <svg width={chartWidth} height={chartHeight} className="overflow-visible">
                <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                {sparklinePoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={idx === logs.length - 1 ? "3" : "1.5"}
                    fill={idx === logs.length - 1 ? "#f59e0b" : "#475569"}
                  />
                ))}
              </svg>
              <span className="text-[8px] text-slate-500 font-extrabold uppercase mt-1 tracking-wider">Weight Trend</span>
            </div>
          )}
        </div>

        {/* Quick Log Action */}
        <Link
          href="/trackers/weight"
          className="w-full mt-4 py-2.5 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-amber-400 hover:text-amber-350 font-extrabold text-xs cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Scales size={14} weight="bold" />
          <span>Log Weight Entry</span>
        </Link>
      </div>
    );
  }

  // Small Compact Row Render
  return (
    <Link
      href="/trackers/weight"
      className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 hover:bg-slate-900/50 border border-slate-850 hover:border-slate-800/80 transition-all duration-150 group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Scales size={18} weight="bold" className="text-amber-400" />
        </div>
        <div className="text-left">
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest">Weight Tracker</h4>
          <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
            {latestLog ? `Gain: ${netGain >= 0 ? `+${netGain.toFixed(1)} lbs` : `${netGain.toFixed(1)} lbs`}` : "No entries logged"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {latestLog && (
          <div className="text-right">
            <span className="text-lg font-black text-white">{latestLog.weight.toFixed(1)}</span>
            <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">lbs</span>
          </div>
        )}
        <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-amber-450 group-hover:border-amber-500/30 transition-colors">
          <ArrowUpRight size={12} weight="bold" />
        </div>
      </div>
    </Link>
  );
}
