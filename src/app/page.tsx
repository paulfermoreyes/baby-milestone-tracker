"use client";

import { useRef, useState, useEffect } from "react";
import KickCounter from "../components/KickCounter";
import MilkCounter from "../components/MilkCounter";
import BloodSugarTracker from "../components/BloodSugarTracker";
import SymptomTracker from "../components/SymptomTracker";
import WeightTracker from "../components/WeightTracker";
import ContractionTimer from "../components/ContractionTimer";
import PrenatalChatbot from "../components/PrenatalChatbot";
import AuthModal from "../components/AuthModal";
import LinkPartnerPanel from "../components/LinkPartnerPanel";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Footprints, Timer, Drop, ThermometerHot, Scales, Sun, Moon } from "@phosphor-icons/react";

export default function Home() {
  const { user, userProfile, logout, loading, updateProfileData } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const authModalRef = useRef<HTMLDialogElement | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const [showMissingInfoModal, setShowMissingInfoModal] = useState(false);
  const [expectedLaborDate, setExpectedLaborDate] = useState("");

  useEffect(() => {
    if (!loading && user && userProfile && !userProfile.expectedLaborDate) {
      setShowMissingInfoModal(true);
    }
  }, [loading, user, userProfile]);

  const handleSaveMissingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedLaborDate) return;
    await updateProfileData({ expectedLaborDate });
    setShowMissingInfoModal(false);
  };

  const openAuthModal = () => {
    authModalRef.current?.showModal();
  };

  // Smooth scroll handler for mobile FAB navigation
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const roleBadge = userProfile?.role === "husband"
    ? { emoji: "👨", label: "Husband", classes: "bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-300" }
    : { emoji: "👩", label: "Wife", classes: "bg-pink-500/15 border-pink-500/30 text-pink-600 dark:text-pink-300" };

  const isDark = theme === "dark";

  const componentMap = {
    symptoms: <SymptomTracker />,
    weight: <WeightTracker />,
    sugar: <BloodSugarTracker />,
    milk: <MilkCounter />,
    kicks: <KickCounter />,
    contractions: <ContractionTimer />
  };

  const week = userProfile?.pregnancyWeek || 0;
  let order: (keyof typeof componentMap)[] = ["kicks", "contractions", "sugar", "milk", "symptoms", "weight"];
  if (week > 0 && week <= 13) {
    order = ["symptoms", "weight", "sugar", "milk", "kicks", "contractions"];
  } else if (week >= 14 && week <= 27) {
    order = ["weight", "kicks", "symptoms", "sugar", "milk", "contractions"];
  } else if (week >= 28) {
    order = ["contractions", "kicks", "sugar", "weight", "symptoms", "milk"];
  }

  const mainFocusKeys = order.slice(0, 3);
  const sidePanelKeys = order.slice(3, 6);

  return (
    <div className={`min-h-screen flex flex-col font-sans relative overflow-hidden pb-24 md:pb-0 ${isDark
      ? "bg-slate-900 text-slate-100 selection:bg-rose-500 selection:text-slate-900"
      : "bg-[#f8f7f4] text-slate-800 selection:bg-rose-500 selection:text-white"
      }`}>
      {/* Decorative background glow elements */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${isDark ? "bg-rose-950/25" : "bg-rose-200/30"
        }`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${isDark ? "bg-amber-950/20" : "bg-amber-200/20"
        }`} />

      {/* Header */}
      <header className={`w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between backdrop-blur-sm border-b border-slate-850/60 relative transition-all ${
        isProfileDropdownOpen ? "z-[110]" : "z-30"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl overflow-hidden shadow-lg flex items-center justify-center ${isDark
            ? "shadow-rose-500/10 bg-slate-950 border border-slate-800"
            : "shadow-rose-500/10 bg-white border border-slate-200"
            }`}>
            <img src="/logo.png" alt="Lumina Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              Lumina
            </h1>
            <p className={`text-[10px] uppercase tracking-widest font-semibold ${isDark ? "text-slate-400" : "text-slate-500"
              }`}>
              Prenatal Suite
            </p>
          </div>
        </div>

        {/* Auth Control Block */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            <span className="toggle-thumb">
              {isDark ? (
                <Moon size={12} weight="fill" className="text-white" />
              ) : (
                <Sun size={12} weight="fill" className="text-white" />
              )}
            </span>
          </button>

          {loading ? (
            <div className={`w-6 h-6 rounded-full border-2 animate-spin ${isDark ? "border-slate-700 border-t-rose-500" : "border-slate-300 border-t-rose-500"
              }`} />
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* Cloud sync status */}
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${isDark
                ? "bg-rose-950/40 border border-rose-800/30 text-rose-300"
                : "bg-rose-50 border border-rose-200 text-rose-600"
                }`}>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                Cloud Synced
              </div>

              {/* Role badge */}
              {userProfile?.role && (
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${roleBadge.classes}`}>
                  <span>{roleBadge.emoji}</span>
                  <span>{roleBadge.label}</span>
                </div>
              )}

              {/* User profile dropdown trigger */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden ${isDark
                    ? "bg-slate-800/60 border-slate-700/40 hover:bg-slate-800"
                    : "bg-white/80 border-slate-200/60 hover:bg-white"
                    }`}
                  aria-label="Toggle profile menu"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-slate-950 text-xs font-extrabold">
                      {(user.displayName || user.email || "C").charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <>
                    {/* Click-away backdrop */}
                    <div
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    />
                    <div className={`absolute right-0 mt-2 w-80 rounded-2xl p-5 border border-slate-850/80 z-50 shadow-2xl flex flex-col gap-4 animate-modal-scale-in ${isDark
                      ? "bg-slate-950 text-slate-100"
                      : "bg-white text-slate-900"
                      }`}>

                      {/* User Info Header inside Dropdown */}
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-850/60">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-slate-100 text-xs font-extrabold">
                            {(user.displayName || user.email || "C").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="overflow-hidden text-left">
                          <span className={`text-xs font-extrabold block truncate ${isDark ? "text-white" : "text-slate-950"}`}>
                            {user.displayName || "Caregiver"}
                          </span>
                          <span className={`text-[10px] ${isDark ? "text-slate-300" : "text-slate-900"} block truncate`}>
                            {user.email}
                          </span>
                        </div>
                      </div>

                      {/* Couple Linking module inside Dropdown */}
                      <div className="text-left">
                        <LinkPartnerPanel />
                      </div>

                      {/* Dropdown Actions */}
                      <div className="border-t border-slate-850/60 pt-3">
                        <button
                          onClick={() => {
                            logout();
                            setIsProfileDropdownOpen(false);
                          }}
                          className={`w-full py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${isDark
                            ? "bg-slate-850 hover:bg-slate-800 text-red-400"
                            : "bg-rose-200 hover:bg-rose-300/80 text-red-800"
                            }`}
                        >
                          Sign Out
                        </button>
                      </div>

                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isDark
                ? "bg-slate-800/80 border border-slate-700/50 text-slate-400"
                : "bg-amber-50 border border-amber-200 text-amber-700"
                }`}>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                Offline Preview Mode
              </div>
              <button
                onClick={openAuthModal}
                className={`py-2 px-4 rounded-xl font-extrabold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer text-white ${isDark
                  ? "bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 shadow-rose-500/10"
                  : "bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-rose-600/20"
                  }`}
              >
                Sign In / Join
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 z-10">
        {/* Welcome Section */}
        <div className="mb-10 text-center md:text-left">
          <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-2 ${isDark ? "text-white" : "text-slate-100"}`}>
            Welcome to Your Dashboard
            {userProfile?.pregnancyWeek ? (
              <span className={`text-2xl md:text-3xl ml-3 ${isDark ? "text-rose-400" : "text-rose-500"}`}>
                - Week {userProfile.pregnancyWeek}
              </span>
            ) : null}
          </h2>
          <p className={isDark ? "text-slate-400 max-w-2xl" : "text-slate-500 max-w-2xl"}>
            Track daily progress, log vital signs, and stay connected with other caregivers in real-time. Keep a close eye on key prenatal metrics.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Focus: Active trackers & Trend Analytics */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {mainFocusKeys.map((key) => (
              <div id={key} key={key}>
                {componentMap[key]}
              </div>
            ))}
          </div>

          {/* Side Panels - Supplementary tracking cards */}
          <div className="flex flex-col gap-6">
            {sidePanelKeys.map((key) => (
              <div id={key} key={key}>
                {componentMap[key]}
              </div>
            ))}

            {/* Guest caregiver placeholder */}
            {!user && (
              <div className={`p-6 rounded-2xl border flex flex-col gap-4 ${isDark
                ? "bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-800"
                : "bg-gradient-to-br from-white/80 to-slate-50/80 border-slate-200"
                }`}>
                <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-950"
                  }`}>
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Active Caregivers
                </h4>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2 overflow-hidden">
                    <div className={`inline-block h-8 w-8 rounded-full ring-2 flex items-center justify-center text-xs font-bold ${isDark
                      ? "ring-slate-900 bg-slate-700 text-slate-400"
                      : "ring-white bg-slate-200 text-slate-500"
                      }`}>G</div>
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-rose-500 flex items-center justify-center text-xs font-bold text-white">P</div>
                  </div>
                  <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Guest Mode</span>
                </div>
                <p className={`text-xs leading-normal ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Sign in to link with your partner and share the same dashboard.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Global Floating AI Companion */}
        <PrenatalChatbot />
      </main>

      {/* Footer */}
      <footer className={`w-full max-w-7xl mx-auto px-6 py-8 border-t text-center text-xs z-5 ${isDark ? "border-slate-800/40 text-slate-500" : "border-slate-200/40 text-slate-400"
        }`}>
        <p>&copy; {new Date().getFullYear()} Lumina Prenatal Suite. All rights reserved.</p>
      </footer>

      {/* Mobile Floating Action Panel Dock Navigator (FAB navigation) */}
      <div className="fixed bottom-4 left-4 right-4 py-3 px-4 flex items-center justify-around z-30 lg:hidden rounded-2xl liquid-glass-nav">
        <button
          onClick={() => scrollToSection("kicks")}
          className={`flex flex-col items-center gap-1 group active:scale-95 transition-all cursor-pointer ${isDark ? "text-slate-400 hover:text-rose-400" : "text-slate-400 hover:text-rose-500"
            }`}
        >
          <Footprints size={18} weight="bold" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Kicks</span>
        </button>
        <button
          onClick={() => scrollToSection("contractions")}
          className={`flex flex-col items-center gap-1 group active:scale-95 transition-all cursor-pointer ${isDark ? "text-slate-400 hover:text-rose-400" : "text-slate-400 hover:text-rose-500"
            }`}
        >
          <Timer size={18} weight="bold" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Timing</span>
        </button>
        <button
          onClick={() => scrollToSection("sugar")}
          className={`flex flex-col items-center gap-1 group active:scale-95 transition-all cursor-pointer ${isDark ? "text-slate-400 hover:text-rose-400" : "text-slate-400 hover:text-rose-500"
            }`}
        >
          <Drop size={18} weight="bold" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Sugar</span>
        </button>
        <button
          onClick={() => scrollToSection("milk")}
          className={`flex flex-col items-center gap-1 group active:scale-95 transition-all cursor-pointer ${isDark ? "text-slate-400 hover:text-sky-400" : "text-slate-400 hover:text-sky-500"
            }`}
        >
          <Drop size={18} weight="fill" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Milk</span>
        </button>
        <button
          onClick={() => scrollToSection("symptoms")}
          className={`flex flex-col items-center gap-1 group active:scale-95 transition-all cursor-pointer ${isDark ? "text-slate-400 hover:text-teal-400" : "text-slate-400 hover:text-teal-500"
            }`}
        >
          <ThermometerHot size={18} weight="bold" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Diary</span>
        </button>
        <button
          onClick={() => scrollToSection("weight")}
          className={`flex flex-col items-center gap-1 group active:scale-95 transition-all cursor-pointer ${isDark ? "text-slate-400 hover:text-amber-400" : "text-slate-400 hover:text-amber-500"
            }`}
        >
          <Scales size={18} weight="bold" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Weight</span>
        </button>
      </div>

      {/* Auth Modal Container */}
      <AuthModal dialogRef={authModalRef} />

      {/* Missing Info Modal */}
      {showMissingInfoModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl border ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <h3 className="text-xl font-extrabold mb-2">Almost there!</h3>
            <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Please provide your Expected Labor Date (EDD) so we can tailor your experience.
            </p>
            <form onSubmit={handleSaveMissingInfo} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label htmlFor="edd-input" className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Expected Labor Date
                </label>
                <input
                  id="edd-input"
                  type="date"
                  value={expectedLaborDate}
                  onChange={(e) => setExpectedLaborDate(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50 ${isDark
                    ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500"
                    : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                    }`}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-extrabold text-sm shadow-md shadow-rose-500/10 active:scale-[0.98] transition-all duration-150 cursor-pointer"
              >
                Save Date
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
