"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "@phosphor-icons/react";
import LinkPartnerPanel from "./LinkPartnerPanel";
import PrenatalChatbot from "./PrenatalChatbot";
import AuthModal from "./AuthModal";
import BottomNav from "./BottomNav";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, userProfile, logout, loading, updateProfileData } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const authModalRef = useRef<HTMLDialogElement | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showMissingInfoModal, setShowMissingInfoModal] = useState(false);
  const [expectedLaborDate, setExpectedLaborDate] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user && userProfile && !userProfile.expectedLaborDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const isDark = theme === "dark";

  const roleBadge = userProfile?.role === "husband"
    ? { emoji: "👨", label: "Husband", classes: "bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-300" }
    : { emoji: "👩", label: "Wife", classes: "bg-pink-500/15 border-pink-500/30 text-pink-600 dark:text-pink-300" };

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 font-sans">
        <div className="w-8 h-8 rounded-full border-4 border-t-rose-500 border-slate-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden pb-32 md:pb-28 ${
      isDark
        ? "bg-slate-900 text-slate-100 selection:bg-rose-500 selection:text-slate-900"
        : "bg-[#f8f7f4] text-slate-800 selection:bg-rose-500 selection:text-white"
    }`}>
      {/* Decorative background glow elements */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${
        isDark ? "bg-rose-950/25" : "bg-rose-200/30"
      }`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${
        isDark ? "bg-amber-950/20" : "bg-amber-200/20"
      }`} />

      {/* Header */}
      <header className={`w-full backdrop-blur-sm border-b border-slate-850/60 relative transition-all ${
        isProfileDropdownOpen ? "z-[110]" : "z-30"
      }`}>
        <div className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Lumina Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                Lumina
              </h1>
              <p className={`text-[10px] uppercase tracking-widest font-semibold ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}>
                Prenatal Suite
              </p>
            </div>
          </Link>

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
              <div className={`w-6 h-6 rounded-full border-2 animate-spin ${
                isDark ? "border-slate-700 border-t-rose-500" : "border-slate-300 border-t-rose-500"
              }`} />
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* User profile dropdown trigger */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden ${
                      isDark
                        ? "bg-slate-800/60 border-slate-700/40 hover:bg-slate-800"
                        : "bg-white/80 border-slate-200/60 hover:bg-white"
                    }`}
                    aria-label="Toggle profile menu"
                  >
                    {user.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
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
                        className="fixed inset-0 z-45 cursor-default"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-80 rounded-2xl p-5 bg-slate-950 border border-slate-850/80 z-50 shadow-2xl flex flex-col gap-4 animate-modal-scale-in text-slate-200">
                        {/* User Info Header inside Dropdown */}
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-850/60">
                          {user.photoURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-slate-100 text-xs font-extrabold">
                              {(user.displayName || user.email || "C").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="overflow-hidden text-left">
                            <span className="text-xs font-extrabold block truncate text-slate-100">
                              {user.displayName || "Caregiver"}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {user.email}
                            </span>
                            {/* Role badge */}
                            {userProfile?.role && (
                              <div className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.classes}`}>
                                <span>{roleBadge.emoji}</span>
                                <span>{roleBadge.label}</span>
                              </div>
                            )}
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
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center bg-rose-200 dark:bg-slate-850 hover:bg-rose-300/80 dark:hover:bg-slate-800 text-red-800 dark:text-red-400"
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
                <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  isDark
                    ? "bg-slate-800/80 border border-slate-700/50 text-slate-400"
                    : "bg-amber-50 border border-amber-200 text-amber-700"
                }`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  Offline Preview Mode
                </div>
                <button
                  onClick={openAuthModal}
                  className={`py-2 px-4 rounded-xl font-extrabold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer text-white ${
                    isDark
                      ? "bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 shadow-rose-500/10"
                      : "bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-rose-600/20"
                  }`}
                >
                  Sign In / Join
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-6 md:py-10 z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className={`w-full max-w-7xl mx-auto px-6 py-8 border-t text-center text-xs z-5 mt-auto ${
        isDark ? "border-slate-800/40 text-slate-500" : "border-slate-200/40 text-slate-400"
      }`}>
        <p>&copy; {new Date().getFullYear()} Lumina Prenatal Suite. All rights reserved.</p>
      </footer>

      {/* Universal Floating Navigation Dock */}
      <BottomNav />

      {/* Global Floating AI Companion */}
      <PrenatalChatbot />

      {/* Auth Modal Container */}
      <AuthModal dialogRef={authModalRef} />

      {/* Missing Info Modal */}
      {showMissingInfoModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border ${
            isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <h3 className="text-xl font-extrabold mb-2">Almost there!</h3>
            <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Please provide your Expected Labor Date (EDD) so we can tailor your experience.
            </p>
            <form onSubmit={handleSaveMissingInfo} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label htmlFor="edd-input-shell" className={`text-xs font-bold ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}>
                  Expected Labor Date
                </label>
                <input
                  id="edd-input-shell"
                  type="date"
                  value={expectedLaborDate}
                  onChange={(e) => setExpectedLaborDate(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50 ${
                    isDark
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
