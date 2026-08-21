"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useBaby } from "@/context/BabyContext";
import {
  PREDEFINED_MILESTONES,
  MilestoneCategory,
  subscribeMilestones,
  toggleMilestoneAchievement,
  AchievementRecord,
} from "@/lib/baby";
import { Trophy, CheckCircle, Circle, Baby } from "@phosphor-icons/react";
import BabyProfileModal from "@/components/baby/BabyProfileModal";

export default function BabyMilestonesPage() {
  const { user, familyId } = useAuth();
  const { baby } = useBaby();

  const [achievements, setAchievements] = useState<
    Record<string, AchievementRecord>
  >({});
  const [selectedAge, setSelectedAge] = useState<number | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    if (!user || !baby?.id) return;
    const unsub = subscribeMilestones(familyId, user.uid, baby.id, setAchievements);
    return () => unsub();
  }, [user, familyId, baby?.id]);

  if (!baby) {
    return (
      <AppShell>
        <div className="glass-card p-10 rounded-3xl bg-slate-950/60 border border-slate-800 text-center max-w-xl mx-auto my-12 text-slate-100">
          <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Trophy size={32} weight="bold" />
          </div>
          <h3 className="text-2xl font-extrabold text-white mb-2">
            Baby Milestone Tracker
          </h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Record first smiles, rolling over, babbling, sitting unsupported, and first steps. Please create your baby profile first.
          </p>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="py-3 px-6 rounded-2xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-extrabold text-sm shadow-lg active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
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

  const handleToggle = async (milestone: MilestoneCategory) => {
    if (!user || !baby.id) return;
    try {
      await toggleMilestoneAchievement(familyId, user.uid, baby.id, milestone.id);
    } catch (e) {
      console.error("Failed to toggle milestone", e);
    }
  };

  const filteredMilestones = PREDEFINED_MILESTONES.filter((m) => {
    if (selectedAge !== "all" && m.targetAgeMonths !== selectedAge) return false;
    if (selectedCategory !== "all" && m.category !== selectedCategory) return false;
    return true;
  });

  const unlockedCount = Object.keys(achievements).length;
  const totalCount = PREDEFINED_MILESTONES.length;
  const percentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <AppShell>
      <div className="space-y-8 text-slate-100 text-left animate-fade-in">
        {/* Header */}
        <div className="glass-card p-6 md:p-8 rounded-3xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400">
                <Trophy size={24} weight="bold" />
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                {baby.name}&apos;s Milestones
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-2 max-w-xl">
              Track 0–12 month developmental achievements recommended by WHO & CDC guidelines.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="w-full md:w-64 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-extrabold">
              <span className="text-slate-300">Overall Progress</span>
              <span className="text-pink-400">{unlockedCount} / {totalCount} ({percentage}%)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Age Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400">Age:</span>
            {["all", 2, 4, 6, 9, 12].map((age) => (
              <button
                key={age}
                onClick={() => setSelectedAge(age as number | "all")}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedAge === age
                    ? "bg-pink-500 text-slate-950 font-extrabold shadow-sm"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {age === "all" ? "All Ages" : `${age}m`}
              </button>
            ))}
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
            >
              <option value="all">All Categories</option>
              <option value="motor">Motor Skills</option>
              <option value="cognitive">Cognitive & Language</option>
              <option value="social">Social & Emotional</option>
              <option value="sensory">Sensory</option>
            </select>
          </div>
        </div>

        {/* Milestone Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMilestones.map((m) => {
            const isUnlocked = Boolean(achievements[m.id]);
            const achievement = achievements[m.id];
            return (
              <div
                key={m.id}
                onClick={() => handleToggle(m)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  isUnlocked
                    ? "bg-pink-500/10 border-pink-500/40 text-white shadow-lg shadow-pink-500/5"
                    : "bg-slate-950/40 border-slate-850 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="mt-0.5">
                  {isUnlocked ? (
                    <CheckCircle size={26} weight="fill" className="text-pink-400" />
                  ) : (
                    <Circle size={26} weight="regular" className="text-slate-600" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-base font-extrabold text-white">
                      {m.title}
                    </h4>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {m.targetAgeMonths}m target
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {m.description}
                  </p>
                  {isUnlocked && achievement?.achievedDate ? (
                    <span className="inline-block mt-2 text-[10px] font-bold text-pink-300">
                      ✨ Achieved on {achievement.achievedDate}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
