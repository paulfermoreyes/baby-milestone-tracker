"use client";

import { useState } from "react";
import { useBaby } from "@/context/BabyContext";
import { BabyProfile } from "@/lib/baby";
import { Baby, Calendar, Scales, Ruler } from "@phosphor-icons/react";

export default function BabyProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { baby, updateBabyProfile } = useBaby();

  const [name, setName] = useState(baby?.name || "");
  const [gender, setGender] = useState<"boy" | "girl" | "other">(
    baby?.gender || "boy",
  );
  const [birthDate, setBirthDate] = useState(
    baby?.birthDate || new Date().toISOString().split("T")[0],
  );
  const [birthWeightGram, setBirthWeightGram] = useState<number | "">(
    baby?.birthWeightGram || "",
  );
  const [birthLengthCm, setBirthLengthCm] = useState<number | "">(
    baby?.birthLengthCm || "",
  );
  const [birthHeadCircumferenceCm, setBirthHeadCircumferenceCm] = useState<
    number | ""
  >(baby?.birthHeadCircumferenceCm || "");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const data: Omit<BabyProfile, "id"> = {
        name: name.trim(),
        gender,
        birthDate,
        birthWeightGram: birthWeightGram ? Number(birthWeightGram) : undefined,
        birthLengthCm: birthLengthCm ? Number(birthLengthCm) : undefined,
        birthHeadCircumferenceCm: birthHeadCircumferenceCm
          ? Number(birthHeadCircumferenceCm)
          : undefined,
      };
      await updateBabyProfile(data);
      onClose();
    } catch (e) {
      console.error("Failed to save baby profile", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg p-6 rounded-3xl glass-card bg-slate-950 border border-slate-800 text-slate-100 shadow-2xl text-left relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-850">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Baby size={24} weight="bold" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">
              {baby ? "Edit Baby Profile" : "Welcome Baby! Create Profile"}
            </h3>
            <p className="text-xs text-slate-400">
              Record your newborn&apos;s details to enable milestones and growth tracking.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Baby&apos;s Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Liam Smith"
              required
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Gender</label>
              <select
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value as "boy" | "girl" | "other")
                }
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="boy">Boy 👦</option>
                <option value="girl">Girl 👧</option>
                <option value="other">Other 👶</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Calendar size={14} className="text-cyan-400" />
                Birth Date
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Scales size={12} className="text-cyan-400" /> Birth Wt (g)
              </label>
              <input
                type="number"
                value={birthWeightGram}
                onChange={(e) =>
                  setBirthWeightGram(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="3200"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Ruler size={12} className="text-cyan-400" /> Length (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={birthLengthCm}
                onChange={(e) =>
                  setBirthLengthCm(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="50"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                Head (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={birthHeadCircumferenceCm}
                onChange={(e) =>
                  setBirthHeadCircumferenceCm(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="35"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/10 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              {submitting ? (
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : null}
              {baby ? "Save Changes" : "Create Profile & Start"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
