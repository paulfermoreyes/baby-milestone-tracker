"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBaby } from "@/context/BabyContext";
import {
  CareLog,
  subscribeCareLogs,
  addCareLog,
  deleteCareLog,
  GrowthLog,
  subscribeGrowthLogs,
  subscribeMilestones,
  PREDEFINED_MILESTONES,
  calculateCareSummary24h,
  getDayOfLifeClinicalInfo,
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
  Play,
  Pause,
  ArrowCounterClockwise,
  CheckCircle,
  ClipboardText,
  Stethoscope,
  Sparkle,
  X,
  ArrowsLeftRight,
  Trash,
  Sun,
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
  const [isRoundsModalOpen, setIsRoundsModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Nursery / OLED Ultra-Dark Mode
  const [oledMode, setOledMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lumina_oled_mode") === "true";
    }
    return false;
  });

  const toggleOledMode = () => {
    setOledMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("lumina_oled_mode", String(next));
      }
      return next;
    });
  };

  // Clock tick for "time since" counters
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // 5-Second Undo Toast State
  const [undoItem, setUndoItem] = useState<{
    id: string;
    label: string;
    expiresAt: number;
  } | null>(null);
  const [undoCountdown, setUndoCountdown] = useState<number>(5);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startUndoToast = useCallback((id: string, label: string) => {
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    const expiresAt = Date.now() + 5000;
    setUndoItem({ id, label, expiresAt });
    setUndoCountdown(5);

    undoTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setUndoCountdown(remaining);
      if (remaining <= 0) {
        if (undoTimerRef.current) clearInterval(undoTimerRef.current);
        setUndoItem(null);
      }
    }, 250);
  }, []);

  const handleUndo = async () => {
    if (!undoItem || !user || !baby?.id) return;
    try {
      await deleteCareLog(familyId, user.uid, baby.id, undoItem.id);
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      setUndoItem(null);
    } catch (err) {
      console.error("Failed to undo log", err);
    }
  };

  // Feeding Mode & Timer States
  const [feedMode, setFeedMode] = useState<"breast" | "bottle">("breast");
  // Breastfeeding Stopwatches
  const [activeSide, setActiveSide] = useState<"left" | "right" | null>(null);
  const [leftSeconds, setLeftSeconds] = useState(0);
  const [rightSeconds, setRightSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [feedSubmitting, setFeedSubmitting] = useState(false);

  // Bottle logger state
  const [bottleMethod, setBottleMethod] = useState<"bottle_milk" | "bottle_formula">("bottle_formula");
  const [bottleAmountMl, setBottleAmountMl] = useState<number>(30);

  // General Care Modal
  const [moreAction, setMoreAction] = useState<"sleep" | "tummy" | "health" | null>(null);
  const [genericDuration, setGenericDuration] = useState<number>(30);
  const [temperatureC, setTemperatureC] = useState<number | "">("");
  const [moreNotes, setMoreNotes] = useState("");
  const [moreSubmitting, setMoreSubmitting] = useState(false);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && activeSide) {
      interval = setInterval(() => {
        if (activeSide === "left") {
          setLeftSeconds((prev) => prev + 1);
        } else if (activeSide === "right") {
          setRightSeconds((prev) => prev + 1);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, activeSide]);

  // Firestore subscriptions
  useEffect(() => {
    if (!user || !baby?.id) return;

    const unsubCare = subscribeCareLogs(familyId, user.uid, baby.id, setCareLogs);
    const unsubGrowth = subscribeGrowthLogs(familyId, user.uid, baby.id, setGrowthLogs);
    const unsubMilestones = subscribeMilestones(familyId, user.uid, baby.id, setAchievements);

    return () => {
      unsubCare();
      unsubGrowth();
      unsubMilestones();
    };
  }, [user, familyId, baby?.id]);

  // 1-Tap Diaper Handler (Zero Modals!)
  const handleOneTapDiaper = async (type: "wet" | "dirty" | "both") => {
    if (!user || !baby?.id) return;
    try {
      const docId = await addCareLog(familyId, user.uid, baby.id, {
        type: "diaper",
        timestamp: new Date().toISOString(),
        diaperType: type,
      });

      const labelMap = {
        wet: "Wet Diaper (💧)",
        dirty: "Dirty Diaper (💩)",
        both: "Wet & Dirty Diaper (💧💩)",
      };
      startUndoToast(docId, labelMap[type]);
    } catch (err) {
      console.error("Failed 1-tap diaper log", err);
    }
  };

  // Nursing Timer Control Functions
  const handleStartStopwatch = (side: "left" | "right") => {
    if (activeSide === side && isTimerRunning) {
      // Pause
      setIsTimerRunning(false);
    } else {
      // Switch or start
      setActiveSide(side);
      setIsTimerRunning(true);
    }
  };

  const handleFinishNursing = async () => {
    if (!user || !baby?.id) return;
    setFeedSubmitting(true);
    try {
      const leftMin = Math.round(leftSeconds / 60) || (leftSeconds > 15 ? 1 : 0);
      const rightMin = Math.round(rightSeconds / 60) || (rightSeconds > 15 ? 1 : 0);
      const totalSec = leftSeconds + rightSeconds;

      if (totalSec < 10) {
        // Just reset if tapped by accident with negligible duration
        setIsTimerRunning(false);
        setActiveSide(null);
        setLeftSeconds(0);
        setRightSeconds(0);
        return;
      }

      const lastSide = activeSide || (rightMin > 0 ? "right" : "left");

      const docId = await addCareLog(familyId, user.uid, baby.id, {
        type: "feeding",
        timestamp: new Date().toISOString(),
        feedingMethod: "breast",
        leftBreastMinutes: leftMin,
        rightBreastMinutes: rightMin,
        lastBreastSide: lastSide,
      });

      // Reset timer
      setIsTimerRunning(false);
      setActiveSide(null);
      setLeftSeconds(0);
      setRightSeconds(0);

      startUndoToast(docId, `Nursing Feed (${leftMin + rightMin} min)`);
    } catch (err) {
      console.error("Failed to save nursing feed", err);
    } finally {
      setFeedSubmitting(false);
    }
  };

  const handleResetNursing = () => {
    setIsTimerRunning(false);
    setActiveSide(null);
    setLeftSeconds(0);
    setRightSeconds(0);
  };

  // Bottle Quick Log Handler
  const handleQuickBottle = async (amount: number) => {
    if (!user || !baby?.id) return;
    setFeedSubmitting(true);
    try {
      const docId = await addCareLog(familyId, user.uid, baby.id, {
        type: "feeding",
        timestamp: new Date().toISOString(),
        feedingMethod: bottleMethod,
        amountMl: amount,
      });
      const typeLabel = bottleMethod === "bottle_formula" ? "Formula" : "Expressed Milk";
      startUndoToast(docId, `${amount} ml ${typeLabel}`);
    } catch (err) {
      console.error("Failed bottle log", err);
    } finally {
      setFeedSubmitting(false);
    }
  };

  // Generic Care Log Submitter (Sleep, Tummy, Health)
  const handleMoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !baby?.id || !moreAction) return;
    setMoreSubmitting(true);
    try {
      if (moreAction === "sleep") {
        await addCareLog(familyId, user.uid, baby.id, {
          type: "sleep",
          timestamp: new Date().toISOString(),
          durationMinutes: genericDuration,
          notes: moreNotes.trim() || undefined,
        });
      } else if (moreAction === "tummy") {
        await addCareLog(familyId, user.uid, baby.id, {
          type: "tummy_time",
          timestamp: new Date().toISOString(),
          durationMinutes: genericDuration,
          notes: moreNotes.trim() || undefined,
        });
      } else if (moreAction === "health") {
        await addCareLog(familyId, user.uid, baby.id, {
          type: "health",
          timestamp: new Date().toISOString(),
          temperatureC: temperatureC !== "" ? Number(temperatureC) : undefined,
          notes: moreNotes.trim() || undefined,
        });
      }
      setMoreAction(null);
      setMoreNotes("");
    } catch (err) {
      console.error("Failed to save log", err);
    } finally {
      setMoreSubmitting(false);
    }
  };

  // Delete specific historical log
  const handleDeleteLog = async (logId?: string) => {
    if (!logId || !user || !baby?.id) return;
    try {
      await deleteCareLog(familyId, user.uid, baby.id, logId);
    } catch (err) {
      console.error("Failed to delete log", err);
    }
  };

  // Send question to AI Assistant drawer
  const handleAskAI = (question: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-lumina-chat", {
          detail: { question },
        }),
      );
    }
  };

  // Copy Doctor Rounds summary to clipboard
  const handleCopySummary = (summaryText: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  // Helper formatting for seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Helper formatting for elapsed duration
  const formatElapsedMinutes = (mins: number | null) => {
    if (mins === null) return "None logged yet";
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m ago`;
  };

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

  // Calculate stats & clinical data
  const summary24h = calculateCareSummary24h(careLogs, now);
  const clinicalInfo = getDayOfLifeClinicalInfo(baby.birthDate, now);
  const latestGrowth = growthLogs[growthLogs.length - 1];
  const unlockedMilestones = Object.keys(achievements).length;
  const totalMilestones = PREDEFINED_MILESTONES.length;

  // Weight Delta Calculation
  let weightDeltaText = "No weight logged";
  let weightDeltaPercent = 0;
  if (baby.birthWeightGram && latestGrowth?.weightKg) {
    const currentGrams = latestGrowth.weightKg * 1000;
    const diff = currentGrams - baby.birthWeightGram;
    weightDeltaPercent = (diff / baby.birthWeightGram) * 100;
    const sign = diff >= 0 ? "+" : "";
    weightDeltaText = `${sign}${diff.toFixed(0)}g (${sign}${weightDeltaPercent.toFixed(1)}%) from birth`;
  }

  // Doctor rounds text summary for copying
  const doctorRoundsSummaryText = `📋 ${baby.name} - 24-Hour Clinical Rounds Summary
Age: ${clinicalInfo.phaseTitle} (Born ${baby.birthDate})
Birth Weight: ${baby.birthWeightGram ? (baby.birthWeightGram / 1000).toFixed(2) + " kg" : "N/A"}
Current Weight: ${latestGrowth?.weightKg ? latestGrowth.weightKg + " kg (" + weightDeltaText + ")" : "N/A"}

🍼 FEEDINGS (Last 24 Hours):
• Total Feeds: ${summary24h.totalFeeds}
• Nursing Duration: ${summary24h.totalNursingMinutes} minutes across ${summary24h.nursingFeeds} feeds
• Bottle Intake: ${summary24h.totalBottleMl} ml across ${summary24h.bottleFeeds} feeds
• Last Feed: ${formatElapsedMinutes(summary24h.timeSinceLastFeedMinutes)}

💧 DIAPERS & OUTPUT (Last 24 Hours):
• Total Diapers: ${summary24h.totalDiapers}
• Wet Diapers: ${summary24h.wetDiapers}
• Dirty Diapers: ${summary24h.dirtyDiapers} (Both: ${summary24h.bothDiapers})
• Last Diaper: ${formatElapsedMinutes(summary24h.timeSinceLastDiaperMinutes)}

Report generated via Lumina Newborn Suite on ${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`;

  return (
    <div
      className={`space-y-6 text-left transition-colors duration-300 pb-20 ${
        oledMode
          ? "bg-black text-amber-50 p-2 sm:p-4 rounded-3xl"
          : "text-slate-100"
      }`}
    >
      {/* 1. Header Banner & Quick Modes */}
      <div
        className={`p-5 md:p-7 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden ${
          oledMode
            ? "bg-zinc-950 border-amber-950/60 shadow-none"
            : "glass-card bg-slate-950/70 border-slate-800 shadow-xl"
        }`}
      >
        <div className="flex items-center gap-4 z-10">
          <div
            className={`w-14 h-14 rounded-2xl p-0.5 shadow-lg ${
              oledMode
                ? "bg-amber-950/50 border border-amber-700/50 text-amber-400"
                : "bg-gradient-to-tr from-cyan-500 to-blue-500 text-cyan-400"
            }`}
          >
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Baby size={30} weight="bold" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                {baby.name}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${
                  oledMode
                    ? "bg-amber-950/60 border-amber-800/80 text-amber-300"
                    : "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                }`}
              >
                {baby.gender}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span className="font-semibold text-cyan-400">
                {clinicalInfo.phaseTitle}
              </span>
              <span>•</span>
              <span>Born {baby.birthDate}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 z-10 w-full md:w-auto">
          {/* OLED Nursery Mode Button */}
          <button
            onClick={toggleOledMode}
            title="Toggle Ultra-Dark Nursery Mode"
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              oledMode
                ? "bg-amber-500 text-black border-amber-400 font-extrabold shadow-amber-500/20 shadow-md"
                : "bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border-slate-800"
            }`}
          >
            {oledMode ? (
              <>
                <Sun size={15} weight="bold" />
                <span>Nursery (On)</span>
              </>
            ) : (
              <>
                <Moon size={15} weight="bold" />
                <span>3 AM OLED</span>
              </>
            )}
          </button>

          {/* Doctor Rounds View Trigger */}
          <button
            onClick={() => setIsRoundsModalOpen(true)}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Stethoscope size={16} weight="bold" />
            <span>Doctor Rounds View</span>
          </button>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 transition-all cursor-pointer"
          >
            Edit
          </button>
        </div>
      </div>

      {/* 2. Glanceable Shift Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Last Feed Elapsed */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            oledMode
              ? "bg-zinc-950 border-zinc-850"
              : "glass-card bg-slate-950/60 border-slate-800/80"
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block mb-1">
              Last Feeding
            </span>
            <span className="text-base sm:text-lg font-black text-white">
              {formatElapsedMinutes(summary24h.timeSinceLastFeedMinutes)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {summary24h.latestFeed
                ? summary24h.latestFeed.feedingMethod === "breast"
                  ? `${(summary24h.latestFeed.leftBreastMinutes || 0) + (summary24h.latestFeed.rightBreastMinutes || 0)}m nursing`
                  : `${summary24h.latestFeed.amountMl || 0}ml bottle`
                : "No feeds logged"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
            <Drop size={20} weight="fill" />
          </div>
        </div>

        {/* Last Diaper Elapsed */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            oledMode
              ? "bg-zinc-950 border-zinc-850"
              : "glass-card bg-slate-950/60 border-slate-800/80"
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block mb-1">
              Last Diaper
            </span>
            <span className="text-base sm:text-lg font-black text-white">
              {formatElapsedMinutes(summary24h.timeSinceLastDiaperMinutes)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5 capitalize">
              {summary24h.latestDiaper
                ? `${summary24h.latestDiaper.diaperType} diaper`
                : "No diaper logged"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Pulse size={20} weight="bold" />
          </div>
        </div>

        {/* Next Breast Side Indicator */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            oledMode
              ? "bg-zinc-950 border-zinc-850"
              : "glass-card bg-slate-950/60 border-slate-800/80"
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 block mb-1">
              Nurse Next On
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black text-white capitalize">
                {summary24h.nextBreastSide
                  ? `${summary24h.nextBreastSide} Breast`
                  : "Either Side"}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Prev:{" "}
              {summary24h.latestFeed?.lastBreastSide
                ? `${summary24h.latestFeed.lastBreastSide} side`
                : "None recorded"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <ArrowsLeftRight size={20} weight="bold" />
          </div>
        </div>
      </div>

      {/* 3. Ultra-Minimalist 1-Tap Diaper Command Bar */}
      <div
        className={`p-5 rounded-3xl border ${
          oledMode
            ? "bg-zinc-950 border-amber-900/40"
            : "glass-card bg-slate-950/80 border-slate-800 shadow-xl"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Pulse size={16} weight="bold" />
              1-Tap Diaper Quick-Log
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Zero modals: tap once to record instantly with auto-timestamp.
            </p>
          </div>
          <div className="text-[11px] text-slate-400 font-semibold">
            24h Target: <span className="text-white font-bold">{clinicalInfo.targetWetDiapers}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* 1-Tap Wet */}
          <button
            onClick={() => handleOneTapDiaper("wet")}
            className="p-4 sm:p-5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 active:scale-95 border-2 border-cyan-500/40 hover:border-cyan-400 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/5 group"
          >
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              💧
            </div>
            <div>
              <span className="text-sm sm:text-base font-black text-white block">
                +1 Wet
              </span>
              <span className="text-[10px] text-cyan-300 font-medium">
                Pee Diaper
              </span>
            </div>
          </button>

          {/* 1-Tap Dirty */}
          <button
            onClick={() => handleOneTapDiaper("dirty")}
            className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border-2 border-amber-500/40 hover:border-amber-400 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/5 group"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              💩
            </div>
            <div>
              <span className="text-sm sm:text-base font-black text-white block">
                +1 Dirty
              </span>
              <span className="text-[10px] text-amber-300 font-medium">
                Poop Diaper
              </span>
            </div>
          </button>

          {/* 1-Tap Both */}
          <button
            onClick={() => handleOneTapDiaper("both")}
            className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 border-2 border-emerald-500/40 hover:border-emerald-400 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/5 group"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              💧💩
            </div>
            <div>
              <span className="text-sm sm:text-base font-black text-white block">
                +1 Both
              </span>
              <span className="text-[10px] text-emerald-300 font-medium">
                Wet & Dirty
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Hybrid / Dynamic Feeding Command Center */}
      <div
        className={`p-5 rounded-3xl border ${
          oledMode
            ? "bg-zinc-950 border-zinc-850"
            : "glass-card bg-slate-950/80 border-slate-800 shadow-xl"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Drop size={16} weight="fill" />
              Feeding Command Hub
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Dual nursing stopwatches or 1-tap bottle volume presets.
            </p>
          </div>

          {/* Toggle between Breast and Bottle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setFeedMode("breast")}
              className={`py-1.5 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                feedMode === "breast"
                  ? "bg-cyan-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🤱 Nursing
            </button>
            <button
              onClick={() => setFeedMode("bottle")}
              className={`py-1.5 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                feedMode === "bottle"
                  ? "bg-cyan-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🍼 Bottle
            </button>
          </div>
        </div>

        {feedMode === "breast" ? (
          /* Breastfeeding Dual Stopwatches */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Left Breast Timer */}
              <div
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center ${
                  activeSide === "left" && isTimerRunning
                    ? "bg-cyan-500/15 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10"
                    : "bg-slate-900/60 border-slate-800"
                }`}
              >
                <span className="text-xs font-extrabold text-slate-300 mb-1">
                  Left Breast
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-wider my-1">
                  {formatTime(leftSeconds)}
                </span>
                <button
                  onClick={() => handleStartStopwatch("left")}
                  className={`mt-2 py-2 px-4 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                    activeSide === "left" && isTimerRunning
                      ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                      : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                  }`}
                >
                  {activeSide === "left" && isTimerRunning ? (
                    <>
                      <Pause size={15} weight="fill" />
                      Pause Left
                    </>
                  ) : (
                    <>
                      <Play size={15} weight="fill" />
                      {leftSeconds > 0 ? "Resume Left" : "Start Left"}
                    </>
                  )}
                </button>
              </div>

              {/* Right Breast Timer */}
              <div
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center ${
                  activeSide === "right" && isTimerRunning
                    ? "bg-cyan-500/15 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10"
                    : "bg-slate-900/60 border-slate-800"
                }`}
              >
                <span className="text-xs font-extrabold text-slate-300 mb-1">
                  Right Breast
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-wider my-1">
                  {formatTime(rightSeconds)}
                </span>
                <button
                  onClick={() => handleStartStopwatch("right")}
                  className={`mt-2 py-2 px-4 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                    activeSide === "right" && isTimerRunning
                      ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                      : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                  }`}
                >
                  {activeSide === "right" && isTimerRunning ? (
                    <>
                      <Pause size={15} weight="fill" />
                      Pause Right
                    </>
                  ) : (
                    <>
                      <Play size={15} weight="fill" />
                      {rightSeconds > 0 ? "Resume Right" : "Start Right"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Total & Action Buttons */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/40 border border-slate-855">
              <div className="text-xs text-slate-300 font-semibold">
                Total Session:{" "}
                <span className="text-white font-mono font-bold text-sm">
                  {formatTime(leftSeconds + rightSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(leftSeconds > 0 || rightSeconds > 0) && (
                  <button
                    onClick={handleResetNursing}
                    className="p-2 rounded-xl text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                    title="Reset Timers"
                  >
                    <ArrowCounterClockwise size={16} />
                  </button>
                )}
                <button
                  onClick={handleFinishNursing}
                  disabled={feedSubmitting || (leftSeconds === 0 && rightSeconds === 0)}
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold shadow-md disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle size={16} weight="bold" />
                  {feedSubmitting ? "Saving..." : "Save Feed"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Bottle Logger with Presets */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Type:</span>
              <button
                onClick={() => setBottleMethod("bottle_formula")}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  bottleMethod === "bottle_formula"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 font-extrabold"
                    : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
              >
                Formula
              </button>
              <button
                onClick={() => setBottleMethod("bottle_milk")}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  bottleMethod === "bottle_milk"
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-extrabold"
                    : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
              >
                Expressed Milk
              </button>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 block mb-2">
                1-Tap Volume Presets (Day 0–7 Sized):
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[10, 15, 30, 45, 60, 90].map((ml) => (
                  <button
                    key={ml}
                    onClick={() => handleQuickBottle(ml)}
                    disabled={feedSubmitting}
                    className="py-3 px-2 rounded-xl bg-slate-900 hover:bg-cyan-500/20 border border-slate-800 hover:border-cyan-400 text-center transition-all cursor-pointer group active:scale-95"
                  >
                    <span className="text-base font-black text-white group-hover:text-cyan-300 block">
                      {ml} ml
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-cyan-400">
                      {(ml / 30).toFixed(1)} oz
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="number"
                value={bottleAmountMl}
                onChange={(e) => setBottleAmountMl(Number(e.target.value))}
                placeholder="Custom ml"
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white w-32 text-center"
              />
              <button
                onClick={() => handleQuickBottle(bottleAmountMl)}
                disabled={feedSubmitting || bottleAmountMl <= 0}
                className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition-all cursor-pointer"
              >
                Log Custom Amount
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Day-of-Life Pediatric Guidance Card */}
      <div
        className={`p-5 rounded-3xl border relative overflow-hidden ${
          oledMode
            ? "bg-zinc-950 border-zinc-850"
            : "glass-card bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-indigo-950/30 border-indigo-900/40 shadow-xl"
        }`}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkle size={18} weight="fill" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {clinicalInfo.phaseTitle} Clinical Guide
              </h3>
              <span className="text-[11px] text-indigo-300 font-semibold">
                Stomach: {clinicalInfo.stomachSizeName} ({clinicalInfo.stomachCapacityMl})
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-extrabold">
            Day {clinicalInfo.dayNumber}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {clinicalInfo.clinicalTip}
        </p>

        {/* 1-Tap AI Quick Ask Prompts */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
            Instant Pediatric Assistant Questions:
          </span>
          <div className="flex flex-wrap gap-2">
            {clinicalInfo.quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleAskAI(q)}
                className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-indigo-600/30 border border-slate-800 hover:border-indigo-400/50 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>💬</span>
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Secondary Care Tools & Overview Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setMoreAction("sleep")}
          className="p-4 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all text-left flex flex-col gap-2 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Moon size={18} weight="fill" />
          </div>
          <div>
            <span className="text-xs font-extrabold block text-white">Log Sleep</span>
            <span className="text-[10px] text-indigo-300">Nap / Night sleep</span>
          </div>
        </button>

        <button
          onClick={() => setMoreAction("tummy")}
          className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all text-left flex flex-col gap-2 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Footprints size={18} weight="bold" />
          </div>
          <div>
            <span className="text-xs font-extrabold block text-white">Tummy Time</span>
            <span className="text-[10px] text-emerald-300">Head & neck reflex</span>
          </div>
        </button>

        <Link
          href="/trackers/baby-growth"
          className="p-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all text-left flex flex-col gap-2 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Scales size={18} weight="bold" />
            </div>
            <span className="text-[10px] text-purple-400 font-bold group-hover:underline">
              WHO Charts →
            </span>
          </div>
          <div>
            <span className="text-xs font-extrabold block text-white">
              {latestGrowth?.weightKg
                ? `${latestGrowth.weightKg} kg`
                : baby.birthWeightGram
                ? `${(baby.birthWeightGram / 1000).toFixed(2)} kg (birth)`
                : "Log Weight"}
            </span>
            <span className="text-[10px] text-purple-300">
              {latestGrowth?.weightKg && baby.birthWeightGram ? weightDeltaText : "Track recovery"}
            </span>
          </div>
        </Link>

        <Link
          href="/trackers/baby-milestones"
          className="p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all text-left flex flex-col gap-2 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trophy size={18} weight="bold" />
            </div>
            <span className="text-[10px] text-rose-400 font-bold group-hover:underline">
              Journal →
            </span>
          </div>
          <div>
            <span className="text-xs font-extrabold block text-white">
              {unlockedMilestones} / {totalMilestones} Milestones
            </span>
            <span className="text-[10px] text-rose-300">0–12 Month checklist</span>
          </div>
        </Link>
      </div>

      {/* 7. Today's Recent Activity Timeline */}
      <div
        className={`p-5 rounded-3xl border ${
          oledMode
            ? "bg-zinc-950 border-zinc-850"
            : "glass-card bg-slate-950/70 border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Today&apos;s Care Timeline ({careLogs.length} events logged)
          </h3>
          <Link
            href="/trackers/baby-care"
            className="text-xs text-cyan-400 hover:underline font-bold"
          >
            Full Logbook →
          </Link>
        </div>

        {careLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No events logged yet today. Tap +1 Wet, +1 Dirty, or Start Nursing above!
          </p>
        ) : (
          <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto pr-1">
            {careLogs.slice(0, 10).map((log) => {
              const dateObj = new Date(log.timestamp);
              const timeStr = dateObj.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={log.id}
                  className="py-2.5 flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-slate-500 text-[11px]">
                      {timeStr}
                    </span>
                    <span className="font-bold text-white capitalize">
                      {log.type === "feeding" && (
                        <>
                          🍼{" "}
                          {log.feedingMethod === "breast"
                            ? `Nursing (${(log.leftBreastMinutes || 0) + (log.rightBreastMinutes || 0)}m - L:${log.leftBreastMinutes || 0}m R:${log.rightBreastMinutes || 0}m)`
                            : `Bottle (${log.amountMl || 0}ml)`}
                        </>
                      )}
                      {log.type === "diaper" && (
                        <>
                          {log.diaperType === "wet" && "💧 Wet Diaper"}
                          {log.diaperType === "dirty" && "💩 Dirty Diaper"}
                          {log.diaperType === "both" && "💧💩 Wet & Dirty Diaper"}
                          {log.diaperType === "dry" && "⚪ Dry Diaper Check"}
                        </>
                      )}
                      {log.type === "sleep" && `🌙 Sleep (${log.durationMinutes || 0}m)`}
                      {log.type === "tummy_time" && `👣 Tummy Time (${log.durationMinutes || 0}m)`}
                      {log.type === "health" && `🩺 Health Check ${log.temperatureC ? `(${log.temperatureC}°C)` : ""}`}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="opacity-40 hover:opacity-100 text-slate-400 hover:text-red-400 transition-all p-1 cursor-pointer"
                    title="Delete entry"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 8. Floating 5-Second Undo Toast */}
      {undoItem && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] max-w-sm w-[90%] animate-slide-up">
          <div className="p-3.5 rounded-2xl bg-slate-900/95 border-2 border-cyan-400 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-bold truncate">
                {undoItem.label}
              </span>
            </div>
            <button
              onClick={handleUndo}
              className="py-1.5 px-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs transition-all cursor-pointer active:scale-95 shrink-0"
            >
              Undo ({undoCountdown}s)
            </button>
          </div>
        </div>
      )}

      {/* 9. Doctor Rounds View Modal */}
      {isRoundsModalOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-700 text-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                  <Stethoscope size={16} weight="bold" />
                  Hospital Pediatrician Rounds View
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  {baby.name}
                </h2>
                <p className="text-xs text-slate-400">
                  {clinicalInfo.phaseTitle} • Born {baby.birthDate}
                </p>
              </div>
              <button
                onClick={() => setIsRoundsModalOpen(false)}
                className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Vitals Summary Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Birth Weight
                </span>
                <span className="text-base font-black text-white">
                  {baby.birthWeightGram
                    ? `${(baby.birthWeightGram / 1000).toFixed(2)} kg`
                    : "Not recorded"}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Latest Weight Delta
                </span>
                <span className="text-base font-black text-emerald-400">
                  {latestGrowth?.weightKg
                    ? `${latestGrowth.weightKg} kg`
                    : "No log"}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {latestGrowth?.weightKg && baby.birthWeightGram
                    ? weightDeltaText
                    : ""}
                </span>
              </div>
            </div>

            {/* 24-Hour Clinical Totals */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                24-Hour Intake & Output Breakdown
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Total Feed Sessions:</span>
                  <span className="text-lg font-black text-white">
                    {summary24h.totalFeeds} feeds
                  </span>
                  <span className="text-[11px] text-emerald-400 block">
                    Nursing: {summary24h.totalNursingMinutes}m | Bottle: {summary24h.totalBottleMl}ml
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Diaper Output:</span>
                  <span className="text-lg font-black text-white">
                    {summary24h.totalDiapers} total
                  </span>
                  <span className="text-[11px] text-emerald-400 block">
                    {summary24h.wetDiapers} wet, {summary24h.dirtyDiapers} dirty
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/20 text-xs flex items-center justify-between text-slate-300">
                <span>Last Feed: <strong>{formatElapsedMinutes(summary24h.timeSinceLastFeedMinutes)}</strong></span>
                <span>Last Diaper: <strong>{formatElapsedMinutes(summary24h.timeSinceLastDiaperMinutes)}</strong></span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleCopySummary(doctorRoundsSummaryText)}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <ClipboardText size={16} />
                {copySuccess ? "Copied to Clipboard!" : "Copy Text Summary"}
              </button>
              <button
                onClick={() => setIsRoundsModalOpen(false)}
                className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Secondary Action Modal (Sleep, Tummy, Health) */}
      {moreAction && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-2xl text-left">
            <h3 className="text-lg font-extrabold capitalize mb-4 flex items-center gap-2">
              <Heart size={20} className="text-cyan-400" />
              Log {moreAction.replace("_", " ")} Session
            </h3>

            <form onSubmit={handleMoreSubmit} className="space-y-4">
              {(moreAction === "sleep" || moreAction === "tummy") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={genericDuration}
                    onChange={(e) => setGenericDuration(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                    required
                  />
                </div>
              )}

              {moreAction === "health" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperatureC}
                    onChange={(e) =>
                      setTemperatureC(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    placeholder="e.g. 36.8"
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Notes (Optional)
                </label>
                <textarea
                  value={moreNotes}
                  onChange={(e) => setMoreNotes(e.target.value)}
                  placeholder="Observations, sleep position, temperament..."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setMoreAction(null)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={moreSubmitting}
                  className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  {moreSubmitting ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Baby Profile Editor Modal */}
      <BabyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
