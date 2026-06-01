"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LinkSimple, Copy, Check, Warning, Users, ArrowsClockwise } from "@phosphor-icons/react";

interface PartnerInfo {
  displayName: string | null;
  role: string;
  photoURL: string | null;
}

export default function LinkPartnerPanel() {
  const { user, familyId, generateInviteCode, redeemInviteCode, refreshProfile } = useAuth();

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0); // seconds remaining
  const [enterCode, setEnterCode] = useState("");
  const [mode, setMode] = useState<"idle" | "generate" | "enter">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [partnerLoading, setPartnerLoading] = useState(false);

  // Load partner info when linked
  useEffect(() => {
    const loadPartner = async () => {
      if (!familyId || !user) {
        setPartnerInfo(null);
        return;
      }

      setPartnerLoading(true);
      try {
        const familySnap = await getDoc(doc(db, "families", familyId));
        if (!familySnap.exists()) return;
        const members: string[] = familySnap.data().members ?? [];
        const partnerUid = members.find((uid) => uid !== user.uid);
        if (!partnerUid) return;

        const partnerSnap = await getDoc(doc(db, "users", partnerUid));
        if (!partnerSnap.exists()) return;
        const d = partnerSnap.data();
        setPartnerInfo({
          displayName: d.displayName ?? null,
          role: d.role ?? "partner",
          photoURL: d.photoURL ?? null,
        });
      } catch (e) {
        console.error("Failed to load partner info:", e);
      } finally {
        setPartnerLoading(false);
      }
    };

    loadPartner();
  }, [familyId, user]);

  // Countdown timer for generated code
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const code = await generateInviteCode();
      setGeneratedCode(code);
      setCountdown(24 * 60 * 60); // 24 hours in seconds
      setMode("generate");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate code.");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!enterCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await redeemInviteCode(enterCode);
      await refreshProfile();
      setEnterCode("");
      setMode("idle");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to redeem code.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const roleLabel = (r: string) =>
    r === "husband" ? "👨 Husband" : r === "wife" ? "👩 Wife" : "🤝 Partner";

  // ── Linked State ──────────────────────────────────────────────────────────
  if (familyId) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850/80 flex flex-col gap-3 text-slate-200">
        <h4 className="text-sm font-bold flex items-center gap-2 text-slate-100">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Active Caregivers
        </h4>

        {partnerLoading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ArrowsClockwise size={14} className="animate-spin" /> Loading partner…
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {/* Current user avatar */}
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900" />
              ) : (
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-cyan-600 flex items-center justify-center text-xs font-bold text-white">
                  {(user?.displayName || user?.email || "C").charAt(0).toUpperCase()}
                </div>
              )}
              {/* Partner avatar */}
              {partnerInfo ? (
                partnerInfo.photoURL ? (
                  <img src={partnerInfo.photoURL} alt="" className="inline-block h-8 w-8 bg-white rounded-full ring-2 ring-slate-900" />
                ) : (
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {(partnerInfo.displayName || "P").charAt(0).toUpperCase()}
                  </div>
                )
              ) : (
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">?</div>
              )}
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-100 block">
                {user?.displayName || "You"} & {partnerInfo?.displayName || "Partner"}
              </span>
              {partnerInfo && (
                <span className="text-[10px] text-slate-400">{roleLabel(partnerInfo.role)}</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Check size={14} weight="bold" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Couple dashboard linked</span>
        </div>

        {/* Allow re-generating a code even when linked (e.g. link was reset) */}
        {mode === "generate" && generatedCode ? (
          <div className="mt-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">New Invite Code</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-[0.25em] text-slate-100 font-mono">{generatedCode}</span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors cursor-pointer"
                title="Copy code"
              >
                {copied ? <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
            {countdown > 0 && (
              <span className="text-[9px] text-slate-400">Expires in {formatCountdown(countdown)}</span>
            )}
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="text-[10px] font-semibold text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors cursor-pointer text-left"
          >
            {loading ? "Generating…" : "Generate new invite code"}
          </button>
        )}

        {error && (
          <p className="text-[10px] text-red-500 dark:text-red-400 font-semibold flex items-center gap-1">
            <Warning size={12} /> {error}
          </p>
        )}
      </div>
    );
  }

  // ── Unlinked State ────────────────────────────────────────────────────────
  return (
    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850/80 flex flex-col gap-3 text-slate-200">
      <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
        <LinkSimple size={16} weight="bold" className="text-indigo-600 dark:text-indigo-400" />
        Link Your Partner
      </h4>
      <p className="text-xs text-slate-400 leading-relaxed">
        Connect with your partner so you both share the same live dashboard.
      </p>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-500 dark:text-red-400 flex items-start gap-2">
          <Warning size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {mode === "idle" && (
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => { setMode("generate"); setError(null); }}
            className="py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/25 hover:border-indigo-300 dark:hover:bg-indigo-500/40 text-indigo-650 dark:text-indigo-300 font-bold text-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <Users size={14} weight="bold" />
            Generate Invite Code
          </button>
          <button
            onClick={() => { setMode("enter"); setError(null); }}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-200 font-bold text-xs border border-slate-750 hover:border-slate-700 transition-all cursor-pointer flex items-center gap-2"
          >
            <LinkSimple size={14} weight="bold" />
            Enter Partner&apos;s Code
          </button>
        </div>
      )}

      {mode === "generate" && (
        <div className="flex flex-col gap-3">
          {!generatedCode ? (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white dark:text-slate-950 font-extrabold text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? <span className="w-3.5 h-3.5 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" /> : <Users size={14} weight="bold" />}
              {loading ? "Generating…" : "Generate Code"}
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/20 flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Share this code with your partner</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black tracking-[0.3em] text-slate-100 font-mono">{generatedCode}</span>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                >
                  {copied ? <Check size={14} className="text-emerald-650 dark:text-emerald-400" /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              {countdown > 0 && (
                <span className="text-[9px] text-amber-600 dark:text-amber-500/80 font-medium">⏱ Expires in {formatCountdown(countdown)}</span>
              )}
            </div>
          )}

          <button
            onClick={() => { setMode("idle"); setGeneratedCode(null); setError(null); }}
            className="text-[10px] text-slate-400 hover:text-slate-200 underline underline-offset-2 cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {mode === "enter" && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={enterCode}
              onChange={(e) => setEnterCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              maxLength={6}
              className="flex-1 px-3 py-2.5 bg-slate-950/60 border border-slate-850 rounded-xl text-sm font-mono font-bold text-slate-100 outline-none focus:border-cyan-500 tracking-[0.2em] uppercase placeholder:tracking-normal placeholder:font-sans placeholder:font-normal placeholder:text-slate-400"
            />
            <button
              onClick={handleRedeem}
              disabled={loading || enterCode.length < 6}
              className="px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-extrabold text-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              {loading ? <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin block" /> : "Link"}
            </button>
          </div>
          <button
            onClick={() => { setMode("idle"); setError(null); }}
            className="text-[10px] text-slate-400 hover:text-slate-200 underline underline-offset-2 cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
