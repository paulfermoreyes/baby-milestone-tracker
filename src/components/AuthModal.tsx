"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth, UserRole } from "@/context/AuthContext";

interface AuthModalProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
}

export default function AuthModal({ dialogRef }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("wife");
  const [showPassword, setShowPassword] = useState(false);
  const [pregnancyWeek, setPregnancyWeek] = useState<number | "">("");
  const [partnerCode, setPartnerCode] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Clear states when modal toggles
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      setEmail("");
      setPassword("");
      setDisplayName("");
      setShowPassword(false);
      setError(null);
      setRole("wife");
      setPregnancyWeek("");
      setPartnerCode("");
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [dialogRef]);

  const handleCloseWithAnimation = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.classList.add("closing");
    // Wait for the scale-out & fade-out animation to complete (250ms in CSS)
    setTimeout(() => {
      dialog.close();
      dialog.classList.remove("closing");
    }, 240);
  }, [dialogRef]);

  // Fallback for light-dismiss on browsers that don't support `closedby="any"` natively yet (e.g. Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleLightDismiss = (event: MouseEvent) => {
      if (event.target !== dialog) return;

      const rect = dialog.getBoundingClientRect();
      const isInside = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );

      if (!isInside) {
        handleCloseWithAnimation();
      }
    };

    dialog.addEventListener("click", handleLightDismiss);
    return () => dialog.removeEventListener("click", handleLightDismiss);
  }, [dialogRef, handleCloseWithAnimation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

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
      handleCloseWithAnimation();
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
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      handleCloseWithAnimation();
    } catch (err: unknown) {
      console.error(err);
      const code = (err as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user") {
        setError(err instanceof Error ? err.message : "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="auth-dialog focus:outline-none"
      closedby="any"
      aria-labelledby="authModalTitle"
    >
      <div className="modal-content">
        {/* Close Button */}
        <button
          onClick={handleCloseWithAnimation}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Title */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 items-center justify-center mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Lumina Logo" className="w-full h-full object-contain" />
          </div>
          <h2 id="authModalTitle" className="text-2xl font-extrabold tracking-tight text-white">
            {isSignUp ? "Join Lumina Prenatal" : "Welcome Back"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp ? "Connect with caregivers and sync milestones" : "Access your caregiver dashboard"}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-950/45 p-1 rounded-xl border border-slate-800/40 mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              !isSignUp ? "bg-slate-800 text-rose-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              isSignUp ? "bg-slate-800 text-rose-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 flex items-start gap-2.5 animate-pulse">
            <span className="text-base mt-[-2px]">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {isSignUp && (
            <div className="space-y-1.5">
              <label htmlFor="name-input" className="text-xs font-bold text-slate-300">
                Full Name
              </label>
              <input
                id="name-input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Doe"
                className="auth-input"
                autoComplete="name"
                required
                disabled={loading}
              />
            </div>
          )}

          {isSignUp && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="week-input" className="text-xs font-bold text-slate-300">
                  Current Week
                </label>
                <input
                  id="week-input"
                  type="number"
                  min="1"
                  max="42"
                  value={pregnancyWeek}
                  onChange={(e) => setPregnancyWeek(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 12"
                  className="auth-input"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="partner-code-input" className="text-xs font-bold text-slate-300">
                  Partner Code <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  id="partner-code-input"
                  type="text"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  className="auth-input uppercase"
                  disabled={loading}
                  maxLength={6}
                />
              </div>
            </div>
          )}

          {/* Role Selector — shown only on Sign Up */}
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">I am the…</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("husband")}
                  disabled={loading}
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
                  disabled={loading}
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
            <label htmlFor="email-input" className="text-xs font-bold text-slate-300">
              Email Address
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="auth-input"
              autoComplete="username email"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password-input" className="text-xs font-bold text-slate-300">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input pr-12"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                disabled={loading}
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
            disabled={loading}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : null}
            {isSignUp ? "Create Free Account" : "Access Dashboard"}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800/80"></div>
          </div>
          <span className="relative bg-slate-900 px-3 text-[10px] uppercase font-bold tracking-widest text-slate-500">
            Or Sync With
          </span>
        </div>

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white font-bold text-xs border border-slate-800 hover:border-slate-700/80 transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer"
          disabled={loading}
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
    </dialog>
  );
}
