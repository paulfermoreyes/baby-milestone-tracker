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
import { ThermometerHot, PencilSimpleLine, Warning, Trash } from "@phosphor-icons/react";

interface SymptomLog {
  id: string;
  symptom: string;
  severity: "Mild" | "Moderate" | "Severe";
  notes: string;
  timestamp: Date;
}

const SYMPTOM_OPTIONS = [
  { label: "🤢 Nausea / Sickness", value: "Nausea" },
  { label: "😴 Fatigue / Exhaustion", value: "Fatigue" },
  { label: "⚡ Headaches", value: "Headache" },
  { label: "🎈 Bloating / Heartburn", value: "Bloating" },
  { label: "🪵 Back Pain", value: "Back Pain" },
  { label: "🧠 Mood Fluctuations", value: "Mood Shifts" },
];

export default function SymptomTracker() {
  const { user, familyId } = useAuth();
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [symptom, setSymptom] = useState(SYMPTOM_OPTIONS[0].value);
  const [severity, setSeverity] = useState<"Mild" | "Moderate" | "Severe">("Mild");
  const [notes, setNotes] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sync with Firestore (or LocalStorage for Guests)
  useEffect(() => {
    if (!isClient) return;

    if (!user) {
      const localData = localStorage.getItem("lumina_guest_symptoms");
      if (localData) {
        try {
          const parsed = JSON.parse(localData) as {
            id: string;
            symptom: string;
            severity: "Mild" | "Moderate" | "Severe";
            notes: string;
            timestampStr: string;
          }[];
          setSymptomLogs(
            parsed.map((item) => ({
              ...item,
              timestamp: new Date(item.timestampStr),
            }))
          );
        } catch (e) {
          console.error("Failed to parse guest symptom logs", e);
          setSymptomLogs([]);
        }
      } else {
        setSymptomLogs([]);
      }
      return;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let q;
    if (familyId) {
      q = query(
        collection(db, "families", familyId, "symptoms"),
        where("createdAt", ">=", startOfDay),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "symptoms"),
        where("userId", "==", user.uid),
        where("createdAt", ">=", startOfDay),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs: SymptomLog[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const timestamp = data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date();
          logs.push({
            id: d.id,
            symptom: data.symptom,
            severity: data.severity,
            notes: data.notes || "",
            timestamp,
          });
        });
        setSymptomLogs(logs);
      },
      (err) => {
        console.error("Error reading symptoms from Firestore:", err);
      }
    );

    return () => unsubscribe();
  }, [user, familyId, isClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!user) {
      const simulatedId = Math.random().toString(36).substring(7);
      const newLog: SymptomLog = {
        id: simulatedId,
        symptom,
        severity,
        notes,
        timestamp: new Date(),
      };
      const updated = [newLog, ...symptomLogs];
      setSymptomLogs(updated);
      localStorage.setItem(
        "lumina_guest_symptoms",
        JSON.stringify(
          updated.map((l) => ({
            ...l,
            timestampStr: l.timestamp.toISOString(),
          }))
        )
      );
      setNotes("");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        symptom,
        severity,
        notes,
        loggedBy: user.uid,
        createdAt: serverTimestamp(),
      };
      if (familyId) {
        await addDoc(collection(db, "families", familyId, "symptoms"), payload);
      } else {
        await addDoc(collection(db, "symptoms"), { ...payload, userId: user.uid });
      }
      setNotes("");
    } catch (err) {
      console.error("Failed to save symptom log:", err);
      alert("Failed to sync symptom to the cloud.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      const updated = symptomLogs.filter((log) => log.id !== id);
      setSymptomLogs(updated);
      localStorage.setItem(
        "lumina_guest_symptoms",
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
        await deleteDoc(doc(db, "families", familyId, "symptoms", id));
      } else {
        await deleteDoc(doc(db, "symptoms", id));
      }
    } catch (err) {
      console.error("Failed to delete symptom log:", err);
      alert("Failed to delete symptom record.");
    }
  };

  const triggerAuthModal = () => {
    const dialog = document.querySelector("dialog.auth-dialog") as HTMLDialogElement;
    if (dialog) dialog.showModal();
  };

  const getSeverityBadgeColor = (sev: "Mild" | "Moderate" | "Severe") => {
    switch (sev) {
      case "Mild": return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
      case "Moderate": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Severe": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    }
  };

  return (
    <div className="glass-card p-6 bg-slate-800/30 border border-slate-700/30 rounded-2xl flex flex-col justify-between hover:border-slate-600/40 transition-all duration-300 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Well-being Logs</span>
          <ThermometerHot size={20} weight="bold" className="text-cyan-400" />
        </div>

        <h3 className="text-lg font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">
          Symptom Diary
        </h3>

        {user && familyId && (
          <p className="text-[10px] text-indigo-400 font-semibold mb-3">Shared with partner</p>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Symptom</label>
              <select
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
              >
                {SYMPTOM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-100">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
              >
                <option value="Mild" className="bg-slate-950 text-slate-100"> Mild</option>
                <option value="Moderate" className="bg-slate-950 text-slate-100"> Moderate</option>
                <option value="Severe" className="bg-slate-950 text-slate-100"> Severe</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Additional Notes</label>
            <input
              type="text"
              placeholder="e.g. Occurred morning, helped with ginger tea..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 text-xs font-bold border border-transparent shadow-md active:scale-[0.98] transition-all cursor-pointer text-center"
          >
            {loading ? (
              "Logging..."
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <PencilSimpleLine size={16} weight="bold" />
                <span>Record Symptom</span>
              </span>
            )}
          </button>
        </form>

        {/* History Panel */}
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2.5">Today's Logs</span>
          {symptomLogs.length === 0 ? (
            <div className="text-center py-6 rounded-xl bg-slate-900/30 border border-slate-850/50 text-[11px] text-slate-500">
              No symptoms logged today.
            </div>
          ) : (
            <div className="max-h-[140px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {symptomLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-900/50 border border-slate-850/80 text-xs flex flex-col gap-1.5 hover:border-slate-800 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-200">
                      {SYMPTOM_OPTIONS.find((opt) => opt.value === log.symptom)?.label.split(" ").slice(1).join(" ") || log.symptom}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getSeverityBadgeColor(log.severity)}`}>
                        {log.severity}
                      </span>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer flex items-center justify-center"
                        title="Delete record"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                  {log.notes && <p className="text-[11px] text-slate-400 leading-normal bg-slate-950/40 p-2 rounded-lg border border-slate-850/30">{log.notes}</p>}
                  <span className="text-[9px] text-slate-550 block self-end">
                    {log.timestamp.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </span>
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
          <button onClick={triggerAuthModal} className="underline font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
            Sync
          </button>
        </div>
      )}
    </div>
  );
}
