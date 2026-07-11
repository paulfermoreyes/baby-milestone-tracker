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
import { Drop, ArrowUpRight, Plus, Check } from "@phosphor-icons/react";

interface MilkSummaryCardProps {
  mode: "large" | "small";
}

export default function MilkSummaryCard({ mode }: MilkSummaryCardProps) {
  const { user, familyId } = useAuth();
  const [todayTotal, setTodayTotal] = useState(0);
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTodayTotal(12.5);
      return;
    }

    let q;
    if (familyId) {
      q = query(
        collection(db, "families", familyId, "milk"),
        orderBy("createdAt", "desc"),
        limit(100)
      );
    } else {
      q = query(
        collection(db, "milk"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let sum = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.date === todayStr) {
          sum += Number(data.amount || 0);
        }
      });
      setTodayTotal(sum);
    });

    return () => unsubscribe();
  }, [user, familyId, todayStr]);

  const handleQuickLog = async () => {
    if (!user) {
      setTodayTotal((prev) => prev + 1);
      setJustLogged(true);
      setTimeout(() => setJustLogged(false), 2000);
      return;
    }

    try {
      const payload = {
        amount: 1, // log 1 oz quick log
        date: todayStr,
        loggedBy: user.uid,
        createdAt: serverTimestamp(),
      };

      if (familyId) {
        await addDoc(collection(db, "families", familyId, "milk"), payload);
      } else {
        await addDoc(collection(db, "milk"), { ...payload, userId: user.uid });
      }
      setJustLogged(true);
      setTimeout(() => setJustLogged(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const target = 32; // Target 32 oz daily
  const progressPercent = Math.min(100, (todayTotal / target) * 100);

  // Large Detailed Card Render
  if (mode === "large") {
    return (
      <div className="glass-card p-6 bg-slate-800/40 border border-slate-700/30 rounded-3xl relative overflow-hidden flex flex-col justify-between h-full group hover:border-sky-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-450 dark:text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Drop size={16} weight="fill" className="text-sky-400" />
            <span>Breastmilk Logged</span>
          </span>
          <Link
            href="/trackers/milk"
            className="w-7 h-7 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
            title="Open Full Page"
          >
            <ArrowUpRight size={14} weight="bold" />
          </Link>
        </div>

        {/* Metrics Content */}
        <div className="my-2 text-left">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              {todayTotal.toFixed(1)}
            </span>
            <span className="text-xs font-black text-slate-400 uppercase">oz</span>
            <span className="text-xs text-slate-500 font-bold ml-1">/ {target} oz target</span>
          </div>

          {/* Progress Slider */}
          <div className="space-y-1.5 mt-5 mb-4 text-left">
            <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Daily Progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-900/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Log Action */}
        <button
          onClick={handleQuickLog}
          className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs cursor-pointer active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 ${
            justLogged
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
              : "bg-slate-900/60 border border-slate-800 text-sky-450 hover:text-sky-350 hover:border-slate-700 hover:bg-slate-950"
          }`}
        >
          {justLogged ? (
            <>
              <Check size={14} weight="bold" />
              <span>+1 oz Registered!</span>
            </>
          ) : (
            <>
              <Plus size={14} weight="bold" />
              <span>Quick Log +1 oz</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Small Compact Row Render
  return (
    <Link
      href="/trackers/milk"
      className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 hover:bg-slate-900/50 border border-slate-850 hover:border-slate-800/80 transition-all duration-150 group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Drop size={18} weight="fill" className="text-sky-400" />
        </div>
        <div className="text-left">
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest">Breastmilk logged</h4>
          <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Target: 32 oz daily</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-lg font-black text-white">{todayTotal.toFixed(1)}</span>
          <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">oz</span>
        </div>
        <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-sky-450 group-hover:border-sky-500/30 transition-colors">
          <ArrowUpRight size={12} weight="bold" />
        </div>
      </div>
    </Link>
  );
}
