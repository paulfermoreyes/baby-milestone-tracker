"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function KickCounter() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  // Store added kick doc IDs and dates to enable local interactive list & undo
  const [sessionKicks, setSessionKicks] = useState<{ id: string; timestamp: Date }[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleKick = async () => {
    // If not logged in, simulate/allow for preview or alert
    if (!user) {
      alert("Please configure your .env.local and sign in to save. Simulating local save for preview!");
      const simulatedId = Math.random().toString(36).substring(7);
      setSessionKicks((prev) => [...prev, { id: simulatedId, timestamp: new Date() }]);
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "kicks"), {
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setSessionKicks((prev) => [...prev, { id: docRef.id, timestamp: new Date() }]);
    } catch (err) {
      console.error(err);
      alert("Failed to save kick.");
    }
  };

  const handleUndo = async () => {
    if (sessionKicks.length === 0) return;
    const lastKick = sessionKicks[sessionKicks.length - 1];

    if (!user) {
      // Simulating local undo
      setSessionKicks((prev) => prev.slice(0, -1));
      return;
    }

    try {
      await deleteDoc(doc(db, "kicks", lastKick.id));
      setSessionKicks((prev) => prev.slice(0, -1));
    } catch (err) {
      console.error(err);
      alert("Failed to undo kick.");
    }
  };

  return (
    <div className="glass-card p-8 bg-slate-800/40 border border-slate-700/30 rounded-3xl relative overflow-hidden backdrop-blur-xl">
      {/* Decorative inner light beam */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-800/60">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Active Session</span>
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
          className="relative py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-extrabold text-lg shadow-lg shadow-cyan-500/15 hover:shadow-cyan-400/20 active:scale-[0.98] transition-all duration-150 cursor-pointer"
        >
          👣 Record a Kick
        </button>
        <button
          onClick={handleUndo}
          disabled={sessionKicks.length === 0}
          className="py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:text-slate-650 font-bold text-lg border border-slate-750 disabled:border-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 active:scale-[0.98] cursor-pointer"
        >
          ↩️ Undo Last
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
