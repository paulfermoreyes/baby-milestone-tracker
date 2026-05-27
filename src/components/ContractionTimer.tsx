"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface ContractionLog {
  id: string;
  startTime: Date;
  duration: number; // in seconds
  interval?: number; // in seconds (time since start of previous contraction)
}

export default function ContractionTimer() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [timerVal, setTimerVal] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [logs, setLogs] = useState<ContractionLog[]>([]);
  const [isClient, setIsClient] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Sync with Firestore (or LocalStorage for Guests)
  useEffect(() => {
    if (!isClient) return;

    if (!user) {
      const localData = localStorage.getItem("lumina_guest_contractions");
      if (localData) {
        try {
          const parsed = JSON.parse(localData) as {
            id: string;
            startTimeStr: string;
            duration: number;
            interval?: number;
          }[];
          setLogs(
            parsed.map((item) => ({
              id: item.id,
              startTime: new Date(item.startTimeStr),
              duration: item.duration,
              interval: item.interval,
            }))
          );
        } catch (e) {
          console.error("Failed to parse guest contractions logs", e);
          setLogs([]);
        }
      } else {
        setLogs([]);
      }
      return;
    }

    const q = query(
      collection(db, "contractions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tempLogs: ContractionLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const startTime = data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date();
          tempLogs.push({
            id: doc.id,
            startTime,
            duration: Number(data.duration),
            interval: data.interval ? Number(data.interval) : undefined,
          });
        });
        // Sort oldest to newest for interval calculations in lists
        setLogs(tempLogs.reverse());
      },
      (err) => {
        console.error("Error reading contractions from Firestore:", err);
      }
    );

    return () => unsubscribe();
  }, [user, isClient]);

  // Active timer runner
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimerVal((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isActive]);

  const handleStartStop = async () => {
    if (!isActive) {
      // Start Timing
      setStartTime(new Date());
      setTimerVal(0);
      setIsActive(true);
    } else {
      // Stop Timing & Save
      setIsActive(false);
      const finishedStartTime = startTime || new Date();
      const finishedDuration = timerVal;

      // Calculate Interval (duration from the start of previous contraction to the start of this one)
      let intervalSec: number | undefined = undefined;
      if (logs.length > 0) {
        const lastStartTime = logs[logs.length - 1].startTime;
        intervalSec = Math.round((finishedStartTime.getTime() - lastStartTime.getTime()) / 1000);
      }

      if (!user) {
        // Simulate locally
        const simulatedId = Math.random().toString(36).substring(7);
        const newLog: ContractionLog = {
          id: simulatedId,
          startTime: finishedStartTime,
          duration: finishedDuration,
          interval: intervalSec,
        };
        const updated = [...logs, newLog];
        setLogs(updated);
        localStorage.setItem(
          "lumina_guest_contractions",
          JSON.stringify(
            updated.map((l) => ({
              id: l.id,
              startTimeStr: l.startTime.toISOString(),
              duration: l.duration,
              interval: l.interval,
            }))
          )
        );
        setStartTime(null);
        setTimerVal(0);
        return;
      }

      try {
        await addDoc(collection(db, "contractions"), {
          userId: user.uid,
          duration: finishedDuration,
          interval: intervalSec || null,
          createdAt: finishedStartTime, // store start time as primary index
        });
      } catch (err) {
        console.error("Failed to save contraction log:", err);
        alert("Failed to sync contraction log to the cloud.");
      } finally {
        setStartTime(null);
        setTimerVal(0);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      const updated = logs.filter((log) => log.id !== id);
      setLogs(updated);
      localStorage.setItem(
        "lumina_guest_contractions",
        JSON.stringify(
          updated.map((l) => ({
            id: l.id,
            startTimeStr: l.startTime.toISOString(),
            duration: l.duration,
            interval: l.interval,
          }))
        )
      );
      return;
    }

    try {
      await deleteDoc(doc(db, "contractions", id));
    } catch (err) {
      console.error("Failed to delete contraction:", err);
      alert("Failed to delete contraction record.");
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatInterval = (sec?: number) => {
    if (sec === undefined) return "--";
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Check 5-1-1 Rule matching parameters:
  // - Average interval between contractions is <= 5 mins (300 seconds) in the last hour.
  // - Average duration of contractions is >= 1 min (60 seconds).
  // - At least 3 contractions recorded to avoid single spike anomalies.
  const checkLaborAlert = () => {
    if (logs.length < 3) return false;
    const lastHour = 60 * 60 * 1000;
    const now = new Date().getTime();

    // Filter logs in the last hour
    const recentLogs = logs.filter((l) => now - l.startTime.getTime() < lastHour);
    if (recentLogs.length < 3) return false;

    const avgDuration = recentLogs.reduce((acc, l) => acc + l.duration, 0) / recentLogs.length;
    // Calculate intervals (excluding those that are undefined)
    const validIntervals = recentLogs.map((l) => l.interval).filter((v): v is number => v !== undefined);

    if (validIntervals.length === 0) return false;
    const avgInterval = validIntervals.reduce((acc, v) => acc + v, 0) / validIntervals.length;

    return avgInterval <= 300 && avgDuration >= 60;
  };

  const triggerAuthModal = () => {
    const dialog = document.querySelector("dialog.auth-dialog") as HTMLDialogElement;
    if (dialog) {
      dialog.showModal();
    }
  };

  return (
    <div className="glass-card p-6 bg-slate-800/30 border border-slate-700/30 rounded-2xl flex flex-col justify-between hover:border-slate-600/40 transition-all duration-300 group relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Labor / Timing</span>
          <span className="text-xl">⏱️</span>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-rose-400 transition-colors">
          Contraction Timer
        </h3>

        <p className="text-xs text-slate-400 mb-6 leading-normal">
          Log contraction cycles to identify true labor trends.
        </p>

        {/* Dynamic Labor Alert Message */}
        {checkLaborAlert() && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 animate-pulse flex items-start gap-2.5">
            <span className="text-sm">🚨</span>
            <div>
              <p className="font-extrabold mb-0.5">5-1-1 Labor Guideline Met!</p>
              <p className="text-[10px] text-slate-450 leading-normal font-medium">
                Contractions are averaging less than 5 minutes apart, lasting 1 minute, for over an hour. Consider contacting your OB-GYN or health provider immediately.
              </p>
            </div>
          </div>
        )}

        {/* Live Timer / Counter Button */}
        <div className="flex flex-col items-center gap-4 mb-8">
          {isActive ? (
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-rose-400 font-mono tracking-wider tabular-nums animate-pulse">
                {Math.floor(timerVal / 60)}:
                {String(timerVal % 60).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Recording Contraction</span>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-sm font-semibold text-slate-400">Ready to log</span>
            </div>
          )}

          <button
            onClick={handleStartStop}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
              isActive
                ? "bg-rose-500 text-slate-955 shadow-lg shadow-rose-500/20 hover:bg-rose-400"
                : "bg-slate-800 border border-slate-750 text-rose-400 hover:bg-slate-700/80"
            }`}
          >
            {isActive ? "🛑 Stop Contraction" : "⚡ Start Contraction"}
          </button>
        </div>

        {/* History table log */}
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2.5">Recent Timing Logs</span>
          {logs.length === 0 ? (
            <div className="text-center py-6 rounded-xl bg-slate-900/30 border border-slate-850/50 text-[11px] text-slate-500">
              No contractions logged yet.
            </div>
          ) : (
            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {logs.slice().reverse().map((log, index) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-900/40 border border-slate-850/50 flex flex-col gap-1 hover:border-slate-800 transition-all text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-300">
                    <span>Contraction #{logs.length - index}</span>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="text-slate-650 hover:text-red-400 transition-colors text-[10px] cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] mt-1 pt-1.5 border-t border-slate-950/20 text-slate-400">
                    <div>
                      <span className="text-slate-550 block text-[9px] uppercase font-bold">Duration</span>
                      <span className="font-extrabold text-slate-300">{formatDuration(log.duration)}</span>
                    </div>
                    <div>
                      <span className="text-slate-550 block text-[9px] uppercase font-bold">Interval (Since prev)</span>
                      <span className="font-extrabold text-slate-300">{formatInterval(log.interval)}</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-600 block self-end mt-1">
                    {log.startTime.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Guest Mode Indicator */}
      {!user && isClient && (
        <div className="mt-4 text-[10px] text-center text-amber-500/80 font-medium flex items-center justify-center gap-1">
          <span>⚠️ Guest Preview Session</span>
          <button onClick={triggerAuthModal} className="underline font-bold text-rose-400 hover:text-rose-300 transition-colors">
            Sync
          </button>
        </div>
      )}
    </div>
  );
}
