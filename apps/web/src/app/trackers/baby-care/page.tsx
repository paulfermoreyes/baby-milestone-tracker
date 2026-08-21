"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useBaby } from "@/context/BabyContext";
import {
  CareLog,
  CareLogType,
  addCareLog,
  subscribeCareLogs,
} from "@/lib/baby";
import {
  Drop,
  Moon,
  Footprints,
  Plus,
  Baby,
  Pulse,
  Calendar,
} from "@phosphor-icons/react";
import BabyProfileModal from "@/components/baby/BabyProfileModal";

export default function BabyCarePage() {
  const { user, familyId } = useAuth();
  const { baby } = useBaby();

  const [logs, setLogs] = useState<CareLog[]>([]);
  const [filterType, setFilterType] = useState<CareLogType | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [logType, setLogType] = useState<CareLogType>("feeding");
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [feedingMethod, setFeedingMethod] = useState<"breast" | "bottle_milk" | "bottle_formula" | "solids">("breast");
  const [leftBreastMinutes, setLeftBreastMinutes] = useState<number | "">(10);
  const [rightBreastMinutes, setRightBreastMinutes] = useState<number | "">(10);
  const [amountMl, setAmountMl] = useState<number | "">(60);
  const [diaperType, setDiaperType] = useState<"wet" | "dirty" | "both" | "dry">("wet");
  const [stoolColor, setStoolColor] = useState<"yellow" | "green" | "brown" | "clay" | "black">("yellow");
  const [durationMinutes, setDurationMinutes] = useState<number | "">(30);
  const [temperatureC, setTemperatureC] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user || !baby?.id) return;
    const unsub = subscribeCareLogs(familyId, user.uid, baby.id, setLogs);
    return () => unsub();
  }, [user, familyId, baby?.id]);

  if (!baby) {
    return (
      <AppShell>
        <div className="glass-card p-10 rounded-3xl bg-slate-950/60 border border-slate-800 text-center max-w-xl mx-auto my-12 text-slate-100">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Drop size={32} weight="fill" />
          </div>
          <h3 className="text-2xl font-extrabold text-white mb-2">
            Daily Newborn Care Logs
          </h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Record feedings, diaper changes, sleep durations, tummy time, and body temperatures in real time.
          </p>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="py-3 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm shadow-lg active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
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

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !baby.id) return;
    setSubmitting(true);
    try {
      const data: Omit<CareLog, "id" | "babyId" | "loggedBy"> = {
        type: logType,
        timestamp: new Date(timestamp).toISOString(),
        notes: notes.trim() || undefined,
      };

      if (logType === "feeding") {
        data.feedingMethod = feedingMethod;
        if (feedingMethod === "breast") {
          data.leftBreastMinutes = leftBreastMinutes !== "" ? Number(leftBreastMinutes) : undefined;
          data.rightBreastMinutes = rightBreastMinutes !== "" ? Number(rightBreastMinutes) : undefined;
        } else {
          data.amountMl = amountMl !== "" ? Number(amountMl) : undefined;
        }
      } else if (logType === "diaper") {
        data.diaperType = diaperType;
        data.stoolColor = stoolColor;
      } else if (logType === "sleep" || logType === "tummy_time") {
        data.durationMinutes = durationMinutes !== "" ? Number(durationMinutes) : undefined;
      } else if (logType === "health") {
        data.temperatureC = temperatureC !== "" ? Number(temperatureC) : undefined;
      }

      await addCareLog(familyId, user.uid, baby.id, data);
      setIsModalOpen(false);
      setNotes("");
    } catch (err) {
      console.error("Failed to add care log", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = logs.filter((l) => (filterType === "all" ? true : l.type === filterType));

  const getIcon = (type: CareLogType) => {
    switch (type) {
      case "feeding":
        return <Drop size={18} weight="fill" className="text-cyan-400" />;
      case "diaper":
        return <Pulse size={18} weight="bold" className="text-amber-400" />;
      case "sleep":
        return <Moon size={18} weight="fill" className="text-indigo-400" />;
      case "tummy_time":
        return <Footprints size={18} weight="bold" className="text-emerald-400" />;
      default:
        return <Baby size={18} weight="bold" className="text-purple-400" />;
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 text-slate-100 text-left animate-fade-in">
        {/* Header */}
        <div className="glass-card p-6 md:p-8 rounded-3xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Drop size={24} weight="fill" />
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                {baby.name}&apos;s Daily Care Journal
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Chronological log of feeding times, diaper condition, sleep hours, and tummy time exercises.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="py-3 px-5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus size={16} weight="bold" />
            Add Care Log
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400">Filter:</span>
          {[
            { id: "all", label: "All Activities" },
            { id: "feeding", label: "Feeding 🍼" },
            { id: "diaper", label: "Diaper 💩" },
            { id: "sleep", label: "Sleep 🌙" },
            { id: "tummy_time", label: "Tummy Time 👣" },
            { id: "health", label: "Health 🩺" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id as CareLogType | "all")}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === item.id
                  ? "bg-cyan-500 text-slate-950 font-extrabold shadow-sm"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Chronological Timeline */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl bg-slate-950/60 border border-slate-800 text-center">
              <p className="text-xs text-slate-500">
                No logs recorded for this view. Click &quot;Add Care Log&quot; to add an entry.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const dateObj = new Date(log.timestamp);
              return (
                <div
                  key={log.id}
                  className="glass-card p-4 rounded-2xl bg-slate-950/60 border border-slate-850 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 mt-0.5">
                      {getIcon(log.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white capitalize">
                          {log.type.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Details */}
                      <p className="text-xs text-slate-300 mt-1">
                        {log.type === "feeding" && (
                          log.feedingMethod === "breast"
                            ? `Breastfeeding: Left ${log.leftBreastMinutes || 0}m, Right ${log.rightBreastMinutes || 0}m`
                            : `Bottle (${log.feedingMethod}): ${log.amountMl || 0} ml`
                        )}
                        {log.type === "diaper" && (
                          `Condition: ${log.diaperType?.toUpperCase()} (Stool color: ${log.stoolColor || 'n/a'})`
                        )}
                        {(log.type === "sleep" || log.type === "tummy_time") && (
                          `Duration: ${log.durationMinutes || 0} minutes`
                        )}
                        {log.type === "health" && (
                          `Temperature: ${log.temperatureC || '--'} °C`
                        )}
                      </p>

                      {log.notes && (
                        <p className="text-[11px] text-slate-400 italic mt-1">
                          &quot;{log.notes}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Log Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <div className="w-full max-w-md p-6 rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-2xl text-left">
              <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                <Drop size={20} className="text-cyan-400" />
                Add Daily Care Log
              </h3>

              <form onSubmit={handleAddLog} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Category</label>
                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value as CareLogType)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                  >
                    <option value="feeding">Feeding 🍼</option>
                    <option value="diaper">Diaper Change 💩</option>
                    <option value="sleep">Sleep / Nap 🌙</option>
                    <option value="tummy_time">Tummy Time 👣</option>
                    <option value="health">Health / Temp 🩺</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                  />
                </div>

                {logType === "feeding" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Method</label>
                      <select
                        value={feedingMethod}
                        onChange={(e) =>
                          setFeedingMethod(
                            e.target.value as
                              | "breast"
                              | "bottle_milk"
                              | "bottle_formula"
                              | "solids"
                          )
                        }
                        className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                      >
                        <option value="breast">Breastfeeding / Nursing 🤱</option>
                        <option value="bottle_milk">Bottle (Expressed Milk) 🍼</option>
                        <option value="bottle_formula">Bottle (Formula) 🍼</option>
                        <option value="solids">Solids / Puree 🥣</option>
                      </select>
                    </div>

                    {feedingMethod === "breast" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-300">Left Breast (min)</label>
                          <input
                            type="number"
                            value={leftBreastMinutes}
                            onChange={(e) => setLeftBreastMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-300">Right Breast (min)</label>
                          <input
                            type="number"
                            value={rightBreastMinutes}
                            onChange={(e) => setRightBreastMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-bold text-slate-300">Amount (ml)</label>
                        <input
                          type="number"
                          value={amountMl}
                          onChange={(e) => setAmountMl(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                        />
                      </div>
                    )}
                  </>
                )}

                {logType === "diaper" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300">Condition</label>
                      <select
                        value={diaperType}
                        onChange={(e) =>
                          setDiaperType(
                            e.target.value as "wet" | "dirty" | "both" | "dry",
                          )
                        }
                        className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                      >
                        <option value="wet">Wet 💧</option>
                        <option value="dirty">Dirty 💩</option>
                        <option value="both">Both 💧💩</option>
                        <option value="dry">Dry ⚪</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300">Stool Color</label>
                      <select
                        value={stoolColor}
                        onChange={(e) =>
                          setStoolColor(
                            e.target.value as
                              | "yellow"
                              | "green"
                              | "brown"
                              | "clay"
                              | "black",
                          )
                        }
                        className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                      >
                        <option value="yellow">Yellow 🟡</option>
                        <option value="green">Green 🟢</option>
                        <option value="brown">Brown 🟤</option>
                        <option value="clay">Clay / Pale ⚪</option>
                        <option value="black">Meconium / Black ⚫</option>
                      </select>
                    </div>
                  </div>
                )}

                {(logType === "sleep" || logType === "tummy_time") && (
                  <div>
                    <label className="text-xs font-bold text-slate-300">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                    />
                  </div>
                )}

                {logType === "health" && (
                  <div>
                    <label className="text-xs font-bold text-slate-300">Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperatureC}
                      onChange={(e) => setTemperatureC(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="36.8"
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Fed well, calm baby"
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
                    className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-md transition-all cursor-pointer"
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
