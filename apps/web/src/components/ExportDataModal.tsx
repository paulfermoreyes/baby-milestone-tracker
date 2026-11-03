"use client";

import { useState } from "react";
import { X, FileCsv, FileCode, CheckCircle, Spinner, DownloadSimple } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useBaby } from "@/context/BabyContext";
import { db } from "@/lib/firebase";
import {
  fetchClinicalExportData,
  downloadPediatricCSV,
  downloadJSON,
} from "@/lib/exportData";

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportDataModal({ isOpen, onClose }: ExportDataModalProps) {
  const { familyId } = useAuth();
  const { baby } = useBaby();

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async (format: "csv" | "json") => {
    if (!familyId) return;
    setLoading(true);
    setSuccessMessage(null);

    try {
      const bundle = await fetchClinicalExportData(db, familyId, baby);
      if (format === "csv") {
        downloadPediatricCSV(bundle, baby ? `${baby.name.toLowerCase()}-pediatric-report` : "family-health-report");
        setSuccessMessage("Pediatric CSV report downloaded successfully!");
      } else {
        downloadJSON(bundle, baby ? `${baby.name.toLowerCase()}-clinical-backup` : "family-clinical-backup");
        setSuccessMessage("Full clinical JSON backup downloaded successfully!");
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export clinical data. Please check your network connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Export Clinical Data"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md p-6 rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-2xl text-left relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-850">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <DownloadSimple size={20} weight="bold" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Export Health Records
              </h3>
              <p className="text-[11px] text-slate-400">
                Ready for pediatric checkups and family archives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle size={18} weight="fill" className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Info */}
        <div className="my-5 space-y-2 text-xs text-slate-300">
          <p>
            Exports all recorded metrics including:
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
            <li>WHO Growth percentiles (Weight, Length, Head circumference)</li>
            <li>Daily Care Logs (Feedings, Diapers, Sleep)</li>
            <li>Prenatal records (Blood sugar, Symptoms, Maternal weight)</li>
          </ul>
        </div>

        {/* Format Selection Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleExport("csv")}
            disabled={loading}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 text-left transition-all cursor-pointer disabled:opacity-50 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileCsv size={24} weight="bold" />
            </div>
            <div className="text-xs font-black text-white">Pediatric CSV</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Spreadsheet for doctor review</div>
          </button>

          <button
            onClick={() => handleExport("json")}
            disabled={loading}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer disabled:opacity-50 group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileCode size={24} weight="bold" />
            </div>
            <div className="text-xs font-black text-white">Complete JSON</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Full structured backup</div>
          </button>
        </div>

        {/* Status / Close */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-850">
          <div className="text-[11px] text-slate-400">
            {loading && (
              <span className="flex items-center gap-1.5 text-purple-300">
                <Spinner size={14} className="animate-spin" />
                Preparing export bundle...
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
