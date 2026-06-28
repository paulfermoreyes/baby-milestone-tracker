"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Footprints, ArrowUpRight, Plus, Check } from "@phosphor-icons/react";

interface KickSummaryCardProps {
  mode: "large" | "small";
}

export default function KickSummaryCard({ mode }: KickSummaryCardProps) {
  const { user, familyId } = useAuth();
  const [todayKicksCount, setTodayKicksCount] = useState(0);
  const [recentCountHistory, setRecentCountHistory] = useState<number[]>([4, 6, 8, 10, 7]); // default fallback
  const [justLogged, setJustLogged] = useState(false);

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };

  const todayStr = getLocalDateString();

  useEffect(() => {
    if (!user) {
      // Offline simulated preview data
      setTodayKicksCount(8);
      setRecentCountHistory([4, 6, 8, 5, 8]);
      return;
    }

    let q;
    if (familyId) {
      q = query(
        collection(db, "families", familyId, "kicks"),
        orderBy("createdAt", "desc"),
        limit(150)
      );
    } else {
      q = query(
        collection(db, "kicks"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(150)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let countToday = 0;
      const countsByDate: Record<string, number> = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.createdAt ? data.createdAt.toDate() : new Date();
        const dateStr = getLocalDateString(timestamp);
        
        countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
        if (dateStr === todayStr) {
          countToday += 1;
        }
      });

      setTodayKicksCount(countToday);

      // Generate a mini historical trend of past 5 days
      const trend: number[] = [];
      for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = getLocalDateString(d);
        trend.push(countsByDate[dayStr] || 0);
      }
      setRecentCountHistory(trend);
    });

    return () => unsubscribe();
  }, [user, familyId, todayStr]);

  const handleQuickLog = async () => {
    if (!user) {
      setTodayKicksCount((prev) => prev + 1);
      setJustLogged(true);
      setTimeout(() => setJustLogged(false), 2000);
      return;
    }

    try {
      const payload = {
        loggedBy: user.uid,
        createdAt: serverTimestamp(),
      };
      if (familyId) {
        await addDoc(collection(db, "families", familyId, "kicks"), payload);
      } else {
        await addDoc(collection(db, "kicks"), { ...payload, userId: user.uid });
      }
      setJustLogged(true);
      setTimeout(() => setJustLogged(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const target = 10;
  const progressPercent = Math.min(100, (todayKicksCount / target) * 100);

  // Large Detailed Card Render
  if (mode === "large") {
    // Generate mini sparkline coordinates
    const chartHeight = 40;
    const chartWidth = 140;
    const padding = 5;
    const maxVal = Math.max(...recentCountHistory, 10);
    const getX = (idx: number) => padding + (idx / (recentCountHistory.length - 1)) * (chartWidth - padding * 2);
    const getY = (val: number) => chartHeight - padding - (val / maxVal) * (chartHeight - padding * 2);
    
    const sparklinePoints = recentCountHistory.map((val, idx) => ({ x: getX(idx), y: getY(val) }));
    const pathD = sparklinePoints.length > 1
      ? sparklinePoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : "";

    return (
      <div className="glass-card p-6 bg-slate-800/40 border border-slate-700/30 rounded-3xl relative overflow-hidden flex flex-col justify-between h-full group hover:border-cyan-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-450 dark:text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Footprints size={16} weight="bold" className="text-cyan-400" />
            <span>Fetal Kick Counter</span>
          </span>
          <Link
            href="/trackers/kicks"
            className="w-7 h-7 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
            title="Open Full Page"
          >
            <ArrowUpRight size={14} weight="bold" />
          </Link>
        </div>

        {/* Content metrics */}
        <div className="flex items-baseline justify-between mt-2 mb-4">
          <div>
            <span className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              {todayKicksCount}
            </span>
            <span className="text-xs font-bold text-slate-400 ml-2 uppercase tracking-wide">Kicks Today</span>
          </div>
          
          {/* Sparkline chart */}
          {recentCountHistory.length > 1 && (
            <div className="flex flex-col items-end">
              <svg width={chartWidth} height={chartHeight} className="overflow-visible">
                <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
                {sparklinePoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={idx === recentCountHistory.length - 1 ? "3" : "1.5"}
                    fill={idx === recentCountHistory.length - 1 ? "#22d3ee" : "#475569"}
                  />
                ))}
              </svg>
              <span className="text-[8px] text-slate-500 font-extrabold uppercase mt-1 tracking-wider">5D Kick Trend</span>
            </div>
          )}
        </div>

        {/* Target Progress Bar */}
        <div className="space-y-1.5 mb-5 text-left">
          <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Daily Goal: 10 Kicks</span>
            <span>{Math.round((todayKicksCount / target) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-900/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quick Log Action */}
        <button
          onClick={handleQuickLog}
          className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs cursor-pointer active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 ${
            justLogged
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
              : "bg-slate-900/60 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:border-slate-700 hover:bg-slate-950"
          }`}
        >
          {justLogged ? (
            <>
              <Check size={14} weight="bold" />
              <span>Kick Registered!</span>
            </>
          ) : (
            <>
              <Plus size={14} weight="bold" />
              <span>Record a Kick</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Small Compact Row Render
  return (
    <Link
      href="/trackers/kicks"
      className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 hover:bg-slate-900/50 border border-slate-850 hover:border-slate-800/80 transition-all duration-150 group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Footprints size={18} weight="bold" className="text-cyan-400" />
        </div>
        <div className="text-left">
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest">Kicks Logged</h4>
          <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Target: 10 kicks daily</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-lg font-black text-white">{todayKicksCount}</span>
          <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Logged</span>
        </div>
        <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
          <ArrowUpRight size={12} weight="bold" />
        </div>
      </div>
    </Link>
  );
}
