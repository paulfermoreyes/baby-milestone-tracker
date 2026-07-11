"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Warning, Trash, PencilSimple, BookOpen, SunHorizon, Sun, Moon, MoonIcon, SunHorizonIcon, SunIcon, ChartLineIcon, BookOpenIcon, DropIcon } from "@phosphor-icons/react";

interface BloodSugarLog {
  id: string;
  value: number; // in mg/dL
  slot: "fasting" | "post-lunch" | "post-dinner";
  date: string; // YYYY-MM-DD
  timestamp: Date;
}

export default function BloodSugarTracker() {
  const { user, familyId } = useAuth();
  const [logs, setLogs] = useState<BloodSugarLog[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Form states
  const [activeSlot, setActiveSlot] = useState<"fasting" | "post-lunch" | "post-dinner" | null>(null);
  const [editingLog, setEditingLog] = useState<BloodSugarLog | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Range and filter states
  const [chartRange, setChartRange] = useState<"7" | "14" | "30" | "all">("7");
  const [historyFilter, setHistoryFilter] = useState<"all" | "fasting" | "post-lunch" | "post-dinner">("all");
  const [hoveredDot, setHoveredDot] = useState<{ x: number; y: number; log: BloodSugarLog } | null>(null);
  const [activeView, setActiveView] = useState<"record" | "chart" | "history">("record");

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };

  const todayStr = getLocalDateString();

  const renderSlotIcon = (slot: "fasting" | "post-lunch" | "post-dinner" | string, size = 14, className = "") => {
    switch (slot) {
      case "fasting":
        return <SunHorizon size={size} weight="bold" className={className || "text-cyan-400"} />;
      case "post-lunch":
        return <Sun size={size} weight="bold" className={className || "text-emerald-400"} />;
      case "post-dinner":
        return <Moon size={size} weight="bold" className={className || "text-rose-400"} />;
      default:
        return null;
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  // Sync blood sugar logs from Firestore or LocalStorage
  useEffect(() => {
    if (!isClient) return;

    if (!user) {
      // Local Storage Preview
      const localData = localStorage.getItem("lumina_guest_bloodsugar");
      if (localData) {
        try {
          const parsed = JSON.parse(localData) as {
            id: string;
            value: number;
            slot: "fasting" | "post-lunch" | "post-dinner";
            date: string;
            timestampStr: string;
          }[];
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setLogs(
            parsed.map((item) => ({
              ...item,
              timestamp: new Date(item.timestampStr),
            }))
          );
        } catch (e) {
          console.error("Failed to parse guest blood sugar logs", e);
          setLogs([]);
        }
      } else {
        setLogs([]);
      }
      return;
    }

    // Query historical blood sugar logs (limit to 150 for rich history analysis)
    let q;
    if (familyId) {
      q = query(
        collection(db, "families", familyId, "bloodsugar"),
        orderBy("createdAt", "desc"),
        limit(150)
      );
    } else {
      q = query(
        collection(db, "bloodsugar"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(150)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bsLogs: BloodSugarLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const timestamp = data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date();
          bsLogs.push({
            id: doc.id,
            value: Number(data.value),
            slot: data.slot,
            date: data.date,
            timestamp,
          });
        });
        // Sort from oldest to newest for chronological charting
        setLogs(bsLogs.reverse());
      },
      (err) => {
        console.error("Error reading blood sugar from Firestore:", err);
      }
    );

    return () => unsubscribe();
  }, [user, familyId, isClient]);

  // Handle logging a reading
  const handleLogReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSlot || !inputValue) return;

    const value = parseFloat(inputValue);
    if (isNaN(value) || value <= 0 || value > 500) {
      alert("Please enter a valid blood sugar reading (e.g. 50 - 400 mg/dL).");
      return;
    }

    setIsSubmitting(true);

    if (!user) {
      // Simulate guest log
      const simulatedId = Math.random().toString(36).substring(7);
      const newLog: BloodSugarLog = {
        id: simulatedId,
        value,
        slot: activeSlot,
        date: todayStr,
        timestamp: new Date(),
      };

      // Filter out pre-existing reading for the same slot on the same day
      const filtered = logs.filter((l) => !(l.date === todayStr && l.slot === activeSlot));
      const updated = [...filtered, newLog];

      setLogs(updated);
      localStorage.setItem(
        "lumina_guest_bloodsugar",
        JSON.stringify(
          updated.map((l) => ({
            id: l.id,
            value: l.value,
            slot: l.slot,
            date: l.date,
            timestampStr: l.timestamp.toISOString(),
          }))
        )
      );

      setActiveSlot(null);
      setInputValue("");
      setIsSubmitting(false);
      return;
    }

    try {
      // Clean up previous entry for this slot today to keep entries unique per slot/day
      const duplicate = logs.find((l) => l.date === todayStr && l.slot === activeSlot);
      if (duplicate) {
        if (familyId) {
          await deleteDoc(doc(db, "families", familyId, "bloodsugar", duplicate.id));
        } else {
          await deleteDoc(doc(db, "bloodsugar", duplicate.id));
        }
      }

      const payload = {
        value,
        slot: activeSlot,
        date: todayStr,
        loggedBy: user.uid,
        createdAt: serverTimestamp(),
      };
      if (familyId) {
        await addDoc(collection(db, "families", familyId, "bloodsugar"), payload);
      } else {
        await addDoc(collection(db, "bloodsugar"), { ...payload, userId: user.uid });
      }

      setActiveSlot(null);
      setInputValue("");
    } catch (err) {
      console.error("Error adding blood sugar entry:", err);
      alert("Failed to save reading to the cloud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete reading
  const handleDeleteReading = async (id: string) => {
    if (!user) {
      const updated = logs.filter((l) => l.id !== id);
      setLogs(updated);
      localStorage.setItem(
        "lumina_guest_bloodsugar",
        JSON.stringify(
          updated.map((l) => ({
            id: l.id,
            value: l.value,
            slot: l.slot,
            date: l.date,
            timestampStr: l.timestamp.toISOString(),
          }))
        )
      );
      return;
    }

    try {
      if (familyId) {
        await deleteDoc(doc(db, "families", familyId, "bloodsugar", id));
      } else {
        await deleteDoc(doc(db, "bloodsugar", id));
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
      alert("Failed to delete reading.");
    }
  };

  // Start editing a reading
  const handleStartEdit = (log: BloodSugarLog) => {
    setEditingLog(log);
    setInputValue(log.value.toString());
    setActiveSlot(null); // Close creation form if open
  };

  // Handle updating an edited reading
  const handleEditReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog || !inputValue) return;

    const value = parseFloat(inputValue);
    if (isNaN(value) || value <= 0 || value > 500) {
      alert("Please enter a valid blood sugar reading (e.g. 50 - 400 mg/dL).");
      return;
    }

    setIsSubmitting(true);

    if (!user) {
      // Guest mode: update locally
      const updated = logs.map((l) => (l.id === editingLog.id ? { ...l, value } : l));
      setLogs(updated);
      localStorage.setItem(
        "lumina_guest_bloodsugar",
        JSON.stringify(
          updated.map((l) => ({
            id: l.id,
            value: l.value,
            slot: l.slot,
            date: l.date,
            timestampStr: l.timestamp.toISOString(),
          }))
        )
      );
      setEditingLog(null);
      setInputValue("");
      setIsSubmitting(false);
      return;
    }

    try {
      if (familyId) {
        await updateDoc(doc(db, "families", familyId, "bloodsugar", editingLog.id), {
          value,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, "bloodsugar", editingLog.id), {
          value,
          updatedAt: serverTimestamp(),
        });
      }
      setEditingLog(null);
      setInputValue("");
    } catch (err) {
      console.error("Error updating blood sugar entry:", err);
      alert("Failed to update reading in the cloud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Today's logs
  const todayLogs = logs.filter((l) => l.date === todayStr);
  const fastingReading = todayLogs.find((l) => l.slot === "fasting");
  const lunchReading = todayLogs.find((l) => l.slot === "post-lunch");
  const dinnerReading = todayLogs.find((l) => l.slot === "post-dinner");

  // Threshold checkers
  const getClassification = (value: number, slot: "fasting" | "post-lunch" | "post-dinner") => {
    if (value < 70) return { label: "Low", color: "text-blue-900 bg-blue-100/40 border-blue-300/30 dark:text-blue-200 dark:bg-blue-900/40 dark:border-blue-700/30" };

    if (slot === "fasting") {
      return value < 95
        ? { label: "Normal", color: "text-emerald-900 bg-emerald-100/40 border-emerald-300/30" }
        : { label: "Elevated", color: "text-rose-900 bg-rose-100/40 border-rose-300/30" };
    } else {
      return value < 140
        ? { label: "Normal", color: "text-emerald-900 bg-emerald-100/40 border-emerald-300/30" }
        : { label: "Elevated", color: "text-rose-900 bg-rose-100/40 border-rose-300/30" };
    }
  };

  const triggerAuthModal = () => {
    const dialog = document.querySelector("dialog.auth-dialog") as HTMLDialogElement;
    if (dialog) {
      dialog.showModal();
    }
  };

  const slotConfigs = {
    fasting: {
      label: "Fasting",
      color: "#06b6d4",
      bgClass: "bg-cyan-500",
      textClass: "text-cyan-400",
      borderClass: "border-cyan-500/30",
      emoji: "🌅",
    },
    "post-lunch": {
      label: "Post-Lunch",
      color: "#10b981",
      bgClass: "bg-emerald-500",
      textClass: "text-emerald-400",
      borderClass: "border-emerald-500/30",
      emoji: "☀️",
    },
    "post-dinner": {
      label: "Post-Dinner",
      color: "#f43f5e",
      bgClass: "bg-rose-500",
      textClass: "text-rose-400",
      borderClass: "border-rose-500/30",
      emoji: "🌙",
    },
  };

  // Date formatting helpers for logs list
  const formatLogDate = (dateStr: string) => {
    if (dateStr === todayStr) return "Today";

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === getLocalDateString(yesterday)) return "Yesterday";

    return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatLogTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  // Filtering logs based on selected chartRange
  const getFilteredLogsForChart = () => {
    if (chartRange === "all") return logs;

    const daysLimit = parseInt(chartRange, 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysLimit + 1);
    cutoffDate.setHours(0, 0, 0, 0);

    return logs.filter((log) => {
      const logDate = new Date(log.date + "T00:00:00");
      return logDate >= cutoffDate;
    });
  };

  const filteredChartLogs = getFilteredLogsForChart();

  // Determine date axis segments based on range
  const getDatesInRange = () => {
    if (chartRange === "all") {
      // Return sorted unique dates in filteredChartLogs
      return Array.from(new Set(filteredChartLogs.map((l) => l.date))).sort();
    }

    const days = parseInt(chartRange, 10);
    const dateList: string[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dateList.push(getLocalDateString(d));
    }
    return dateList;
  };

  const activeDates = getDatesInRange();

  // Group logs by Date and Slot for O(1) alignment lookups
  const groupedLogs: Record<string, Record<string, BloodSugarLog>> = {};
  filteredChartLogs.forEach((log) => {
    if (!groupedLogs[log.date]) {
      groupedLogs[log.date] = {};
    }
    groupedLogs[log.date][log.slot] = log;
  });

  // SVG Chart rendering settings
  const chartHeight = 180;
  const chartWidth = 500;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 25;

  // X coordinate mapper
  const getX = (idx: number) => {
    if (activeDates.length <= 1) return paddingLeft + (chartWidth - paddingLeft - paddingRight) / 2;
    return paddingLeft + (idx / (activeDates.length - 1)) * (chartWidth - paddingLeft - paddingRight);
  };

  // Y coordinate mapper
  const chartValues = filteredChartLogs.map((l) => l.value);
  const minVal = Math.max(0, Math.min(...chartValues, 65) - 10);
  const maxVal = Math.max(...chartValues, 155) + 15;
  const range = maxVal - minVal;

  const getY = (val: number) => {
    const scale = (val - minVal) / (range || 1);
    return chartHeight - paddingBottom - scale * (chartHeight - paddingTop - paddingBottom);
  };

  // Generate coordinate array for a slot
  const getSlotPoints = (slot: "fasting" | "post-lunch" | "post-dinner") => {
    const points: { x: number; y: number; log: BloodSugarLog; dateIdx: number }[] = [];
    activeDates.forEach((date, idx) => {
      const log = groupedLogs[date]?.[slot];
      if (log) {
        points.push({
          x: getX(idx),
          y: getY(log.value),
          log,
          dateIdx: idx,
        });
      }
    });
    return points;
  };

  const fastingPoints = getSlotPoints("fasting");
  const lunchPoints = getSlotPoints("post-lunch");
  const dinnerPoints = getSlotPoints("post-dinner");

  const getPathD = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  };

  // Check if grid tick labels should be rendered
  const shouldRenderLabel = (idx: number) => {
    const len = activeDates.length;
    if (len <= 7) return true;
    if (len <= 14) return idx % 2 === 0 || idx === len - 1;
    if (len <= 30) return idx % 5 === 0 || idx === len - 1;
    return idx % Math.ceil(len / 5) === 0 || idx === len - 1;
  };

  const renderSVGChart = () => {
    if (filteredChartLogs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[180px] rounded-2xl bg-slate-900/30 border border-slate-850 border-dashed text-slate-500 text-xs p-4">
          <span>📉 Line chart trends will generate here.</span>
          <span className="mt-1 opacity-70">Log some readings to start tracking patterns!</span>
        </div>
      );
    }

    const gridTicks = [70, 95, 140];

    return (
      <div className="rounded-2xl p-4 bg-slate-900/50 border border-slate-800/80 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Blood Sugar Trend Analysis
            </span>
            <span className="text-[9px] text-indigo-400/80 font-medium">
              Hover over points to inspect individual slot entries
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Custom Legend */}
            <div className="flex gap-2.5 text-[9px] font-bold">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Fasting
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Post-Lunch
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Post-Dinner
              </span>
            </div>

            {/* Adjustable Range Tab Pill */}
            <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-850">
              {(["7", "14", "30", "all"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setChartRange(r);
                    setHoveredDot(null);
                  }}
                  className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold transition-all cursor-pointer ${chartRange === r
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                    }`}
                >
                  {r === "all" ? "All" : `${r}D`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SVG Wrapper */}
        <div className="relative w-full h-[180px]">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            width="100%"
            height="100%"
            className="overflow-visible"
          >
            {/* Horizontal Grid lines & Clinical Target Threshold Ticks */}
            {gridTicks.map((tick) => {
              const y = getY(tick);
              const isTargetLine = tick === 95 || tick === 140;
              return (
                <g key={tick}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke={tick === 95 ? "#06b6d4" : tick === 140 ? "#f43f5e" : "#334155"}
                    strokeWidth="1"
                    strokeDasharray={isTargetLine ? "2 3" : "1 5"}
                    opacity={isTargetLine ? 0.35 : 0.15}
                  />
                  <text
                    x={paddingLeft - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-slate-500 text-[8px] font-extrabold select-none"
                  >
                    {tick}
                  </text>
                  {isTargetLine && (
                    <text
                      x={chartWidth - paddingRight}
                      y={y - 4}
                      textAnchor="end"
                      className={`text-[6.5px] font-black tracking-widest select-none ${tick === 95 ? "fill-cyan-500/50" : "fill-rose-500/50"
                        }`}
                    >
                      {tick === 95 ? "FASTING TARGET < 95" : "POST-MEAL TARGET < 140"}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Vertical grid lines and date labels */}
            {activeDates.map((date, idx) => {
              if (!shouldRenderLabel(idx)) return null;
              const x = getX(idx);
              const dateObj = new Date(date + "T00:00:00");
              const labelStr = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });

              return (
                <g key={date}>
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={chartHeight - paddingBottom}
                    stroke="#334155"
                    strokeWidth="0.5"
                    strokeDasharray="1 5"
                    opacity="0.15"
                  />
                  <text
                    x={x}
                    y={chartHeight - paddingBottom + 14}
                    textAnchor="middle"
                    className="fill-slate-500 text-[8px] font-bold select-none"
                  >
                    {labelStr}
                  </text>
                </g>
              );
            })}

            {/* Fasting Line Path */}
            {fastingPoints.length > 1 && (
              <>
                <path d={getPathD(fastingPoints)} fill="none" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round" opacity="0.1" />
                <path d={getPathD(fastingPoints)} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
              </>
            )}

            {/* Post-Lunch Line Path */}
            {lunchPoints.length > 1 && (
              <>
                <path d={getPathD(lunchPoints)} fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" opacity="0.1" />
                <path d={getPathD(lunchPoints)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
              </>
            )}

            {/* Post-Dinner Line Path */}
            {dinnerPoints.length > 1 && (
              <>
                <path d={getPathD(dinnerPoints)} fill="none" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" opacity="0.1" />
                <path d={getPathD(dinnerPoints)} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
              </>
            )}

            {/* Interactive Circles & Trigger Nodes */}
            {/* Fasting Dots */}
            {fastingPoints.map((pt) => (
              <g
                key={pt.log.id}
                className="group/dot cursor-pointer"
                onMouseEnter={() => setHoveredDot({ x: pt.x, y: pt.y, log: pt.log })}
                onMouseLeave={() => setHoveredDot(null)}
              >
                <circle cx={pt.x} cy={pt.y} r="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                <circle cx={pt.x} cy={pt.y} r="9" fill="#06b6d4" opacity="0" className="hover:opacity-20 transition-opacity" />
              </g>
            ))}

            {/* Post-Lunch Dots */}
            {lunchPoints.map((pt) => (
              <g
                key={pt.log.id}
                className="group/dot cursor-pointer"
                onMouseEnter={() => setHoveredDot({ x: pt.x, y: pt.y, log: pt.log })}
                onMouseLeave={() => setHoveredDot(null)}
              >
                <circle cx={pt.x} cy={pt.y} r="4" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                <circle cx={pt.x} cy={pt.y} r="9" fill="#10b981" opacity="0" className="hover:opacity-20 transition-opacity" />
              </g>
            ))}

            {/* Post-Dinner Dots */}
            {dinnerPoints.map((pt) => (
              <g
                key={pt.log.id}
                className="group/dot cursor-pointer"
                onMouseEnter={() => setHoveredDot({ x: pt.x, y: pt.y, log: pt.log })}
                onMouseLeave={() => setHoveredDot(null)}
              >
                <circle cx={pt.x} cy={pt.y} r="4" fill="#0f172a" stroke="#f43f5e" strokeWidth="2" />
                <circle cx={pt.x} cy={pt.y} r="9" fill="#f43f5e" opacity="0" className="hover:opacity-20 transition-opacity" />
              </g>
            ))}
          </svg>

          {/* Interactive Absolute Floating Tooltip */}
          {hoveredDot && (
            <div
              className="absolute z-30 pointer-events-none p-3 rounded-xl bg-slate-950/95 border border-slate-800/80 backdrop-blur-md shadow-2xl text-[10px] flex flex-col gap-1 transition-all duration-150 animate-modal-scale-in"
              style={{
                left: `${(hoveredDot.x / chartWidth) * 100}%`,
                top: `${hoveredDot.y - 72}px`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="flex items-center gap-2 justify-between">
                <span className="text-[8px] font-black text-slate-500 uppercase">
                  {new Date(hoveredDot.log.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${getClassification(hoveredDot.log.value, hoveredDot.log.slot).color}`}>
                  {getClassification(hoveredDot.log.value, hoveredDot.log.slot).label}
                </span>
              </div>
              <div className="flex items-center gap-0.5 text-slate-200 font-extrabold mt-0.5">
                <span className="text-xs text-white font-black">{hoveredDot.log.value}</span>
                <span className="text-[8.5px] text-slate-400 font-bold">mg/dL</span>
              </div>
              <div className="text-[8.5px] text-slate-400 flex items-center gap-1">
                <span className="flex items-center">{renderSlotIcon(hoveredDot.log.slot, 12)}</span>
                <span className="font-semibold text-slate-300">{slotConfigs[hoveredDot.log.slot].label}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Handle detailed logbook rendering
  const getFilteredLogsForHistory = () => {
    const sorted = [...logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // newest first
    if (historyFilter === "all") return sorted;
    return sorted.filter((l) => l.slot === historyFilter);
  };

  const filteredHistoryLogs = getFilteredLogsForHistory();

  return (
    <div className="glass-card p-8 bg-slate-800/40 border border-slate-700/30 rounded-3xl relative overflow-hidden backdrop-blur-xl flex flex-col gap-6">
      {/* Glow highlight */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Gestational Diabetes Tracker
          </span>
          <h2 className="text-2xl font-black text-white mt-1">Daily Blood Sugar Logs</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="hidden sm:inline px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-850 text-slate-300 font-semibold">
            Today: {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>

          {/* Toggle buttons for record, chart, and logbook */}
          <div className="flex bg-slate-950/60 p-0.5 rounded-xl border border-slate-850 shadow-inner">
            <button
              onClick={() => setActiveView("record")}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${activeView === "record"
                ? "bg-slate-800 text-cyan-400 border border-cyan-500/10 shadow-sm"
                : "text-slate-500 hover:text-slate-350"
                }`}
              title="Record Blood Sugar"
            >
              <DropIcon size={12} weight="bold" /> <span>Record</span>
            </button>
            <button
              onClick={() => setActiveView("chart")}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${activeView === "chart"
                ? "bg-slate-800 text-cyan-400 border border-cyan-500/10 shadow-sm"
                : "text-slate-500 hover:text-slate-350"
                }`}
              title="Toggle Trend Chart"
            >
              <ChartLineIcon size={12} weight="bold" /> <span>Graph</span>
            </button>
            <button
              onClick={() => setActiveView("history")}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${activeView === "history"
                ? "bg-slate-800 text-emerald-400 border border-emerald-500/10 shadow-sm"
                : "text-slate-500 hover:text-slate-350"
                }`}
              title="Toggle Historical Logbook"
            >
              <BookOpenIcon size={12} weight="bold" /> <span>Logbook</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up Edit Form (Inline drawer modal layout) */}
      {editingLog && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 animate-modal-scale-in">
          <form onSubmit={handleEditReading}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                Edit {slotConfigs[editingLog.slot].label} Reading on {formatLogDate(editingLog.date)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingLog(null);
                  setInputValue("");
                }}
                className="text-slate-500 hover:text-slate-350 text-xs font-bold px-2 py-1 rounded bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="Blood sugar level (e.g. 95)"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-bold focus:shadow-md focus:shadow-indigo-500/10 text-sm h-12"
                  autoFocus
                  required
                />
                <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-500">mg/dL</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-md shadow-indigo-500/10 h-12 flex items-center justify-center min-w-[120px] transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update Log"}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Note: Healthy gestational threshold is {editingLog.slot === "fasting" ? "< 95 mg/dL" : "< 140 mg/dL"}.
            </p>
          </form>
        </div>
      )}

      {/* 3 Slots Logger grid */}
      {activeView === "record" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Slot 1: Fasting */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-850 flex flex-col justify-between min-h-[140px] hover:border-slate-800 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-450 text-[11px] font-semibold flex items-center gap-1">
                    <SunHorizonIcon size={14} weight="bold" className="text-cyan-400" />
                    <span>Fasting</span>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-200">Before Breakfast</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">Clinical Target: &lt; 95 mg/dL</p>
              </div>

              {fastingReading ? (
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-white">{fastingReading.value}</span>
                    <span className="text-[10px] text-slate-500 font-bold ml-1">mg/dL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${getClassification(fastingReading.value, "fasting").color}`}>
                      {getClassification(fastingReading.value, "fasting").label}
                    </span>
                    <button
                      onClick={() => handleStartEdit(fastingReading)}
                      className="text-slate-500 hover:text-indigo-400 p-1.5 rounded hover:bg-slate-850 transition-colors cursor-pointer flex items-center justify-center"
                      title="Edit log"
                    >
                      <PencilSimple size={14} weight="bold" />
                    </button>
                    <button
                      onClick={() => handleDeleteReading(fastingReading.id)}
                      className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-850 transition-colors cursor-pointer flex items-center justify-center"
                      title="Remove log"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveSlot("fasting");
                    setEditingLog(null);
                    setInputValue("");
                  }}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-indigo-400 hover:text-indigo-300 border border-slate-750 hover:border-slate-700 font-extrabold text-[11.5px] transition-all cursor-pointer text-center"
                >
                  + Log Reading
                </button>
              )}
            </div>

            {/* Slot 2: Post-Lunch */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-850 flex flex-col justify-between min-h-[140px] hover:border-slate-800 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-450 text-[11px] font-semibold flex items-center gap-1">
                    <SunIcon size={14} weight="bold" className="text-emerald-400" />
                    <span>Mid-day</span>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-200">1h Post-Lunch</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">Clinical Target: &lt; 140 mg/dL</p>
              </div>

              {lunchReading ? (
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-white">{lunchReading.value}</span>
                    <span className="text-[10px] text-slate-500 font-bold ml-1">mg/dL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${getClassification(lunchReading.value, "post-lunch").color}`}>
                      {getClassification(lunchReading.value, "post-lunch").label}
                    </span>
                    <button
                      onClick={() => handleStartEdit(lunchReading)}
                      className="text-slate-500 hover:text-indigo-400 p-1.5 rounded hover:bg-slate-850 transition-colors cursor-pointer flex items-center justify-center"
                      title="Edit log"
                    >
                      <PencilSimple size={14} weight="bold" />
                    </button>
                    <button
                      onClick={() => handleDeleteReading(lunchReading.id)}
                      className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-850 transition-colors cursor-pointer flex items-center justify-center"
                      title="Remove log"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveSlot("post-lunch");
                    setEditingLog(null);
                    setInputValue("");
                  }}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-indigo-400 hover:text-indigo-300 border border-slate-750 hover:border-slate-700 font-extrabold text-[11.5px] transition-all cursor-pointer text-center"
                >
                  + Log Reading
                </button>
              )}
            </div>

            {/* Slot 3: Post-Dinner */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-850 flex flex-col justify-between min-h-[140px] hover:border-slate-800 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-450 text-[11px] font-semibold flex items-center gap-1">
                    <MoonIcon size={14} weight="bold" className="text-rose-400" />
                    <span>Evening</span>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-200">1h Post-Dinner</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">Clinical Target: &lt; 140 mg/dL</p>
              </div>

              {dinnerReading ? (
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-white">{dinnerReading.value}</span>
                    <span className="text-[10px] text-slate-500 font-bold ml-1">mg/dL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${getClassification(dinnerReading.value, "post-dinner").color}`}>
                      {getClassification(dinnerReading.value, "post-dinner").label}
                    </span>
                    <button
                      onClick={() => handleStartEdit(dinnerReading)}
                      className="text-slate-500 hover:text-indigo-400 p-1.5 rounded hover:bg-slate-850 transition-colors cursor-pointer flex items-center justify-center"
                      title="Edit log"
                    >
                      <PencilSimple size={14} weight="bold" />
                    </button>
                    <button
                      onClick={() => handleDeleteReading(dinnerReading.id)}
                      className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-850 transition-colors cursor-pointer flex items-center justify-center"
                      title="Remove log"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveSlot("post-dinner");
                    setEditingLog(null);
                    setInputValue("");
                  }}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-indigo-400 hover:text-indigo-300 border border-slate-750 hover:border-slate-700 font-extrabold text-[11.5px] transition-all cursor-pointer text-center"
                >
                  + Log Reading
                </button>
              )}
            </div>
          </div>

          {/* Pop-up Log Form (Inline drawer modal layout) */}
          {activeSlot && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 animate-modal-scale-in">
              <form onSubmit={handleLogReading}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                    Log Reading for {activeSlot === "fasting" ? "Fasting" : activeSlot === "post-lunch" ? "Post-Lunch" : "Post-Dinner"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSlot(null)}
                    className="text-slate-500 hover:text-slate-350 text-xs font-bold px-2 py-1 rounded bg-slate-800 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      placeholder="Blood sugar level (e.g. 95)"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-bold focus:shadow-md focus:shadow-indigo-500/10 text-sm h-12"
                      autoFocus
                      required
                    />
                    <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-500">mg/dL</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-md shadow-indigo-500/10 h-12 flex items-center justify-center min-w-[120px] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Log"}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  Note: Healthy gestational threshold is {activeSlot === "fasting" ? "< 95 mg/dL" : "< 140 mg/dL"}. Logs will immediately plot to your analysis trendline.
                </p>
              </form>
            </div>
          )}
        </>
      )}

      {/* SVG Chart display panel */}
      {activeView === "chart" && renderSVGChart()}

      {/* Detailed Logbook History Section */}
      {activeView === "history" && (
        <div className="flex flex-col gap-3 animate-modal-scale-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 pt-6 border-t border-slate-800/60">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen size={16} weight="bold" className="text-emerald-400" />
                <span>Historical Logbook</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">View and manage all historical records</p>
            </div>

            <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-850 flex-wrap gap-0.5">
              <button
                onClick={() => setHistoryFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer ${historyFilter === "all"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-350"
                  }`}
              >
                All Logs
              </button>
              <button
                onClick={() => setHistoryFilter("fasting")}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${historyFilter === "fasting"
                  ? "bg-cyan-950/50 text-cyan-400 border border-cyan-800/30"
                  : "text-slate-500 hover:text-slate-350"
                  }`}
              >
                <SunHorizon size={12} weight="bold" />
                <span>Fasting</span>
              </button>
              <button
                onClick={() => setHistoryFilter("post-lunch")}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${historyFilter === "post-lunch"
                  ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/30"
                  : "text-slate-500 hover:text-slate-350"
                  }`}
              >
                <Sun size={12} weight="bold" />
                <span>Lunch</span>
              </button>
              <button
                onClick={() => setHistoryFilter("post-dinner")}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${historyFilter === "post-dinner"
                  ? "bg-rose-950/50 text-rose-400 border border-rose-800/30"
                  : "text-slate-500 hover:text-slate-350"
                  }`}
              >
                <Moon size={12} weight="bold" />
                <span>Dinner</span>
              </button>
            </div>
          </div>

          {/* Scrollable list of logs */}
          {filteredHistoryLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-900/20 border border-slate-850/50 border-dashed rounded-2xl text-slate-500 text-xs p-4">
              <span>🔎 No historical readings matching this slot selection.</span>
              <span className="mt-1 opacity-70">New readings logged will show up here.</span>
            </div>
          ) : (
            <div className="max-h-[220px] overflow-y-auto scrollbar-thin pr-1.5 flex flex-col gap-2">
              {filteredHistoryLogs.map((log) => {
                const config = slotConfigs[log.slot];
                const classification = getClassification(log.value, log.slot);
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-850/30 hover:bg-slate-900/60 hover:border-slate-800 transition-all group/row"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-950 border ${config.borderClass}`}>
                        {renderSlotIcon(log.slot, 16)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white capitalize">{config.label}</span>
                          <span className="text-[9px] text-slate-500 font-medium">
                            {formatLogTime(log.timestamp)}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatLogDate(log.date)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm font-black text-white">{log.value}</span>
                        <span className="text-[9px] text-slate-500 font-bold ml-1">mg/dL</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border ${classification.color}`}>
                        {classification.label}
                      </span>
                      <button
                        onClick={() => handleStartEdit(log)}
                        className="text-slate-500 hover:text-indigo-400 hover:bg-slate-800/80 p-1.5 rounded transition-all cursor-pointer opacity-40 group-hover/row:opacity-100 flex items-center justify-center"
                        title="Edit entry"
                      >
                        <PencilSimple size={14} weight="bold" />
                      </button>
                      <button
                        onClick={() => handleDeleteReading(log.id)}
                        className="text-slate-500 hover:text-red-400 hover:bg-slate-800/80 p-1.5 rounded transition-all cursor-pointer opacity-40 group-hover/row:opacity-100 flex items-center justify-center"
                        title="Delete entry"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!user && isClient && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-[10px] font-semibold text-amber-400 animate-pulse">
          <div className="flex items-center gap-2">
            <Warning size={14} weight="bold" className="shrink-0 text-amber-400" />
            <span>Guest Preview Mode: Blood sugar levels will remain locally inside this browser.</span>
          </div>
          <button
            onClick={triggerAuthModal}
            className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors cursor-pointer text-center"
          >
            Sync
          </button>
        </div>
      )}
    </div>
  );
}

