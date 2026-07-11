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
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Drop, Warning } from "@phosphor-icons/react";

interface MilkLog {
  id: string;
  timestamp: Date;
}

export default function MilkCounter() {
  const { user, familyId } = useAuth();
  const [milkLogs, setMilkLogs] = useState<MilkLog[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  // Sync with Firestore or LocalStorage
  useEffect(() => {
    if (!isClient) return;

    if (!user) {
      const localData = localStorage.getItem("lumina_guest_milk");
      if (localData) {
        try {
          const parsed = JSON.parse(localData) as { id: string; timestampStr: string }[];
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setMilkLogs(parsed.map((item) => ({ id: item.id, timestamp: new Date(item.timestampStr) })));
        } catch (e) {
          console.error("Failed to parse guest milk logs", e);
          setMilkLogs([]);
        }
      } else {
        setMilkLogs([]);
      }
      return;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let q;
    if (familyId) {
      q = query(
        collection(db, "families", familyId, "milk"),
        where("createdAt", ">=", startOfDay),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "milk"),
        where("userId", "==", user.uid),
        where("createdAt", ">=", startOfDay),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs: MilkLog[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const timestamp = data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date();
          logs.push({ id: d.id, timestamp });
        });
        setMilkLogs(logs.reverse());
      },
      (err) => {
        console.error("Error reading milk logs from Firestore:", err);
      }
    );

    return () => unsubscribe();
  }, [user, familyId, isClient]);

  const handleRecordMilk = async () => {
    if (!user) {
      const simulatedId = Math.random().toString(36).substring(7);
      const newLog: MilkLog = { id: simulatedId, timestamp: new Date() };
      const updated = [...milkLogs, newLog];
      setMilkLogs(updated);
      localStorage.setItem(
        "lumina_guest_milk",
        JSON.stringify(updated.map((l) => ({ id: l.id, timestampStr: l.timestamp.toISOString() })))
      );
      return;
    }

    try {
      if (familyId) {
        await addDoc(collection(db, "families", familyId, "milk"), {
          loggedBy: user.uid,
          createdAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "milk"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save milk log to the cloud.");
    }
  };

  const handleUndoMilk = async () => {
    if (milkLogs.length === 0) return;
    const lastLog = milkLogs[milkLogs.length - 1];

    if (!user) {
      const updated = milkLogs.slice(0, -1);
      setMilkLogs(updated);
      localStorage.setItem(
        "lumina_guest_milk",
        JSON.stringify(updated.map((l) => ({ id: l.id, timestampStr: l.timestamp.toISOString() })))
      );
      return;
    }

    try {
      if (familyId) {
        await deleteDoc(doc(db, "families", familyId, "milk", lastLog.id));
      } else {
        await deleteDoc(doc(db, "milk", lastLog.id));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete last milk log.");
    }
  };

  const triggerAuthModal = () => {
    const dialog = document.querySelector("dialog.auth-dialog") as HTMLDialogElement;
    if (dialog) dialog.showModal();
  };

  const targetGoal = 2;
  const count = milkLogs.length;
  const progressPercent = Math.min((count / targetGoal) * 100, 100);
  const isGoalMet = count >= targetGoal;

  let statusMessage = "Take at least 2x milk servings a day for fetal bone health.";
  if (count === 1) statusMessage = "1 serving down, 1 more to complete your daily goal!";
  else if (count >= 2) statusMessage = "Daily calcium target met! Amazing job!";

  return (
    <div className="glass-card p-6 bg-slate-800/30 border border-slate-700/30 rounded-2xl flex flex-col justify-between hover:border-slate-600/40 transition-all duration-300 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Hydration & Nutrients</span>
          <Drop size={20} weight="bold" className="text-sky-400" />
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors">
            Milk Counter
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-sky-400">{count}</span>
            <span className="text-xs text-slate-500 font-bold">/ {targetGoal} cups</span>
          </div>
        </div>

        {user && familyId && (
          <p className="text-[10px] text-indigo-400 font-semibold mb-1">Shared with partner</p>
        )}

        <p className="text-xs text-slate-400 mb-5 leading-normal">
          {statusMessage}
        </p>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-900/60 overflow-hidden mb-6 border border-slate-800">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${
              isGoalMet ? "from-sky-400 to-indigo-500 shadow-lg shadow-sky-500/25" : "from-sky-500 to-sky-400"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* History Log */}
        {count > 0 && (
          <div className="mb-6">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">Today&apos;s Servings</span>
            <div className="max-h-[88px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {milkLogs.slice().reverse().map((log, index) => (
                <div key={log.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/40 border border-slate-850/50 text-[11px]">
                  <span className="text-slate-300 font-medium">Cup #{count - index}</span>
                  <span className="text-slate-500">
                    {log.timestamp.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <button
          onClick={handleRecordMilk}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 text-xs font-bold border border-transparent shadow-md shadow-sky-950/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Drop size={16} weight="fill" />
          <span>Log Milk Serving</span>
        </button>

        {count > 0 && (
          <button
            onClick={handleUndoMilk}
            className="w-full py-2 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 text-[11px] font-semibold border border-slate-750 active:scale-[0.98] transition-all cursor-pointer text-center"
          >
            Undo Last
          </button>
        )}
      </div>

      {!user && isClient && (
        <div className="mt-3 text-[10px] text-center text-amber-500/80 font-medium flex items-center justify-center gap-1.5">
          <Warning size={14} weight="bold" className="text-amber-500 shrink-0" />
          <span>Guest Preview Session</span>
          <button onClick={triggerAuthModal} className="underline font-bold text-sky-400 hover:text-sky-300 transition-colors">
            Sync
          </button>
        </div>
      )}
    </div>
  );
}
