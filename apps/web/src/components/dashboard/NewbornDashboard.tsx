"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBaby } from "@/context/BabyContext";
import {
  CareLog,
  subscribeCareLogs,
  addCareLog,
  GrowthLog,
  subscribeGrowthLogs,
  subscribeMilestones,
  PREDEFINED_MILESTONES,
} from "@/lib/baby";
import {
  Baby,
  Drop,
  Moon,
  Footprints,
  Scales,
  Plus,
  Trophy,
  Pulse,
  Heart,
} from "@phosphor-icons/react";
import Link from "next/link";
import BabyProfileModal from "../baby/BabyProfileModal";

export default function NewbornDashboard() {
  const { user, familyId } = useAuth();
  const { baby } = useBaby();

  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>([]);
  const [achievements, setAchievements] = useState<Record<string, unknown>>({});
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Quick Action Form Modal
  const [quickAction, setQuickAction] = useState<
    "feeding" | "diaper" | "sleep" | "tummy" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  // Quick action form states
  const [feedingMethod, setFeedingMethod] = useState<"breast" | "bottle_milk" | "bottle_formula" | "solids">("breast");
  const [leftBreast, setLeftBreast] = useState<number | "">(10);
  const [rightBreast, setRightBreast] = useState<number | "">(10);
  const [amountMl, setAmountMl] = useState<number | "">(60);
  const [diaperType, setDiaperType] = useState<"wet" | "dirty" | "both" | "dry">("wet");
  const [durationMinutes, setDurationMinutes] = useState<number | "">(30);

  useEffect(() => {
    if (!user || !baby?.id) return;

    const unsubCare = subscribeCareLogs(familyId, user.uid, baby.id, setCareLogs);
    const unsubGrowth = subscribeGrowthLogs(
      familyId,
      user.uid,
      baby.id,
      setGrowthLogs,
    );
    const unsubMilestones = subscribeMilestones(
      familyId,
      user.uid,
      baby.id,
      setAchievements,
    );

    return () => {
      unsubCare();
      unsubGrowth();
      unsubMilestones();
    };
  }, [user, familyId, baby?.id]);

  if (!baby) {
    return (
      <div className="glass-card p-10 rounded-3xl bg-slate-950/60 border border-slate-800 text-center max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <Baby size={32} weight="bold" />
        </div>
        <h3 className="text-2xl font-extrabold text-white mb-2">
          Newborn Mode & Care Hub
        </h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Track daily feedings, diaper changes, sleep quality, WHO growth curves, and 0-12m developmental milestones in real-time with your partner.
        </p>
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Plus size={18} weight="bold" />
          Create Baby Profile
        </button>

        <BabyProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      </div>
    );
  }

  // Derived Statistics
  const latestFeeding = careLogs.find((l) => l.type === "feeding");
  const latestDiaper = careLogs.find((l) => l.type === "diaper");
  const latestGrowth = growthLogs[growthLogs.length - 1];

  const unlockedCount = Object.keys(achievements).length;
  const totalMilestones = PREDEFINED_MILESTONES.length;

  // Calculate age in days/weeks
  const birthDateObj = new Date(baby.birthDate);
  const diffTime = Math.abs(Date.now() - birthDateObj.getTime());
  const ageDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const ageWeeks = Math.floor(ageDays / 7);

  const handleQuickLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !baby.id || !quickAction) return;
    setSubmitting(true);
    try {
      if (quickAction === "feeding") {
        await addCareLog(familyId, user.uid, baby.id, {
          type: "feeding",
          timestamp: new Date().toISOString(),
          feedingMethod,
          leftBreastMinutes:
            feedingMethod === "breast" && leftBreast !== ""
              ? Number(leftBreast)
              : undefined,
          rightBreastMinutes:
            feedingMethod === "breast" && rightBreast !== ""
              ? Number(rightBreast)
              : undefined,
          amountMl:
            feedingMethod !== "breast" && amountMl !== ""
              ? Number(amountMl)
              : undefined,
        });
      } else if (quickAction === "diaper") {
        await addCareLog(familyId, user.uid, baby.id, {
          type: "diaper",
          timestamp: new Date().toISOString(),
          diaperType,
        });
      } else if (quickAction === "sleep") {
        await addCareLog(familyId, user.uid, baby.id, {
          type: "sleep",
          timestamp: new Date().toISOString(),
          durationMinutes: durationMinutes !== "" ? Number(durationMinutes) : 30,
        });
      } else if (quickAction === "tummy") {
        await addCareLog(familyId, user.uid, baby.id, {
          type: "tummy_time",
          timestamp: new Date().toISOString(),
          durationMinutes: durationMinutes !== "" ? Number(durationMinutes) : 10,
        });
      }
      setQuickAction(null);
    } catch (err) {
      console.error("Failed quick log", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 text-slate-100 text-left animate-fade-in">
      {/* Top Banner Header */}
      <div className="glass-card p-6 md:p-8 rounded-3xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
              <Baby size={30} weight="bold" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                {baby.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold capitalize">
                {baby.gender}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span>{ageWeeks} weeks old ({ageDays} days)</span>
              <span>•</span>
              <span>Born {baby.birthDate}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 w-full md:w-auto">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex-1 md:flex-none py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 transition-all cursor-pointer"
          >
            Edit Profile
          </button>
          <Link
            href="/trackers/baby-care"
            className="flex-1 md:flex-none py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold shadow-md transition-all text-center cursor-pointer"
          >
            Open Care Log
          </Link>
        </div>
      </div>

      {/* Quick Action Logger Bar */}
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
          Instant Care Logger
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setQuickAction("feeding")}
            className="p-4 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all text-left flex flex-col gap-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Drop size={18} weight="fill" />
            </div>
            <div>
              <span className="text-xs font-extrabold block text-white">Log Feeding</span>
              <span className="text-[10px] text-cyan-300">Breast / Bottle</span>
            </div>
          </button>

          <button
            onClick={() => setQuickAction("diaper")}
            className="p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all text-left flex flex-col gap-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Pulse size={18} weight="bold" />
            </div>
            <div>
              <span className="text-xs font-extrabold block text-white">Log Diaper</span>
              <span className="text-[10px] text-amber-300">Wet / Dirty</span>
            </div>
          </button>

          <button
            onClick={() => setQuickAction("sleep")}
            className="p-4 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all text-left flex flex-col gap-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Moon size={18} weight="fill" />
            </div>
            <div>
              <span className="text-xs font-extrabold block text-white">Log Sleep</span>
              <span className="text-[10px] text-indigo-300">Nap duration</span>
            </div>
          </button>

          <button
            onClick={() => setQuickAction("tummy")}
            className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all text-left flex flex-col gap-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Footprints size={18} weight="bold" />
            </div>
            <div>
              <span className="text-xs font-extrabold block text-white">Tummy Time</span>
              <span className="text-[10px] text-emerald-300">Exercise session</span>
            </div>
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Last Feeding Card */}
        <div className="glass-card p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              Feeding Status
            </span>
            <Drop size={18} weight="fill" className="text-cyan-400" />
          </div>
          <div>
            <div className="text-lg font-black text-white">
              {latestFeeding ? (
                latestFeeding.feedingMethod === "breast" ? (
                  `${(latestFeeding.leftBreastMinutes || 0) + (latestFeeding.rightBreastMinutes || 0)} min nursing`
                ) : (
                  `${latestFeeding.amountMl || 0} ml bottle`
                )
              ) : (
                "No feeds logged"
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {latestFeeding
                ? `Last feed ${new Date(latestFeeding.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : "Tap log feeding above"}
            </p>
          </div>
        </div>

        {/* Diaper Summary */}
        <div className="glass-card p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Last Diaper
            </span>
            <Pulse size={18} weight="bold" className="text-amber-400" />
          </div>
          <div>
            <div className="text-lg font-black text-white capitalize">
              {latestDiaper ? `${latestDiaper.diaperType} diaper` : "No diaper logged"}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {latestDiaper
                ? `Changed ${new Date(latestDiaper.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : "Keep track of wet/dirty count"}
            </p>
          </div>
        </div>

        {/* Growth Stats Card */}
        <Link
          href="/trackers/baby-growth"
          className="glass-card p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Growth Vitals
            </span>
            <Scales size={18} weight="bold" className="text-purple-400" />
          </div>
          <div>
            <div className="text-lg font-black text-white">
              {latestGrowth?.weightKg
                ? `${latestGrowth.weightKg} kg`
                : baby.birthWeightGram
                ? `${(baby.birthWeightGram / 1000).toFixed(2)} kg (birth)`
                : "No weight log"}
            </div>
            <p className="text-xs text-purple-300 mt-1 group-hover:underline">
              View WHO Growth Charts →
            </p>
          </div>
        </Link>

        {/* Milestones unlocked */}
        <Link
          href="/trackers/baby-milestones"
          className="glass-card p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
              Development
            </span>
            <Trophy size={18} weight="bold" className="text-rose-400" />
          </div>
          <div>
            <div className="text-lg font-black text-white">
              {unlockedCount} / {totalMilestones} Unlocked
            </div>
            <p className="text-xs text-rose-300 mt-1 group-hover:underline">
              View Milestone Journal →
            </p>
          </div>
        </Link>
      </div>

      {/* Quick Action Modal Popup */}
      {quickAction && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-2xl text-left">
            <h3 className="text-lg font-extrabold capitalize mb-4 flex items-center gap-2">
              <Heart size={20} className="text-cyan-400" />
              Log {quickAction} Session
            </h3>

            <form onSubmit={handleQuickLogSubmit} className="space-y-4">
              {quickAction === "feeding" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Method</label>
                    <select
                      value={feedingMethod}
                      onChange={(e) =>
                        setFeedingMethod(
                          e.target.value as
                            | "breast"
                            | "bottle_milk"
                            | "bottle_formula"
                            | "solids"
                        )
                      }
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                    >
                      <option value="breast">Breastfeeding / Nursing 🤱</option>
                      <option value="bottle_milk">Bottle (Expressed Milk) 🍼</option>
                      <option value="bottle_formula">Bottle (Formula) 🍼</option>
                      <option value="solids">Solids / Puree 🥣</option>
                    </select>
                  </div>

                  {feedingMethod === "breast" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-300">Left Breast (min)</label>
                        <input
                          type="number"
                          value={leftBreast}
                          onChange={(e) => setLeftBreast(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-300">Right Breast (min)</label>
                        <input
                          type="number"
                          value={rightBreast}
                          onChange={(e) => setRightBreast(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-slate-300">Amount (ml)</label>
                      <input
                        type="number"
                        value={amountMl}
                        onChange={(e) => setAmountMl(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                      />
                    </div>
                  )}
                </>
              )}

              {quickAction === "diaper" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Condition</label>
                  <select
                    value={diaperType}
                    onChange={(e) =>
                      setDiaperType(
                        e.target.value as "wet" | "dirty" | "both" | "dry",
                      )
                    }
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white capitalize"
                  >
                    <option value="wet">Wet 💧</option>
                    <option value="dirty">Dirty 💩</option>
                    <option value="both">Both (Wet & Dirty) 💧💩</option>
                    <option value="dry">Dry / Clean Check ⚪</option>
                  </select>
                </div>
              )}

              {(quickAction === "sleep" || quickAction === "tummy") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setQuickAction(null)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Care Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Baby Profile Modal */}
      <BabyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
