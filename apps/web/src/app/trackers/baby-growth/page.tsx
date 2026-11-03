"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useBaby } from "@/context/BabyContext";
import {
  GrowthLog,
  addGrowthLog,
  subscribeGrowthLogs,
} from "@/lib/baby";
import {
  assessWeight,
  assessLength,
  assessHeadCircumference,
  calculateAgeInMonths,
} from "@/lib/whoGrowth";
import { Scales, Ruler, Plus, Baby } from "@phosphor-icons/react";
import BabyProfileModal from "@/components/baby/BabyProfileModal";

export default function BabyGrowthPage() {
  const { user, familyId } = useAuth();
  const { baby } = useBaby();

  const [logs, setLogs] = useState<GrowthLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [lengthCm, setLengthCm] = useState<number | "">("");
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user || !baby?.id) return;
    const unsub = subscribeGrowthLogs(familyId, user.uid, baby.id, setLogs);
    return () => unsub();
  }, [user, familyId, baby?.id]);

  if (!baby) {
    return (
      <AppShell>
        <div className="glass-card p-10 rounded-3xl bg-slate-950/60 border border-slate-800 text-center max-w-xl mx-auto my-12 text-slate-100">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Scales size={32} weight="bold" />
          </div>
          <h3 className="text-2xl font-extrabold text-white mb-2">
            Baby Growth Metrics & Vitals
          </h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Monitor baby&apos;s weight gain, crown-to-heel length, and head circumference over time. Please set up baby profile first.
          </p>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="py-3 px-6 rounded-2xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-sm shadow-lg active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Baby size={18} weight="bold" />
            Create Baby Profile
          </button>
          <BabyProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
          />
        </div>
      </AppShell>
    );
  }

  const handleAddGrowth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !baby.id) return;
    setSubmitting(true);
    try {
      await addGrowthLog(familyId, user.uid, baby.id, {
        date,
        weightKg: weightKg !== "" ? Number(weightKg) : undefined,
        lengthCm: lengthCm !== "" ? Number(lengthCm) : undefined,
        headCircumferenceCm: headCircumferenceCm !== "" ? Number(headCircumferenceCm) : undefined,
        notes: notes.trim() || undefined,
      });
      setIsModalOpen(false);
      setWeightKg("");
      setLengthCm("");
      setHeadCircumferenceCm("");
      setNotes("");
    } catch (err) {
      console.error("Failed to add growth log", err);
    } finally {
      setSubmitting(false);
    }
  };

  const latestWeightLog = logs.filter(l => l.weightKg).pop();
  const latestWeight = latestWeightLog?.weightKg || (baby.birthWeightGram ? baby.birthWeightGram / 1000 : null);
  const latestWeightDate = latestWeightLog?.date || baby.birthDate;

  const latestLengthLog = logs.filter(l => l.lengthCm).pop();
  const latestLength = latestLengthLog?.lengthCm || baby.birthLengthCm;
  const latestLengthDate = latestLengthLog?.date || baby.birthDate;

  const latestHeadLog = logs.filter(l => l.headCircumferenceCm).pop();
  const latestHead = latestHeadLog?.headCircumferenceCm || baby.birthHeadCircumferenceCm;
  const latestHeadDate = latestHeadLog?.date || baby.birthDate;

  const gender = baby.gender === "boy" || baby.gender === "girl" ? baby.gender : "boy";

  const weightAssessment = latestWeight && baby.birthDate
    ? assessWeight(gender, calculateAgeInMonths(baby.birthDate, latestWeightDate), latestWeight)
    : null;

  const lengthAssessment = latestLength && baby.birthDate
    ? assessLength(gender, calculateAgeInMonths(baby.birthDate, latestLengthDate), latestLength)
    : null;

  const headAssessment = latestHead && baby.birthDate
    ? assessHeadCircumference(gender, calculateAgeInMonths(baby.birthDate, latestHeadDate), latestHead)
    : null;

  return (
    <AppShell>
      <div className="space-y-8 text-slate-100 text-left animate-fade-in">
        {/* Header */}
        <div className="glass-card p-6 md:p-8 rounded-3xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                <Scales size={24} weight="bold" />
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                {baby.name}&apos;s Growth Vitals
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Track weight, crown-to-heel length, and head circumference evaluated against WHO Child Growth Standards.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="py-3 px-5 rounded-2xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus size={16} weight="bold" />
            Add Measurements
          </button>
        </div>

        {/* Vital Snapshot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Current Weight</span>
              <Scales size={20} weight="bold" />
            </div>
            <span className="text-2xl font-black text-white">
              {latestWeight ? `${latestWeight} kg` : "--"}
            </span>
            {weightAssessment ? (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                    weightAssessment.status === "typical"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}>
                    {weightAssessment.percentile}th %tile
                  </span>
                  <span className="text-[10px] text-slate-400">WHO MGRS</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate">{weightAssessment.statusText}</span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400">
                Target percentile: WHO Standard
              </span>
            )}
          </div>

          <div className="glass-card p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-cyan-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Current Length</span>
              <Ruler size={20} weight="bold" />
            </div>
            <span className="text-2xl font-black text-white">
              {latestLength ? `${latestLength} cm` : "--"}
            </span>
            {lengthAssessment ? (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                    lengthAssessment.status === "typical"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}>
                    {lengthAssessment.percentile}th %tile
                  </span>
                  <span className="text-[10px] text-slate-400">WHO MGRS</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate">{lengthAssessment.statusText}</span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400">
                Crown to heel measurement
              </span>
            )}
          </div>

          <div className="glass-card p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Head Size</span>
              <Baby size={20} weight="bold" />
            </div>
            <span className="text-2xl font-black text-white">
              {latestHead ? `${latestHead} cm` : "--"}
            </span>
            {headAssessment ? (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                    headAssessment.status === "typical"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}>
                    {headAssessment.percentile}th %tile
                  </span>
                  <span className="text-[10px] text-slate-400">WHO MGRS</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate">{headAssessment.statusText}</span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400">
                Cranial circumference
              </span>
            )}
          </div>
        </div>

        {/* Growth Log History */}
        <div className="glass-card p-6 rounded-3xl bg-slate-950/60 border border-slate-800">
          <h3 className="text-base font-extrabold text-white mb-4">
            Measurement History
          </h3>

          {logs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No growth entries recorded yet. Click &quot;Add Measurements&quot; above to begin.
            </p>
          ) : (
            <div className="divide-y divide-slate-850">
              {logs.map((log) => {
                const ageMonths = baby.birthDate ? calculateAgeInMonths(baby.birthDate, log.date) : 0;
                const wAssess = log.weightKg && baby.birthDate ? assessWeight(gender, ageMonths, log.weightKg) : null;
                const lAssess = log.lengthCm && baby.birthDate ? assessLength(gender, ageMonths, log.lengthCm) : null;
                const hAssess = log.headCircumferenceCm && baby.birthDate ? assessHeadCircumference(gender, ageMonths, log.headCircumferenceCm) : null;

                return (
                  <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white">{log.date}</span>
                        {baby.birthDate && (
                          <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full font-medium">
                            {ageMonths} mo
                          </span>
                        )}
                      </div>
                      {log.notes && (
                        <span className="text-slate-400 block mt-0.5">{log.notes}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-300">
                      {log.weightKg && (
                        <span className="inline-flex items-center gap-1.5">
                          🏋️ {log.weightKg} kg
                          {wAssess && (
                            <span className="text-[10px] text-purple-300 bg-purple-500/15 border border-purple-500/25 px-1.5 py-0.5 rounded font-bold">
                              {wAssess.percentile}%
                            </span>
                          )}
                        </span>
                      )}
                      {log.lengthCm && (
                        <span className="inline-flex items-center gap-1.5">
                          📏 {log.lengthCm} cm
                          {lAssess && (
                            <span className="text-[10px] text-cyan-300 bg-cyan-500/15 border border-cyan-500/25 px-1.5 py-0.5 rounded font-bold">
                              {lAssess.percentile}%
                            </span>
                          )}
                        </span>
                      )}
                      {log.headCircumferenceCm && (
                        <span className="inline-flex items-center gap-1.5">
                          👶 {log.headCircumferenceCm} cm
                          {hAssess && (
                            <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 rounded font-bold">
                              {hAssess.percentile}%
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Entry Form */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <div className="w-full max-w-md p-6 rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-2xl text-left">
              <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                <Scales size={20} className="text-purple-400" />
                Record Growth Entry
              </h3>

              <form onSubmit={handleAddGrowth} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="4.2"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300">Length (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={lengthCm}
                      onChange={(e) => setLengthCm(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="54.5"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300">Head (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={headCircumferenceCm}
                      onChange={(e) => setHeadCircumferenceCm(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="36.0"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Pediatrician Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. 2-month checkup, healthy growth"
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2.5 px-5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    {submitting ? "Saving..." : "Save Entry"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
