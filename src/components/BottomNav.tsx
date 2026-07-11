"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  House,
  Footprints,
  Timer,
  Drop,
  ThermometerHot,
  Scales,
  List,
  X,
  Calendar,
  ListChecks
} from "@phosphor-icons/react";

interface TrackerItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ weight?: "bold" | "fill" | "regular" | "thin" | "light" | "duotone"; size?: number; className?: string }>;
  iconProps?: { weight?: "bold" | "fill" | "regular" | "thin" | "light" | "duotone"; size?: number; className?: string };
  colorClass: string;
  activeColorClass: string;
}

export default function BottomNav() {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Tracker Configurations
  const allItems: Record<string, TrackerItem> = {
    home: {
      key: "home",
      label: "Home",
      href: "/",
      icon: House,
      iconProps: { weight: "bold" },
      colorClass: "text-slate-400 hover:text-rose-400",
      activeColorClass: "text-rose-500 font-extrabold"
    },
    kicks: {
      key: "kicks",
      label: "Kicks",
      href: "/trackers/kicks",
      icon: Footprints,
      iconProps: { weight: "bold" },
      colorClass: "text-slate-400 hover:text-cyan-400",
      activeColorClass: "text-cyan-400 font-extrabold"
    },
    contractions: {
      key: "contractions",
      label: "Timing",
      href: "/trackers/contractions",
      icon: Timer,
      iconProps: { weight: "bold" },
      colorClass: "text-slate-400 hover:text-rose-400",
      activeColorClass: "text-rose-450 font-extrabold"
    },
    sugar: {
      key: "sugar",
      label: "Sugar",
      href: "/trackers/blood-sugar",
      icon: Drop,
      iconProps: { weight: "bold" },
      colorClass: "text-slate-400 hover:text-indigo-400",
      activeColorClass: "text-indigo-450 font-extrabold"
    },
    milk: {
      key: "milk",
      label: "Milk",
      href: "/trackers/milk",
      icon: Drop,
      iconProps: { weight: "fill" },
      colorClass: "text-slate-400 hover:text-sky-400",
      activeColorClass: "text-sky-400 font-extrabold"
    },
    symptoms: {
      key: "symptoms",
      label: "Diary",
      href: "/trackers/symptoms",
      icon: ThermometerHot,
      iconProps: { weight: "bold" },
      colorClass: "text-slate-400 hover:text-teal-400",
      activeColorClass: "text-teal-400 font-extrabold"
    },
    weight: {
      key: "weight",
      label: "Weight",
      href: "/trackers/weight",
      icon: Scales,
      iconProps: { weight: "bold" },
      colorClass: "text-slate-400 hover:text-amber-400",
      activeColorClass: "text-amber-500 font-extrabold"
    },
    baptism: {
      key: "baptism",
      label: "Baptism",
      href: "/trackers/baptism",
      icon: Calendar,
      iconProps: { weight: "bold" },
      colorClass: "text-slate-400 hover:text-purple-400",
      activeColorClass: "text-purple-400 font-extrabold"
    },
    checklist: {
      key: "checklist",
      label: "Checklist",
      href: "/trackers/birth-preparation-checklist",
      icon: ListChecks,
      iconProps: { weight: "bold" },
      colorClass: "text-slate-400 hover:text-emerald-400",
      activeColorClass: "text-emerald-400 font-extrabold"
    }
  };

  if (!mounted) return null;

  // Determine priority order based on pregnancy week
  const week = userProfile?.pregnancyWeek || 0;
  let mobilePriorityKeys: string[] = ["kicks", "contractions", "sugar"];
  if (week > 0 && week <= 13) {
    mobilePriorityKeys = ["symptoms", "weight", "sugar"];
  } else if (week >= 14 && week <= 27) {
    mobilePriorityKeys = ["weight", "kicks", "symptoms"];
  } else if (week >= 28) {
    mobilePriorityKeys = ["contractions", "kicks", "checklist"];
  }

  const mobileDockKeys = ["home", ...mobilePriorityKeys];
  const mobileMoreKeys = Object.keys(allItems).filter(
    (key) => !mobileDockKeys.includes(key)
  );

  const handleLinkClick = () => {
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Universal Floating Navigation Dock */}
      <div className="fixed bottom-4 left-4 right-4 z-40 max-w-5xl mx-auto py-3 px-4 md:px-6 flex items-center justify-between rounded-2xl liquid-glass-nav">
        
        {/* DESKTOP NAV DOCK (lg & above) - Lists all 7 links */}
        <div className="hidden lg:flex items-center justify-around w-full">
          {Object.values(allItems).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-2 group px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? `bg-slate-800/60 dark:bg-slate-950/60 border border-slate-700/30 ${item.activeColorClass}`
                    : `hover:bg-slate-850/40 border border-transparent ${item.colorClass}`
                }`}
              >
                <Icon size={18} {...item.iconProps} />
                <span className="text-[10px] uppercase font-bold tracking-wider select-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* MOBILE NAV DOCK (lg & below) - Streamlined 5 items (Home + 3 Priorities + More) */}
        <div className="flex lg:hidden items-center justify-around w-full relative">
          {mobileDockKeys.map((key) => {
            const item = allItems[key];
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex flex-col items-center gap-1 group active:scale-95 transition-all cursor-pointer ${
                  isActive ? item.activeColorClass : item.colorClass
                }`}
              >
                <Icon size={20} {...item.iconProps} />
                <span className="text-[9px] font-bold uppercase tracking-wider select-none">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More trigger button */}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`flex flex-col items-center gap-1 group active:scale-95 transition-all cursor-pointer ${
              isMoreOpen
                ? "text-rose-500 font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            aria-label="Toggle all trackers menu"
          >
            {isMoreOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
            <span className="text-[9px] font-bold uppercase tracking-wider select-none">
              More
            </span>
          </button>
        </div>
      </div>

      {/* MOBILE "MORE" OVERLAY DRAWER PANEL */}
      {isMoreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[35] lg:hidden animate-fade-in"
            onClick={() => setIsMoreOpen(false)}
          />
          {/* Drawer container */}
          <div className="fixed bottom-20 left-4 right-4 z-[38] lg:hidden p-5 rounded-2xl glass-card bg-slate-950 border border-slate-850/80 shadow-2xl flex flex-col gap-4 animate-modal-scale-in text-slate-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-850/60">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                Additional Trackers
              </h4>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
            
            {/* List of remaining trackers */}
            <div className="grid grid-cols-2 gap-3">
              {mobileMoreKeys.map((key) => {
                const item = allItems[key];
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all active:scale-[0.98] cursor-pointer ${
                      isActive
                        ? `bg-slate-900/60 border-slate-800/80 ${item.activeColorClass}`
                        : `bg-slate-900/30 hover:bg-slate-900/50 border-slate-850/60 ${item.colorClass}`
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-950/80 flex items-center justify-center border border-slate-850/50">
                      <Icon size={16} {...item.iconProps} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-100">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
