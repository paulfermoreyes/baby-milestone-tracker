"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Calendar, ArrowUpRight, Crown, Sparkle } from "@phosphor-icons/react";

interface BaptismSummaryCardProps {
  mode: "large" | "small";
}

interface Invitee {
  id: string;
  name: string;
  role: string;
  status: string;
}

export default function BaptismSummaryCard({ mode }: BaptismSummaryCardProps) {
  const { user, familyId } = useAuth();
  const [date, setDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (!user) {
      // Guest local storage fallback
      const localData = localStorage.getItem("lumina_guest_baptism");
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setDate(parsed.date || "");
          setVenueName(parsed.venueName || "");
          setInvitees(parsed.invitees || []);
        } catch (e) {
          console.error("Failed to parse guest baptism data inside summary card", e);
        }
      }
      return;
    }

    const docRef = familyId
      ? doc(db, "families", familyId, "baptism", "event")
      : doc(db, "baptism", user.uid);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDate(data.date || "");
          setVenueName(data.venueName || "");
          setInvitees(data.invitees || []);
        }
      },
      (err) => {
        console.error("Error reading baptism event in summary card:", err);
      }
    );

    return () => unsubscribe();
  }, [user, familyId, isClient]);

  // Calculations
  const totalInvitees = invitees.length;
  const confirmedCount = invitees.filter((inv) => inv.status === "confirmed").length;
  const rsvpRate = totalInvitees > 0 ? Math.round((confirmedCount / totalInvitees) * 100) : 0;

  const godparents = invitees.filter((inv) => inv.role === "godfather" || inv.role === "godmother");
  const godparentsConfirmed = godparents.filter((inv) => inv.status === "confirmed").length;
  const godparentsTotal = godparents.length;

  const getCountdownText = () => {
    if (!date) return "";
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today! 🎉";
    } else if (diffDays > 0) {
      return `${diffDays}d to go ⏳`;
    } else {
      return "Done ✅";
    }
  };

  const getFormattedDateShort = () => {
    if (!date) return "Not scheduled yet";
    const [year, month, day] = date.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Large Detailed Card Render
  if (mode === "large") {
    return (
      <div className="glass-card p-6 bg-slate-800/40 border border-slate-700/30 rounded-3xl relative overflow-hidden flex flex-col justify-between h-full group hover:border-purple-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-450 dark:text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Sparkle size={16} weight="fill" className="text-purple-400" />
            <span>Baptism Event</span>
          </span>
          <Link
            href="/trackers/baptism"
            className="w-7 h-7 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-purple-400 transition-colors cursor-pointer"
            title="Open Organizer"
          >
            <ArrowUpRight size={14} weight="bold" />
          </Link>
        </div>

        {/* Card Main Info */}
        <div className="my-2 text-left space-y-1">
          <div className="flex items-baseline justify-between">
            <h4 className="text-lg font-black text-white truncate max-w-[180px]">
              {venueName || "Set Date & Venue"}
            </h4>
            {date && (
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 shrink-0">
                {getCountdownText()}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">{getFormattedDateShort()}</p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-850/40 mt-4">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">RSVP Rate</span>
              <span className="text-lg font-black text-white">{rsvpRate}%</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {confirmedCount}/{totalInvitees} Guests
              </span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Godparents</span>
              <span className="text-lg font-black text-white flex items-center gap-1">
                <Crown size={14} weight="fill" className="text-pink-400" />
                {godparentsConfirmed}/{godparentsTotal}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Confirmed RSVP</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href="/trackers/baptism"
          className="w-full mt-5 py-2.5 px-4 rounded-xl font-extrabold text-xs text-center border border-slate-800 bg-slate-900/60 text-purple-450 hover:text-purple-350 hover:border-slate-700 hover:bg-slate-950 transition-all duration-150 flex items-center justify-center gap-1.5"
        >
          <span>Organize Guest List</span>
        </Link>
      </div>
    );
  }

  // Small Compact Row Render
  return (
    <Link
      href="/trackers/baptism"
      className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 hover:bg-slate-900/50 border border-slate-850 hover:border-slate-800/80 transition-all duration-150 group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Calendar size={18} weight="bold" className="text-purple-400" />
        </div>
        <div className="text-left">
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest">Baptism Event</h4>
          <span className="text-[10px] text-slate-500 font-bold block mt-0.5 truncate max-w-[130px] sm:max-w-none">
            {venueName || "Organizer"} • {getFormattedDateShort()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-lg font-black text-white">{rsvpRate}%</span>
          <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">RSVP</span>
        </div>
        <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-purple-450 group-hover:border-purple-500/30 transition-colors">
          <ArrowUpRight size={12} weight="bold" />
        </div>
      </div>
    </Link>
  );
}
