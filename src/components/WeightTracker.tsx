"use client";

import { useState, useEffect } from "react";
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
import { Scales, Warning, Trash } from "@phosphor-icons/react";

interface WeightLog {
  id: string;
  weight: number;
  date: string;
  timestamp: Date;
}

export default function WeightTracker() {
  const { user, familyId } = useAuth();
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [weightInput, setWeightInput] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  // Sync with Firestore (or LocalStorage for Guests)
  useEffect(() => {
    if (!isClient) return;

    if (!user) {
      const localData = localStorage.getItem("lumina_guest_weight");
      if (localData) {
        try {
          const parsed = JSON.parse(localData) as {
            id: string;
            weight: number;
            date: string;
            timestampStr: string;
          }[];
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setWeightLogs(
            parsed.map((item) => ({
              ...item,
              timestamp: new Date(item.timestampStr),
            }))
          );
        } catch (e) {
          console.error("Failed to parse guest weight logs", e);
          setWeightLogs([]);
        }
      } else {
        setWeightLogs([]);
      }
      return;
    }

    let q;
    if (familyId) {
      q = query(
        collection(db, "families", familyId, "weight"),
        orderBy("createdAt", "desc"),
        limit(10)
      );
    } else {
      q = query(
        collection(db, "weight"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(10)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs: WeightLog[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const timestamp = data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date();
          const dateStr = data.date || timestamp.toLocaleDateString(undefined, { month: "short", day: "numeric" });
          logs.push({
            id: d.id,
            weight: Number(data.weight),
            date: dateStr,
            timestamp,
          });
        });
        setWeightLogs(logs.reverse());
      },
      (err) => {
        console.error("Error reading weight logs from Firestore:", err);
      }
    );

    return () => unsubscribe();
  }, [user, familyId, isClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightVal = parseFloat(weightInput);
    if (isNaN(weightVal) || weightVal <= 0) return;

    setLoading(true);

    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, { month: "short", day: "numeric" });

    if (!user) {
      const simulatedId = Math.random().toString(36).substring(7);
      const newLog: WeightLog = {
        id: simulatedId,
        weight: weightVal,
        date: dateStr,
        timestamp: now,
      };
      const updated = [...weightLogs, newLog];
      setWeightLogs(updated);
      localStorage.setItem(
        "lumina_guest_weight",
        JSON.stringify(
          updated.map((l) => ({
            ...l,
            timestampStr: l.timestamp.toISOString(),
          }))
        )
      );
      setWeightInput("");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        weight: weightVal,
        date: dateStr,
        loggedBy: user.uid,
        createdAt: serverTimestamp(),
      };
      if (familyId) {
        await addDoc(collection(db, "families", familyId, "weight"), payload);
      } else {
        await addDoc(collection(db, "weight"), { ...payload, userId: user.uid });
      }
      setWeightInput("");
    } catch (err) {
      console.error("Failed to save weight log:", err);
      alert("Failed to sync weight log to the cloud.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      const updated = weightLogs.filter((log) => log.id !== id);
      setWeightLogs(updated);
      localStorage.setItem(
        "lumina_guest_weight",
        JSON.stringify(
          updated.map((l) => ({
            ...l,
            timestampStr: l.timestamp.toISOString(),
          }))
        )
      );
      return;
    }

    try {
      if (familyId) {
        await deleteDoc(doc(db, "families", familyId, "weight", id));
      } else {
        await deleteDoc(doc(db, "weight", id));
      }
    } catch (err) {
      console.error("Failed to delete weight log:", err);
      alert("Failed to delete weight record.");
    }
  };

  const triggerAuthModal = () => {
    const dialog = document.querySelector("dialog.auth-dialog") as HTMLDialogElement;
    if (dialog) dialog.showModal();
  };

  const renderSparkline = () => {
    if (weightLogs.length < 2) return null;

    const width = 240;
    const height = 64;
    const padding = 10;

    const weights = weightLogs.map((log) => log.weight);
    const minWeight = Math.min(...weights) - 0.5;
    const maxWeight = Math.max(...weights) + 0.5;
    const weightRange = maxWeight - minWeight || 1;

    const points = weightLogs
      .map((log, index) => {
        const x = padding + (index / (weightLogs.length - 1)) * (width - padding * 2);
        const y = height - padding - ((log.weight - minWeight) / weightRange) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div className="w-full bg-slate-900/40 border border-slate-850/50 rounded-xl p-3 flex flex-col items-center">
        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-2 self-start">Weight Trendline</span>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <polygon
            points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
            fill="url(#weightGrad)"
          />
          <polyline
            fill="none"
            stroke="#818cf8"
            strokeWidth="2"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {weightLogs.map((log, index) => {
            const x = padding + (index / (weightLogs.length - 1)) * (width - padding * 2);
            const y = height - padding - ((log.weight - minWeight) / weightRange) * (height - padding * 2);
            return (
              <g key={log.id} className="group/node">
                <circle cx={x} cy={y} r="3.5" className="fill-indigo-500 stroke-slate-900 stroke-2 hover:r-5 transition-all" />
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const getLatestWeightDiff = () => {
    if (weightLogs.length < 2) return null;
    const diff = weightLogs[weightLogs.length - 1].weight - weightLogs[weightLogs.length - 2].weight;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${diff.toFixed(1)} kg`;
  };

  return (
    <div className="glass-card p-6 bg-slate-800/30 border border-slate-700/30 rounded-2xl flex flex-col justify-between hover:border-slate-600/40 transition-all duration-300 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Weight & Health</span>
          <Scales size={20} weight="bold" className="text-indigo-400" />
        </div>

        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
            Weight Logger
          </h3>
          {weightLogs.length > 0 && (
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-400">
                {weightLogs[weightLogs.length - 1].weight} <span className="text-xs text-slate-500 font-bold">kg</span>
              </span>
              {getLatestWeightDiff() && (
                <span className="text-[10px] block font-bold text-slate-500">
                  {getLatestWeightDiff()} vs last week
                </span>
              )}
            </div>
          )}
        </div>

        {user && familyId && (
          <p className="text-[10px] text-indigo-400 font-semibold mb-3">Shared with partner</p>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="number"
            step="0.1"
            min="30"
            max="200"
            placeholder="Weight (kg)"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-slate-900/60 border border-slate-850 rounded-xl text-xs text-white outline-none focus:border-indigo-500 h-10"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-400 hover:to-cyan-500 text-slate-950 text-xs font-bold border border-transparent shadow-md active:scale-[0.98] transition-all cursor-pointer h-10 flex items-center justify-center"
          >
            {loading ? "Saving" : "Log"}
          </button>
        </form>

        {weightLogs.length >= 2 && <div className="mb-6">{renderSparkline()}</div>}

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2.5">Historical Progress</span>
          {weightLogs.length === 0 ? (
            <div className="text-center py-6 rounded-xl bg-slate-900/30 border border-slate-850/50 text-[11px] text-slate-500">
              No weight logs recorded yet.
            </div>
          ) : (
            <div className="max-h-[110px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {weightLogs.slice().reverse().map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-900/40 border border-slate-850/50 text-xs"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-extrabold text-slate-200">{log.weight} kg</span>
                    <span className="text-[9px] text-slate-500">{log.date}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="text-slate-650 hover:text-red-400 transition-colors cursor-pointer flex items-center justify-center"
                    title="Delete record"
                  >
                    <Trash size={14} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!user && isClient && (
        <div className="mt-4 text-[10px] text-center text-amber-500/80 font-medium flex items-center justify-center gap-1.5">
          <Warning size={14} weight="bold" className="text-amber-500 shrink-0" />
          <span>Guest Preview Session</span>
          <button onClick={triggerAuthModal} className="underline font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
            Sync
          </button>
        </div>
      )}
    </div>
  );
}
