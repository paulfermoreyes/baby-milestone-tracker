"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBaby } from "@/context/BabyContext";
import {
  House,
  TrendUp,
  Plus,
  ListChecks,
  List,
  X,
  Drop,
  Footprints,
  Scales,
  Timer,
  ThermometerHot,
  Calendar,
  Baby,
  Heart,
  Sparkle,
  CheckCircle,
  DownloadSimple,
} from "@phosphor-icons/react";
import { addCareLog } from "@/lib/baby";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportDataModal from "@/components/ExportDataModal";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, familyId } = useAuth();
  const { activeMode, setActiveMode, baby } = useBaby();

  const [mounted, setMounted] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // 1-Tap Quick Action: Kick (+1)
  const handleQuickKick = async () => {
    setIsLogOpen(false);
    if (!user || !familyId) {
      showToast("Kick recorded (Preview Mode)");
      return;
    }
    try {
      await addDoc(collection(db, "families", familyId, "kicks"), {
        loggedBy: user.uid,
        createdAt: serverTimestamp(),
      });
      showToast("✨ +1 Baby Kick Logged!");
    } catch (e) {
      console.error(e);
      showToast("Failed to log kick");
    }
  };

  // 1-Tap Quick Action: Milk (+1)
  const handleQuickMilk = async () => {
    setIsLogOpen(false);
    if (!user || !familyId) {
      showToast("Milk recorded (Preview Mode)");
      return;
    }
    try {
      await addDoc(collection(db, "families", familyId, "milk"), {
        loggedBy: user.uid,
        createdAt: serverTimestamp(),
      });
      showToast("🥛 +1 Milk Cup Logged!");
    } catch (e) {
      console.error(e);
      showToast("Failed to log milk");
    }
  };

  // 1-Tap Quick Action: Diaper
  const handleQuickDiaper = async (diaperType: "wet" | "dirty" | "both") => {
    setIsLogOpen(false);
    if (!user || !baby?.id) {
      showToast(`${diaperType.toUpperCase()} Diaper recorded (Preview Mode)`);
      return;
    }
    try {
      await addCareLog(familyId, user.uid, baby.id, {
        type: "diaper",
        timestamp: new Date().toISOString(),
        diaperType,
      });
      showToast(
        diaperType === "wet"
          ? "💧 +1 Wet Diaper Logged!"
          : diaperType === "dirty"
            ? "💩 +1 Dirty Diaper Logged!"
            : "✨ Wet + Dirty Diaper Logged!",
      );
    } catch (e) {
      console.error(e);
      showToast("Failed to log diaper");
    }
  };

  if (!mounted) return null;

  // ── Stage-Specific 5-Tab Configuration ─────────────────────────────────────
  const isPrenatal = activeMode === "prenatal";

  const tabs = isPrenatal
    ? [
        {
          key: "today",
          label: "Today",
          href: "/",
          icon: House,
          colorClass: "text-slate-400 hover:text-rose-400",
          activeColorClass: "text-rose-500 font-extrabold",
        },
        {
          key: "trends",
          label: "Trends",
          href: "/trackers/blood-sugar",
          icon: TrendUp,
          colorClass: "text-slate-400 hover:text-indigo-400",
          activeColorClass: "text-indigo-400 font-extrabold",
        },
        {
          key: "fab",
          label: "Log",
          isFab: true,
        },
        {
          key: "prep",
          label: "Prep",
          href: "/trackers/birth-preparation-checklist",
          icon: ListChecks,
          colorClass: "text-slate-400 hover:text-emerald-400",
          activeColorClass: "text-emerald-400 font-extrabold",
        },
        {
          key: "more",
          label: "More",
          isMoreTrigger: true,
          icon: List,
          colorClass: "text-slate-400 hover:text-slate-200",
          activeColorClass: "text-rose-500 font-extrabold",
        },
      ]
    : [
        {
          key: "today",
          label: "Today",
          href: "/",
          icon: House,
          colorClass: "text-slate-400 hover:text-cyan-400",
          activeColorClass: "text-cyan-400 font-extrabold",
        },
        {
          key: "care",
          label: "Care Log",
          href: "/trackers/baby-care",
          icon: Drop,
          colorClass: "text-slate-400 hover:text-sky-400",
          activeColorClass: "text-sky-400 font-extrabold",
        },
        {
          key: "fab",
          label: "Log",
          isFab: true,
        },
        {
          key: "milestones",
          label: "Milestones",
          href: "/trackers/baby-milestones",
          icon: Footprints,
          colorClass: "text-slate-400 hover:text-pink-400",
          activeColorClass: "text-pink-400 font-extrabold",
        },
        {
          key: "more",
          label: "More",
          isMoreTrigger: true,
          icon: List,
          colorClass: "text-slate-400 hover:text-slate-200",
          activeColorClass: "text-cyan-400 font-extrabold",
        },
      ];

  const handleNavigate = (path: string) => {
    setIsLogOpen(false);
    setIsMoreOpen(false);
    router.push(path);
  };

  return (
    <>
      {/* ── Toast Notification ──────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900/95 dark:bg-white text-white dark:text-slate-950 font-extrabold text-xs shadow-2xl flex items-center gap-2 border border-slate-700/60 dark:border-slate-300 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <CheckCircle size={16} weight="fill" className="text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Stage-Aware 5-Tab Floating Bottom Dock ───────────────────────────── */}
      <nav
        aria-label="Main Navigation"
        className="fixed bottom-4 left-4 right-4 z-40 max-w-lg md:max-w-xl mx-auto py-2.5 px-3 md:px-5 flex items-center justify-between rounded-2xl liquid-glass-nav"
      >
        <div className="flex items-center justify-around w-full">
          {tabs.map((tab) => {
            // Elevated Center FAB Button
            if (tab.isFab) {
              return (
                <button
                  key="center-fab"
                  onClick={() => {
                    setIsMoreOpen(false);
                    setIsLogOpen(!isLogOpen);
                  }}
                  aria-label="Open Quick-Log Action Center"
                  className={`relative -top-4 w-12 h-12 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300 active:scale-95 cursor-pointer ${
                    isPrenatal
                      ? "bg-gradient-to-tr from-rose-500 to-amber-500 shadow-rose-500/30 hover:shadow-rose-500/50"
                      : "bg-gradient-to-tr from-cyan-500 to-teal-400 shadow-cyan-500/30 hover:shadow-cyan-500/50"
                  }`}
                >
                  <Plus
                    size={24}
                    weight="bold"
                    className={`transition-transform duration-300 ${
                      isLogOpen ? "rotate-45" : "rotate-0"
                    }`}
                  />
                  <span className="sr-only">Quick Log</span>
                </button>
              );
            }

            // More Menu Trigger Button
            if (tab.isMoreTrigger) {
              const Icon = tab.icon!;
              return (
                <button
                  key="more-button"
                  onClick={() => {
                    setIsLogOpen(false);
                    setIsMoreOpen(!isMoreOpen);
                  }}
                  aria-label="Toggle all trackers menu"
                  className={`flex flex-col items-center gap-1 group active:scale-95 transition-all cursor-pointer py-1 px-3 ${
                    isMoreOpen ? tab.activeColorClass : tab.colorClass
                  }`}
                >
                  <Icon size={20} weight={isMoreOpen ? "bold" : "regular"} />
                  <span className="text-[10px] font-bold uppercase tracking-wider select-none">
                    {tab.label}
                  </span>
                </button>
              );
            }

            // Standard Tab Link
            const isActive = pathname === tab.href;
            const Icon = tab.icon!;
            return (
              <Link
                key={tab.key}
                href={tab.href!}
                onClick={() => {
                  setIsLogOpen(false);
                  setIsMoreOpen(false);
                }}
                className={`flex flex-col items-center gap-1 group active:scale-95 transition-all cursor-pointer py-1 px-3 ${
                  isActive ? tab.activeColorClass : tab.colorClass
                }`}
              >
                <Icon size={20} weight={isActive ? "bold" : "regular"} />
                <span className="text-[10px] font-bold uppercase tracking-wider select-none">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── + Log Quick-Action Bottom Sheet ──────────────────────────────────── */}
      {isLogOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsLogOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Quick-Log Action Center"
            className="fixed bottom-22 left-4 right-4 z-40 max-w-lg mx-auto bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/60 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-5 duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  {isPrenatal ? "Prenatal Quick-Log" : "Newborn Quick-Log"}
                </h3>
              </div>
              <button
                onClick={() => setIsLogOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Stage Switcher Pill inside sheet */}
            <div className="my-3 flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
              <button
                onClick={() => setActiveMode("prenatal")}
                className={`flex-1 py-1 px-2.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isPrenatal
                    ? "bg-rose-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Heart size={12} weight="bold" />
                Prenatal
              </button>
              <button
                onClick={() => setActiveMode("newborn")}
                className={`flex-1 py-1 px-2.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  !isPrenatal
                    ? "bg-cyan-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Baby size={12} weight="bold" />
                Newborn Hub
              </button>
            </div>

            {/* Quick Actions Grid */}
            {isPrenatal ? (
              <div className="space-y-3">
                {/* 1-Tap Instant Loggers */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleQuickKick}
                    className="p-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-left transition-all active:scale-95 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Footprints size={18} weight="bold" className="text-cyan-400" />
                      <span className="text-[10px] uppercase font-black text-cyan-300">
                        1-Tap
                      </span>
                    </div>
                    <div className="text-xs font-black text-white">Log Kick (+1)</div>
                    <div className="text-[10px] text-slate-400">Instant counter sync</div>
                  </button>

                  <button
                    onClick={handleQuickMilk}
                    className="p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-left transition-all active:scale-95 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Drop size={18} weight="fill" className="text-sky-400" />
                      <span className="text-[10px] uppercase font-black text-sky-300">
                        1-Tap
                      </span>
                    </div>
                    <div className="text-xs font-black text-white">Milk/Water (+1)</div>
                    <div className="text-[10px] text-slate-400">Hydration target</div>
                  </button>
                </div>

                {/* Detailed Trackers Navigation */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => handleNavigate("/trackers/contractions")}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-center transition-all cursor-pointer"
                  >
                    <Timer size={20} className="mx-auto mb-1 text-rose-400" />
                    <span className="text-[10px] font-bold text-slate-200 block truncate">
                      Contractions
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate("/trackers/blood-sugar")}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-center transition-all cursor-pointer"
                  >
                    <Drop size={20} className="mx-auto mb-1 text-indigo-400" />
                    <span className="text-[10px] font-bold text-slate-200 block truncate">
                      Blood Sugar
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate("/trackers/symptoms")}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-center transition-all cursor-pointer"
                  >
                    <ThermometerHot size={20} className="mx-auto mb-1 text-teal-400" />
                    <span className="text-[10px] font-bold text-slate-200 block truncate">
                      Symptoms
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate("/trackers/weight")}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-center transition-all cursor-pointer"
                  >
                    <Scales size={20} className="mx-auto mb-1 text-amber-400" />
                    <span className="text-[10px] font-bold text-slate-200 block truncate">
                      Weight
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate("/trackers/birth-preparation-checklist")}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-center transition-all cursor-pointer"
                  >
                    <ListChecks size={20} className="mx-auto mb-1 text-emerald-400" />
                    <span className="text-[10px] font-bold text-slate-200 block truncate">
                      Checklist
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate("/trackers/baptism")}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-center transition-all cursor-pointer"
                  >
                    <Calendar size={20} className="mx-auto mb-1 text-purple-400" />
                    <span className="text-[10px] font-bold text-slate-200 block truncate">
                      Baptism
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Newborn 1-Tap Fast Diaper Loggers */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleQuickDiaper("wet")}
                    className="p-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-left transition-all active:scale-95 cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Drop size={18} weight="fill" className="text-cyan-400" />
                      <span className="text-[10px] uppercase font-black text-cyan-300">
                        1-Tap
                      </span>
                    </div>
                    <div className="text-xs font-black text-white">+1 Wet Diaper</div>
                    <div className="text-[10px] text-slate-400">Intake/output log</div>
                  </button>

                  <button
                    onClick={() => handleQuickDiaper("dirty")}
                    className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-all active:scale-95 cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkle size={18} weight="fill" className="text-amber-400" />
                      <span className="text-[10px] uppercase font-black text-amber-300">
                        1-Tap
                      </span>
                    </div>
                    <div className="text-xs font-black text-white">+1 Dirty Diaper</div>
                    <div className="text-[10px] text-slate-400">Bowel movement</div>
                  </button>
                </div>

                {/* Newborn Care Hub Navigation */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => handleNavigate("/trackers/baby-care")}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-center transition-all cursor-pointer"
                  >
                    <Drop size={20} className="mx-auto mb-1 text-cyan-400" />
                    <span className="text-[10px] font-bold text-slate-200 block truncate">
                      Feeding Log
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate("/trackers/baby-care")}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-center transition-all cursor-pointer"
                  >
                    <Timer size={20} className="mx-auto mb-1 text-teal-400" />
                    <span className="text-[10px] font-bold text-slate-200 block truncate">
                      Sleep & Tummy
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate("/trackers/baby-growth")}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-center transition-all cursor-pointer"
                  >
                    <Scales size={20} className="mx-auto mb-1 text-purple-400" />
                    <span className="text-[10px] font-bold text-slate-200 block truncate">
                      Growth Entry
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate("/trackers/baby-milestones")}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-center transition-all cursor-pointer col-span-3"
                  >
                    <Footprints size={20} className="mx-auto mb-1 text-pink-400" />
                    <span className="text-[10px] font-bold text-slate-200 block truncate">
                      Developmental Milestones
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 'More' Trackers & Stage Switcher Drawer ─────────────────────────── */}
      {isMoreOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsMoreOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="All Trackers and Tools"
            className="fixed bottom-22 left-4 right-4 z-40 max-w-lg mx-auto bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/60 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-5 duration-300 max-h-[75vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <List size={16} weight="bold" />
                All Application Trackers
              </h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Stage Selector */}
            <div className="my-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Active Tracking Stage
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setActiveMode("prenatal");
                    setIsMoreOpen(false);
                    router.push("/");
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isPrenatal
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold"
                      : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-white"
                  }`}
                >
                  <Heart size={18} weight="bold" className="mb-1 text-rose-400" />
                  <div className="text-xs font-extrabold text-white">Prenatal Suite</div>
                  <div className="text-[10px] text-slate-400">Pregnancy & Vitals</div>
                </button>

                <button
                  onClick={() => {
                    setActiveMode("newborn");
                    setIsMoreOpen(false);
                    router.push("/");
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    !isPrenatal
                      ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold"
                      : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-white"
                  }`}
                >
                  <Baby size={18} weight="bold" className="mb-1 text-cyan-400" />
                  <div className="text-xs font-extrabold text-white">Newborn Care</div>
                  <div className="text-[10px] text-slate-400">Day 0+ Command Hub</div>
                </button>
              </div>
            </div>

            {/* Prenatal Section */}
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Prenatal Trackers
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNavigate("/trackers/kicks")}
                  className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left transition-all cursor-pointer flex items-center gap-2.5"
                >
                  <Footprints size={18} className="text-cyan-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Kicks Counter</span>
                </button>

                <button
                  onClick={() => handleNavigate("/trackers/contractions")}
                  className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left transition-all cursor-pointer flex items-center gap-2.5"
                >
                  <Timer size={18} className="text-rose-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Contraction Timer</span>
                </button>

                <button
                  onClick={() => handleNavigate("/trackers/blood-sugar")}
                  className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left transition-all cursor-pointer flex items-center gap-2.5"
                >
                  <Drop size={18} className="text-indigo-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Blood Sugar</span>
                </button>

                <button
                  onClick={() => handleNavigate("/trackers/milk")}
                  className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left transition-all cursor-pointer flex items-center gap-2.5"
                >
                  <Drop size={18} weight="fill" className="text-sky-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Milk & Hydration</span>
                </button>

                <button
                  onClick={() => handleNavigate("/trackers/symptoms")}
                  className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left transition-all cursor-pointer flex items-center gap-2.5"
                >
                  <ThermometerHot size={18} className="text-teal-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Symptoms Diary</span>
                </button>

                <button
                  onClick={() => handleNavigate("/trackers/weight")}
                  className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left transition-all cursor-pointer flex items-center gap-2.5"
                >
                  <Scales size={18} className="text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Maternal Weight</span>
                </button>

                <button
                  onClick={() => handleNavigate("/trackers/birth-preparation-checklist")}
                  className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left transition-all cursor-pointer flex items-center gap-2.5"
                >
                  <ListChecks size={18} className="text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Birth Checklist</span>
                </button>

                <button
                  onClick={() => handleNavigate("/trackers/baptism")}
                  className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left transition-all cursor-pointer flex items-center gap-2.5"
                >
                  <Calendar size={18} className="text-purple-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Baptism Organizer</span>
                </button>
              </div>
            </div>

            {/* Newborn Section */}
            <div className="pt-4 border-t border-slate-800 mt-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Newborn & Infant Hub
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNavigate("/trackers/baby-care")}
                  className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left transition-all cursor-pointer flex items-center gap-2.5"
                >
                  <Drop size={18} className="text-cyan-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Care Logs</span>
                </button>

                <button
                  onClick={() => handleNavigate("/trackers/baby-growth")}
                  className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left transition-all cursor-pointer flex items-center gap-2.5"
                >
                  <Scales size={18} className="text-purple-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Growth Tracking</span>
                </button>

                <button
                  onClick={() => handleNavigate("/trackers/baby-milestones")}
                  className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left transition-all cursor-pointer flex items-center gap-2.5 col-span-2"
                >
                  <Footprints size={18} className="text-pink-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Milestones Checklist</span>
                </button>
              </div>
            </div>

            {/* Data Export & Backup Section */}
            <div className="pt-4 border-t border-slate-800 mt-4">
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  setIsExportOpen(true);
                }}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-500/15 to-cyan-500/15 hover:from-purple-500/25 hover:to-cyan-500/25 border border-purple-500/30 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <DownloadSimple size={20} className="text-purple-400" />
                  <div>
                    <span className="text-xs font-black text-white block">Export Health Records</span>
                    <span className="text-[10px] text-slate-400">Download CSV for pediatrician or full JSON backup</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md">
                  Export
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Pediatric Data Export Modal ────────────────────────────────────── */}
      <ExportDataModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </>
  );
}
