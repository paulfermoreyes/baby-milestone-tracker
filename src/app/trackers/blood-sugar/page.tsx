"use client";

import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react";
import AppShell from "@/components/AppShell";
import BloodSugarTracker from "@/components/BloodSugarTracker";

export default function BloodSugarPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <div className="mb-6 text-left">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-450 hover:text-indigo-450 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
          >
            <CaretLeft size={14} weight="bold" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Blood Sugar Tracker */}
        <BloodSugarTracker />
      </div>
    </AppShell>
  );
}
