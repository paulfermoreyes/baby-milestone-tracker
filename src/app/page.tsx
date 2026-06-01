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
import { useAuth, UserRole } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Footprints, Timer, Drop, ThermometerHot, Scales, Sun, Moon, Users, ChatCircleText, Warning } from "@phosphor-icons/react";

export default function Home() {
  const { user, userProfile, logout, loading, signUpWithEmail, signInWithEmail, signInWithGoogle, updateProfileData } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const authModalRef = useRef<HTMLDialogElement | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const [showMissingInfoModal, setShowMissingInfoModal] = useState(false);
  const [expectedLaborDate, setExpectedLaborDate] = useState("");

  // Landing page interactive form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("wife");
  const [showPassword, setShowPassword] = useState(false);
  const [pregnancyWeek, setPregnancyWeek] = useState<number | "">("");
  const [partnerCode, setPartnerCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          throw new Error("Please enter your full name.");
        }
        if (pregnancyWeek === "" || pregnancyWeek < 1 || pregnancyWeek > 42) {
          throw new Error("Please enter a valid pregnancy week (1-42).");
        }
        await signUpWithEmail(email, password, displayName, role, partnerCode.trim(), Number(pregnancyWeek));
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: unknown) {
      console.error(err);
      let friendlyMessage = err instanceof Error ? err.message : "An authentication error occurred.";
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        friendlyMessage = "Invalid email or password. Please try again.";
      } else if (code === "auth/email-already-in-use") {
        friendlyMessage = "This email is already in use. Try signing in instead.";
      } else if (code === "auth/weak-password") {
        friendlyMessage = "Password must be at least 6 characters long.";
      } else if (code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      }
      setFormError(friendlyMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleFormSignIn = async () => {
    setFormError(null);
    setFormLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      console.error(err);
      const code = (err as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user") {
        setFormError(err instanceof Error ? err.message : "Failed to sign in with Google.");
      }
    } finally {
      setFormLoading(false);
    }
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

  if (loading) {
    const isDarkTheme = theme === "dark";
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-sans relative overflow-hidden ${
        isDarkTheme ? "bg-slate-900 text-slate-100" : "bg-[#f8f7f4] text-slate-800"
      }`}>
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-16 h-16 animate-bounce">
            <img src="/logo.svg" alt="Lumina Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400 bg-clip-text text-transparent animate-pulse">
            Lumina
          </h1>
          <div className={`w-8 h-8 rounded-full border-4 border-t-rose-500 animate-spin ${
            isDarkTheme ? "border-slate-800" : "border-slate-200"
          }`} />
        </div>
      </div>
    );
  }

  if (!user) {
    const isDarkTheme = theme === "dark";
    return (
      <div className={`min-h-screen flex flex-col font-sans relative overflow-hidden pb-12 ${
        isDarkTheme
          ? "bg-slate-900 text-slate-100 selection:bg-rose-500 selection:text-slate-900"
          : "bg-[#f8f7f4] text-slate-800 selection:bg-rose-500 selection:text-white"
      }`}>
        {/* Decorative background glow elements */}
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${
          isDarkTheme ? "bg-rose-950/25" : "bg-rose-200/30"
        }`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${
          isDarkTheme ? "bg-amber-950/20" : "bg-amber-200/20"
        }`} />

        {/* Header */}
        <header className="w-full backdrop-blur-sm border-b border-slate-850/60 relative z-30">
          <div className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo.svg" alt="Lumina Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                  Lumina
                </h1>
                <p className={`text-[10px] uppercase tracking-widest font-semibold ${
                  isDarkTheme ? "text-slate-400" : "text-slate-500"
                }`}>
                  Prenatal Suite
                </p>
              </div>
            </div>

            {/* Theme Toggle only */}
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label={`Switch to ${isDarkTheme ? "light" : "dark"} mode`}
              title={`Switch to ${isDarkTheme ? "light" : "dark"} mode`}
            >
              <span className="toggle-thumb">
                {isDarkTheme ? (
                  <Moon size={12} weight="fill" className="text-white" />
                ) : (
                  <Sun size={12} weight="fill" className="text-white" />
                )}
              </span>
            </button>
          </div>
        </header>

        {/* Onboarding Main Content Grid */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Welcome & Purpose Cards (Col Span 7) */}
          <div className="lg:col-span-7 flex flex-col gap-8 text-center lg:text-left">
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                isDarkTheme ? "bg-rose-500/10 text-rose-400" : "bg-rose-500/10 text-rose-600"
              }`}>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Real-Time Caregiver Syncing
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mt-4 mb-6 leading-tight">
                Simplify Your <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">Prenatal Journey</span>
              </h2>
              <p className={`text-sm md:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 ${
                isDarkTheme ? "text-slate-400" : "text-slate-600"
              }`}>
                Collaborative prenatal health tracking, real-time caregiver sync, and instant AI guidance designed to support your pregnancy milestones and connect parents.
              </p>
            </div>

            {/* Feature Cards Stack */}
            <div className="flex flex-col gap-5 max-w-xl mx-auto lg:mx-0">
              {/* Feature 1 */}
              <div className="glass-card p-5 bg-slate-800/30 border border-slate-700/30 rounded-2xl flex gap-4 text-left transition-all duration-300 hover:scale-[1.01]">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <ThermometerHot size={20} weight="bold" className="text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">Symptom Logging & Weight Trends</h4>
                  <p className={`text-xs leading-relaxed ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                    Log daily symptoms, track physical changes, and maintain a detailed weight log with visual metrics to share with your healthcare provider.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="glass-card p-5 bg-slate-800/30 border border-slate-700/30 rounded-2xl flex gap-4 text-left transition-all duration-300 hover:scale-[1.01]">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <Footprints size={20} weight="bold" className="text-rose-400" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">Fetal Activity & Contraction Vitals</h4>
                  <p className={`text-xs leading-relaxed ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                    Count baby's daily kicks for fetal safety, track contraction frequency using our precise timing tool, and monitor vital signs like blood sugar levels.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="glass-card p-5 bg-slate-800/30 border border-slate-700/30 rounded-2xl flex gap-4 text-left transition-all duration-300 hover:scale-[1.01]">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Users size={20} weight="bold" className="text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">Caregiver Syncing & AI Assistance</h4>
                  <p className={`text-xs leading-relaxed ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                    Link dashboards with your spouse to sync milestones and logs in real-time. Chat with our dedicated AI prenatal companion for instant, secure advice.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Embedded Interactive Onboarding Card (Col Span 5) */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto relative z-20">
            <div className="glass-card p-8 bg-slate-850/40 border border-slate-700/40 rounded-3xl shadow-2xl relative overflow-hidden text-left">
              {/* Card background glowing dots */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Card Header Title */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-extrabold tracking-tight text-white">
                  {isSignUp ? "Join Lumina" : "Welcome Back"}
                </h3>
                <p className={`text-xs mt-1 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                  {isSignUp ? "Connect with caregivers and sync milestones" : "Access your caregiver dashboard"}
                </p>
              </div>

              {/* Tab Toggle */}
              <div className="flex bg-slate-950/45 p-1 rounded-xl border border-slate-800/40 mb-6">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setFormError(null); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    !isSignUp ? "bg-slate-800 text-rose-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setFormError(null); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isSignUp ? "bg-slate-800 text-rose-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Register
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 flex items-start gap-2.5 animate-pulse">
                  <span className="text-base mt-[-2px]">⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
                {isSignUp && (
                  <div className="space-y-1.5">
                    <label htmlFor="name-input-form" className={`text-xs font-bold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                      Full Name
                    </label>
                    <input
                      id="name-input-form"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Jane Doe"
                      className="auth-input"
                      autoComplete="name"
                      required
                      disabled={formLoading}
                    />
                  </div>
                )}

                {isSignUp && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="week-input-form" className={`text-xs font-bold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                        Current Week
                      </label>
                      <input
                        id="week-input-form"
                        type="number"
                        min="1"
                        max="42"
                        value={pregnancyWeek}
                        onChange={(e) => setPregnancyWeek(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 12"
                        className="auth-input"
                        required
                        disabled={formLoading}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="partner-code-input-form" className={`text-xs font-bold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                        Partner Code <span className="text-slate-500 font-normal">(opt)</span>
                      </label>
                      <input
                        id="partner-code-input-form"
                        type="text"
                        value={partnerCode}
                        onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                        placeholder="CODE"
                        className="auth-input uppercase"
                        disabled={formLoading}
                        maxLength={6}
                      />
                    </div>
                  </div>
                )}

                {/* Role Selector — shown only on Sign Up */}
                {isSignUp && (
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>I am the…</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole("husband")}
                        disabled={formLoading}
                        className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all duration-150 cursor-pointer flex flex-col items-center gap-1.5 ${
                          role === "husband"
                            ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-300 shadow-sm shadow-indigo-500/10"
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                        }`}
                      >
                        <span className="text-xl">👨</span>
                        <span>Husband</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("wife")}
                        disabled={formLoading}
                        className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all duration-150 cursor-pointer flex flex-col items-center gap-1.5 ${
                          role === "wife"
                            ? "bg-pink-500/15 border-pink-500/50 text-pink-300 shadow-sm shadow-pink-500/10"
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                        }`}
                      >
                        <span className="text-xl">👩</span>
                        <span>Wife</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="email-input-form" className={`text-xs font-bold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                    Email Address
                  </label>
                  <input
                    id="email-input-form"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="auth-input"
                    autoComplete="username email"
                    required
                    disabled={formLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password-input-form" className={`text-xs font-bold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="password-input-form"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="auth-input pr-12"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      required
                      minLength={6}
                      disabled={formLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                      disabled={formLoading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-extrabold text-sm shadow-md shadow-rose-500/10 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                  disabled={formLoading}
                >
                  {formLoading && (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  )}
                  {isSignUp ? "Create Free Account" : "Access Dashboard"}
                </button>
              </form>

              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800/80"></div>
                </div>
                <span className={`relative px-3 text-[10px] uppercase font-bold tracking-widest text-slate-500 ${
                  isDarkTheme ? "bg-slate-900" : "bg-white"
                }`}>
                  Or Sync With
                </span>
              </div>

              {/* Google Sign-in */}
              <button
                type="button"
                onClick={handleGoogleFormSignIn}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs border transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer ${
                  isDarkTheme
                    ? "bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white border-slate-800 hover:border-slate-700/80"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-750 hover:text-slate-950 border-slate-350 hover:border-slate-400"
                }`}
                disabled={formLoading}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className={`w-full max-w-7xl mx-auto px-6 py-8 border-t text-center text-xs z-5 ${
          isDarkTheme ? "border-slate-800/40 text-slate-500" : "border-slate-200/40 text-slate-400"
        }`}>
          <p>&copy; {new Date().getFullYear()} Lumina Prenatal Suite. All rights reserved.</p>
        </footer>
      </div>
    );
  }

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
      <header className={`w-full backdrop-blur-sm border-b border-slate-850/60 relative transition-all ${isProfileDropdownOpen ? "z-[110]" : "z-30"
        }`}>
        <div className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.svg" alt="Lumina Logo" className="w-full h-full object-contain" />
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
                      <div className="absolute right-0 mt-2 w-80 rounded-2xl p-5 bg-slate-950 border border-slate-850/80 z-50 shadow-2xl flex flex-col gap-4 animate-modal-scale-in text-slate-200">

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
                            <span className="text-xs font-extrabold block truncate text-slate-100">
                              {user.displayName || "Caregiver"}

                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {user.email}
                            </span>

                            {/* Role badge */}
                            {userProfile?.role && (
                              <div className={`mt-1 px-2.5 rounded-full text-xs ${roleBadge.classes}`}>
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
                            className="w-full py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center bg-rose-200 dark:bg-slate-850 hover:bg-rose-300/80 dark:hover:bg-slate-800 text-red-800 dark:text-red-400"
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
