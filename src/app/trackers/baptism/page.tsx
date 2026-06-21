"use client";

import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react";
import AppShell from "@/components/AppShell";
import BaptismOrganizer from "@/components/BaptismOrganizer";

export default function BaptismPage() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <div className="mb-6 text-left">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-450 hover:text-purple-450 dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
          >
            <CaretLeft size={14} weight="bold" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Baptism Organizer Event Planner */}
        <div className="text-center md:text-left mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white">
            Baptismal Event Organizer
          </h2>
          <p className="text-sm leading-relaxed max-w-2xl text-slate-400">
            Coordinate the baptism ceremony details and invitees. Set the date and venue, invite godfathers and godmothers, and track RSVPs in real time.
          </p>
        </div>

        <BaptismOrganizer />
      </div>
    </AppShell>
  );
}
