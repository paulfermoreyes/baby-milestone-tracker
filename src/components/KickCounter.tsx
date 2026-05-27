"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Warning, Footprints, ArrowCounterClockwise } from "@phosphor-icons/react";

export default function KickCounter() {
  const { user } = useAuth();
  // Store kick records
  const [sessionKicks, setSessionKicks] = useState<{ id: string; timestamp: Date }[]>([]);

  // Synchronize with Firestore real-time snapshots if authenticated
  useEffect(() => {
    if (!user) {
      // Clear cloud kicks when logged out
      setSessionKicks([]);
      return;
    }

    const q = query(
      collection(db, "kicks"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const kicks: { id: string; timestamp: Date }[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.createdAt ? data.createdAt.toDate() : new Date();
        kicks.push({ id: doc.id, timestamp });
      });
      // Store in oldest-to-newest order in state so slice().reverse() yields newest-to-oldest in list
      setSessionKicks(kicks.reverse());
    }, (err) => {
      console.error("Error reading kicks from Firestore:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const handleKick = async () => {
    if (!user) {
      // Simulate locally in preview mode
      const simulatedId = Math.random().toString(36).substring(7);
      setSessionKicks((prev) => [...prev, { id: simulatedId, timestamp: new Date() }]);
      return;
    }

    try {
      await addDoc(collection(db, "kicks"), {
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save kick to the cloud.");
    }
  };

  const handleUndo = async () => {
    if (sessionKicks.length === 0) return;
    const lastKick = sessionKicks[sessionKicks.length - 1];

    if (!user) {
      // Simulating local undo in preview mode
      setSessionKicks((prev) => prev.slice(0, -1));
      return;
    }

    try {
      await deleteDoc(doc(db, "kicks", lastKick.id));
      // State will be automatically updated by onSnapshot
    } catch (err) {
      console.error(err);
      alert("Failed to delete kick record.");
    }
  };

  const triggerAuthModal = () => {
    const dialog = document.querySelector("dialog.auth-dialog") as HTMLDialogElement;
    if (dialog) {
      dialog.showModal();
    }
  };

  return (
    <div className="glass-card p-8 bg-slate-800/40 border border-slate-700/30 rounded-3xl relative overflow-hidden backdrop-blur-xl">
      {/* Decorative inner light beam */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Guest Preview Warning Banner */}
      {!user && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-xs font-semibold text-amber-400 flex flex-col sm:flex-row items-center sm:justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2">
            <Warning size={16} weight="bold" className="text-amber-400 shrink-0" />
            <span>Guest Mode: Kicks are simulated and will reset.</span>
          </div>
          <button
            onClick={triggerAuthModal}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all cursor-pointer text-center"
          >
            Sign In to Sync
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-800/60">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
            {user ? "Cloud Synced Session" : "Guest Preview Session"}
          </span>
          <h2 className="text-2xl font-black text-white mt-1">Fetal Kick Counter</h2>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            {sessionKicks.length}
          </span>
          <span className="text-sm font-semibold text-slate-400">Kicks Logged</span>
        </div>
      </div>

      {/* Main Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={handleKick}
          className="relative py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-extrabold text-lg shadow-lg shadow-cyan-500/15 hover:shadow-cyan-400/20 active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
        >
          <Footprints size={24} weight="bold" />
          <span>Record a Kick</span>
        </button>
        <button
          onClick={handleUndo}
          disabled={sessionKicks.length === 0}
          className="py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:text-slate-650 font-bold text-lg border border-slate-750 disabled:border-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowCounterClockwise size={24} weight="bold" />
          <span>Undo Last</span>
        </button>
      </div>

      {/* Interactive Log of Kicks */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>Session Log</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        </h3>

        {sessionKicks.length === 0 ? (
          <div className="text-center py-8 rounded-2xl bg-slate-900/40 border border-slate-850 text-slate-500 text-sm">
            No kicks recorded in this session yet. Press "Record a Kick" to begin.
          </div>
        ) : (
          <div className="max-h-[160px] overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {sessionKicks.slice().reverse().map((kick, index) => (
              <div
                key={kick.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-850 hover:border-slate-800/80 transition-all duration-150"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-sm font-bold text-slate-300">
                    Kick #{sessionKicks.length - index}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {kick.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

