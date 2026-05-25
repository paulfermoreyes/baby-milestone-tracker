"use client";

import { useRef } from "react";
import KickCounter from "../components/KickCounter";
import AuthModal from "../components/AuthModal";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, logout, loading } = useAuth();
  const authModalRef = useRef<HTMLDialogElement | null>(null);

  const openAuthModal = () => {
    authModalRef.current?.showModal();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative overflow-hidden selection:bg-cyan-500 selection:text-slate-900">
      {/* Decorative background glow elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-800/60 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-xl font-bold text-slate-950">✨</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Lumina
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              Prenatal Suite
            </p>
          </div>
        </div>

        {/* Auth Control Block */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-6 h-6 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* Caregiver Sync status */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-800/30 text-xs font-semibold text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                Cloud Synced
              </div>
              {/* User profile details */}
              <div className="flex items-center gap-2 bg-slate-800/60 pl-2.5 pr-3 py-1.5 rounded-2xl border border-slate-700/40">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "Caregiver"} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-slate-950 text-[10px] font-extrabold">
                    {(user.displayName || user.email || "C").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-200 hidden sm:inline">
                  {user.displayName || user.email?.split("@")[0] || "Caregiver"}
                </span>
                <button
                  onClick={logout}
                  className="ml-1 text-slate-400 hover:text-red-400 text-xs font-bold py-0.5 px-1.5 rounded-md hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-xs font-medium text-slate-400">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Offline Preview Mode
              </div>
              <button
                onClick={openAuthModal}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/10 active:scale-[0.98] transition-all cursor-pointer"
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
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
            Welcome to Your Dashboard
          </h2>
          <p className="text-slate-400 max-w-2xl">
            Track daily progress, log vital signs, and stay connected with other caregivers in real-time. Keep a close eye on key prenatal metrics.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Focus: Kick Counter */}
          <div className="lg:col-span-2">
            <KickCounter />
          </div>

          {/* Side Panels - Visual Previews / Actions */}
          <div className="flex flex-col gap-6">
            {/* Future Metric 1: Symptoms Card */}
            <div className="glass-card p-6 bg-slate-800/30 border border-slate-700/30 rounded-2xl flex flex-col justify-between hover:border-slate-600/40 transition-all duration-300 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Symptoms</span>
                  <span className="text-xl">🤒</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  Symptom Diary
                </h3>
                <p className="text-sm text-slate-400">
                  Log symptoms like fatigue, nausea, or mood shifts to share with your healthcare provider.
                </p>
              </div>
              <button className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700/50 hover:border-slate-600 transition-all duration-300 cursor-not-allowed opacity-50">
                Log New Symptom
              </button>
            </div>

            {/* Future Metric 2: Weight Tracker */}
            <div className="glass-card p-6 bg-slate-800/30 border border-slate-700/30 rounded-2xl flex flex-col justify-between hover:border-slate-600/40 transition-all duration-300 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Weight & Health</span>
                  <span className="text-xl">⚖️</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                  Weight Logger
                </h3>
                <p className="text-sm text-slate-400">
                  Record weekly weight progress and monitor healthy target trends during pregnancy.
                </p>
              </div>
              <button className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700/50 hover:border-slate-600 transition-all duration-300 cursor-not-allowed opacity-50">
                Log Weight Entry
              </button>
            </div>

            {/* Caregivers panel */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-800 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Active Caregivers
              </h4>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 overflow-hidden">
                  {user ? (
                    user.photoURL ? (
                      <img src={user.photoURL} alt="" className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900" />
                    ) : (
                      <div className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-cyan-600 flex items-center justify-center text-xs font-bold text-white">
                        {(user.displayName || user.email || "C").charAt(0).toUpperCase()}
                      </div>
                    )
                  ) : (
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">G</div>
                  )}
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">P</div>
                </div>
                {user ? (
                  <span className="text-xs font-semibold text-slate-300">
                    {user.displayName || "You"} & Partner
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">
                    Guest Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Caregivers automatically receive real-time notifications on logging events.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-800/40 text-center text-xs text-slate-500 z-10">
        <p>&copy; {new Date().getFullYear()} Lumina Prenatal Suite. All rights reserved.</p>
      </footer>

      {/* Auth Modal Container */}
      <AuthModal dialogRef={authModalRef} />
    </div>
  );
}

