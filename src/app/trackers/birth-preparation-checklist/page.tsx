"use client";

import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react";
import AppShell from "@/components/AppShell";
import BirthChecklist from "@/components/BirthChecklist";

export default function BirthChecklistPage() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <div className="mb-6 text-left">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-450 hover:text-emerald-450 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
          >
            <CaretLeft size={14} weight="bold" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Page heading */}
        <div className="text-center md:text-left mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white">
            Birth Preparation Checklist
          </h2>
          <p className="text-sm leading-relaxed max-w-2xl text-slate-400">
            Track everything you need before baby arrives. Drag items between
            <strong className="text-slate-200"> Not Ready</strong> and{" "}
            <strong className="text-slate-200"> Ready</strong>, and drop items
            into the{" "}
            <strong className="text-slate-200">Hospital Bag</strong> zone when
            you&apos;re packing for birth day.
          </p>
        </div>

        <BirthChecklist />
      </div>
    </AppShell>
  );
}
