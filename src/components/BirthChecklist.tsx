"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  Minus,
  Trash,
  CaretDown,
  CaretRight,
  Warning,
  BagSimple,
  CheckCircle,
  Circle,
  ArrowRight,
  Sparkle,
  X,
  DotsNine,
  UserCircle,
  CurrencyDollar,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemStatus = "pending" | "ready" | "in-bag";

interface ChecklistItem {
  id: string;
  label: string;
  status: ItemStatus;
  addedBy?: string;
  quantity?: number;
  cost?: number;
  costMode?: "unit" | "total";
}

interface Category {
  id: string;
  name: string;
  emoji: string;
  items: ChecklistItem[];
}

interface ChecklistDocument {
  categories: Category[];
  updatedAt?: unknown;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getItemQuantity(item: ChecklistItem): number {
  return typeof item.quantity === "number" && item.quantity > 0
    ? item.quantity
    : 1;
}

function getItemUnitCost(item: ChecklistItem): number {
  if (typeof item.cost !== "number" || isNaN(item.cost) || item.cost <= 0)
    return 0;
  const qty = getItemQuantity(item);
  return item.costMode === "total" ? item.cost / qty : item.cost;
}

function getItemTotalCost(item: ChecklistItem): number {
  if (typeof item.cost !== "number" || isNaN(item.cost) || item.cost <= 0)
    return 0;
  const qty = getItemQuantity(item);
  return item.costMode === "total" ? item.cost : item.cost * qty;
}

// ─── Default seed data ────────────────────────────────────────────────────────

function makeId() {
  return Math.random().toString(36).substring(2, 10);
}

function makeSeedCategories(): Category[] {
  const seed: Array<{ name: string; emoji: string; items: string[] }> = [
    {
      name: "Nursery & Sleep",
      emoji: "🛏️",
      items: ["Crib / bassinet", "Mattress", "Bedding set", "Baby monitor"],
    },
    {
      name: "Feeding",
      emoji: "🍼",
      items: ["Breast pump", "Bottles", "Burp cloths", "Nursing pillow"],
    },
    {
      name: "Clothing",
      emoji: "👕",
      items: [
        "Onesies (newborn)",
        "Onesies (0–3 M)",
        "Sleepers",
        "Socks",
        "Hats",
      ],
    },
    {
      name: "Bath & Hygiene",
      emoji: "🛁",
      items: [
        "Baby bathtub",
        "Gentle shampoo / wash",
        "Nail trimmer",
        "Hooded towels",
      ],
    },
    {
      name: "Health & Safety",
      emoji: "🏥",
      items: [
        "Thermometer",
        "Baby first-aid kit",
        "Car seat",
        "Baby-proofing kit",
      ],
    },
    {
      name: "Mom Recovery",
      emoji: "💊",
      items: [
        "Postpartum pads",
        "Nipple cream",
        "Stool softener",
        "Comfortable PJs",
      ],
    },
  ];

  return seed.map((cat) => ({
    id: makeId(),
    name: cat.name,
    emoji: cat.emoji,
    items: cat.items.map((label) => ({
      id: makeId(),
      label,
      status: "pending" as ItemStatus,
      quantity: 1,
    })),
  }));
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

function getDocRef(user: { uid: string } | null, familyId: string | null) {
  if (!user) return null;
  if (familyId) return doc(db, "families", familyId, "checklist", "data");
  return doc(db, "users", user.uid, "checklist", "data");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OverallProgressBar({
  categories,
  onResetSession,
}: {
  categories: Category[];
  onResetSession: () => void;
}) {
  const allItems = categories.flatMap((c) => c.items);
  const totalItemsCount = allItems.length;
  const readyItemsCount = allItems.filter(
    (i) => i.status === "ready" || i.status === "in-bag",
  ).length;

  const totalInventoryQty = allItems.reduce(
    (sum, i) => sum + getItemQuantity(i),
    0,
  );
  const readyInventoryQty = allItems
    .filter((i) => i.status === "ready" || i.status === "in-bag")
    .reduce((sum, i) => sum + getItemQuantity(i), 0);

  const totalBudget = allItems.reduce((sum, i) => sum + getItemTotalCost(i), 0);
  const readyBudget = allItems
    .filter((i) => i.status === "ready" || i.status === "in-bag")
    .reduce((sum, i) => sum + getItemTotalCost(i), 0);

  const pct =
    totalItemsCount === 0
      ? 0
      : Math.round((readyItemsCount / totalItemsCount) * 100);

  return (
    <div className="glass-card p-5 bg-slate-800/30 border border-slate-700/30 rounded-2xl mb-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkle size={13} weight="fill" className="text-emerald-400" />
          Overall Progress & Inventory
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-emerald-400">
            {readyItemsCount} / {totalItemsCount} ready ({pct}%)
          </span>
          <button
            onClick={onResetSession}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl px-2.5 py-1 transition-all cursor-pointer"
            title="Reset Session / Checklist"
          >
            <ArrowCounterClockwise size={13} weight="bold" />
            <span>Reset Session</span>
          </button>
        </div>
      </div>

      <div className="w-full h-2.5 rounded-full bg-slate-900/70 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
        <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            Inventory Units
          </span>
          <span className="text-sm font-black text-slate-200">
            {readyInventoryQty} / {totalInventoryQty}{" "}
            <span className="text-xs font-semibold text-slate-400">items</span>
          </span>
        </div>

        <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            Est. Total Cost
          </span>
          <span className="text-sm font-black text-emerald-400">
            ${totalBudget.toFixed(2)}
          </span>
        </div>

        <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60 col-span-2 sm:col-span-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            Ready Items Cost
          </span>
          <span className="text-sm font-black text-teal-300">
            ${readyBudget.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface DraggableItemProps {
  item: ChecklistItem;
  categoryId: string;
  onDelete: () => void;
  onUpdateQuantity: (newQty: number) => void;
  onUpdateCost: (cost: number | undefined, costMode: "unit" | "total") => void;
  onDragStart: (e: React.DragEvent) => void;
  userDisplayName?: string | null;
}

function DraggableItem({
  item,
  categoryId,
  onDelete,
  onUpdateQuantity,
  onUpdateCost,
  onDragStart,
  userDisplayName,
}: DraggableItemProps) {
  const [showCostEdit, setShowCostEdit] = useState(false);
  const [costInput, setCostInput] = useState(
    typeof item.cost === "number" && item.cost > 0 ? item.cost.toString() : "",
  );
  const [costMode, setCostMode] = useState<"unit" | "total">(
    item.costMode || "unit",
  );

  const isReady = item.status === "ready";
  const qty = getItemQuantity(item);
  const totalCost = getItemTotalCost(item);
  const unitCost = getItemUnitCost(item);

  const handleSaveCost = () => {
    const val = parseFloat(costInput);
    if (!isNaN(val) && val > 0) {
      onUpdateCost(val, costMode);
    } else {
      onUpdateCost(undefined, "unit");
    }
    setShowCostEdit(false);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      data-item-id={item.id}
      data-category-id={categoryId}
      className={`group flex flex-col gap-2 p-3 rounded-xl border transition-all duration-150 cursor-grab active:cursor-grabbing select-none
        ${
          isReady
            ? "bg-emerald-500/8 border-emerald-500/20 hover:border-emerald-500/35"
            : "bg-slate-900/40 border-slate-800/60 hover:border-slate-700/80"
        }`}
    >
      <div className="flex items-center gap-2.5">
        {/* Drag handle */}
        <DotsNine
          size={14}
          className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0"
        />

        {/* Status icon */}
        {isReady ? (
          <CheckCircle
            size={15}
            weight="fill"
            className="text-emerald-400 shrink-0"
          />
        ) : (
          <Circle size={15} className="text-slate-600 shrink-0" />
        )}

        {/* Label */}
        <span
          className={`flex-1 text-xs font-semibold leading-tight ${
            isReady
              ? "text-emerald-300 line-through decoration-emerald-500/40"
              : "text-slate-200"
          }`}
        >
          {item.label}
        </span>

        {/* Quantity Counter */}
        <div
          className="flex items-center gap-1 bg-slate-950/70 border border-slate-800/80 rounded-lg px-1.5 py-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onUpdateQuantity(Math.max(1, qty - 1))}
            disabled={qty <= 1}
            className="text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer p-0.5"
            title="Decrease quantity"
          >
            <Minus size={10} weight="bold" />
          </button>
          <span className="text-[10px] font-black text-amber-400 px-1 min-w-[14px] text-center">
            {qty}
          </span>
          <button
            onClick={() => onUpdateQuantity(qty + 1)}
            className="text-slate-400 hover:text-white cursor-pointer p-0.5"
            title="Increase quantity"
          >
            <Plus size={10} weight="bold" />
          </button>
        </div>

        {/* Cost button / badge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowCostEdit((prev) => !prev);
          }}
          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
            totalCost > 0
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
              : "bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
          }`}
          title="Specify item cost"
        >
          <CurrencyDollar size={11} weight="bold" />
          <span>
            {totalCost > 0
              ? `$${totalCost.toFixed(2)}${qty > 1 ? ` ($${unitCost.toFixed(2)}/ea)` : ""}`
              : "Cost"}
          </span>
        </button>

        {/* Attribution badge */}
        {item.addedBy && (
          <span className="hidden group-hover:flex items-center gap-0.5 text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-1.5 py-0.5 shrink-0">
            <UserCircle size={9} weight="fill" />
            {item.addedBy === userDisplayName ? "you" : item.addedBy}
          </span>
        )}

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
          title="Remove item"
        >
          <Trash size={11} weight="bold" />
        </button>
      </div>

      {/* Cost Edit Inline Card */}
      {showCostEdit && (
        <div
          className="mt-1 p-2.5 bg-slate-950/90 border border-slate-700/60 rounded-xl flex items-center gap-2 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 flex-1">
            <span className="text-slate-500 font-bold">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveCost();
              }}
              className="w-full bg-transparent text-slate-200 text-xs font-bold focus:outline-none placeholder-slate-600"
            />
          </div>

          {/* Mode Switcher */}
          <div className="flex rounded-lg border border-slate-800 p-0.5 bg-slate-900">
            <button
              onClick={() => setCostMode("unit")}
              className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-colors cursor-pointer ${
                costMode === "unit"
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Cost for 1 item"
            >
              1 item
            </button>
            <button
              onClick={() => setCostMode("total")}
              className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-colors cursor-pointer ${
                costMode === "total"
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title={`Cost for all ${qty} items`}
            >
              {qty} count
            </button>
          </div>

          <button
            onClick={handleSaveCost}
            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider cursor-pointer"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

interface DropLaneProps {
  status: "pending" | "ready";
  children: React.ReactNode;
  onDrop: (e: React.DragEvent) => void;
  isDragTarget: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
}

function DropLane({
  status,
  children,
  onDrop,
  isDragTarget,
  onDragOver,
  onDragLeave,
}: DropLaneProps) {
  const isPending = status === "pending";
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`flex-1 min-h-[80px] rounded-xl p-3 border-2 border-dashed transition-all duration-200
        ${
          isDragTarget
            ? isPending
              ? "border-amber-400/60 bg-amber-500/8"
              : "border-emerald-400/60 bg-emerald-500/8"
            : "border-slate-700/40 bg-slate-900/20"
        }`}
    >
      {/* Lane header */}
      <div className="flex items-center gap-1.5 mb-2">
        {isPending ? (
          <Circle size={12} className="text-slate-500" />
        ) : (
          <CheckCircle size={12} weight="fill" className="text-emerald-400" />
        )}
        <span
          className={`text-[9px] font-black uppercase tracking-widest ${
            isPending ? "text-slate-500" : "text-emerald-400"
          }`}
        >
          {isPending ? "Not Ready" : "Ready"}
        </span>
      </div>
      <div className="space-y-1.5">{children}</div>
      {isDragTarget && (
        <div
          className={`mt-2 text-center text-[9px] font-bold ${
            isPending ? "text-amber-400" : "text-emerald-400"
          }`}
        >
          Drop here
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BirthChecklist() {
  const { user, familyId, userProfile, loading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Drag state
  const [draggingItem, setDraggingItem] = useState<{
    itemId: string;
    categoryId: string;
  } | null>(null);
  const [bagDragTarget, setBagDragTarget] = useState(false);
  const [laneDragTarget, setLaneDragTarget] = useState<{
    categoryId: string;
    status: "pending" | "ready";
  } | null>(null);

  // Add-item inputs per category
  const [addItemInputs, setAddItemInputs] = useState<Record<string, string>>(
    {},
  );

  // Add-category input
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📦");

  // Hospital Bag expanded
  const [bagExpanded, setBagExpanded] = useState(true);

  // Reset Modal state
  const [showResetModal, setShowResetModal] = useState(false);

  // Track if data was seeded / loaded for a specific path
  const loadedPathRef = useRef<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  // ── Persist helper ──────────────────────────────────────────────────────────

  const persist = useCallback(
    async (updated: Category[]) => {
      // Always store locally so guest session or offline access retains custom categories/items
      try {
        localStorage.setItem(
          "lumina_guest_checklist",
          JSON.stringify({ categories: updated }),
        );
      } catch (e) {
        console.error("Failed to write guest checklist to localStorage:", e);
      }

      if (!user) return;
      const ref = getDocRef(user, familyId);
      if (!ref) return;
      try {
        await setDoc(
          ref,
          { categories: updated, updatedAt: serverTimestamp() },
          { merge: true },
        );
      } catch (err) {
        console.error("Failed to save checklist:", err);
      }
    },
    [user, familyId],
  );

  // ── Mutation helpers ────────────────────────────────────────────────────────

  const mutate = useCallback(
    (updater: (prev: Category[]) => Category[]) => {
      setCategories((prev) => {
        const next = updater(prev);
        queueMicrotask(() => {
          persist(next);
        });
        return next;
      });
    },
    [persist],
  );

  // ── Initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isClient || loading) return;

    if (!user) {
      // Guest mode
      const raw = localStorage.getItem("lumina_guest_checklist");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as ChecklistDocument;
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCategories(parsed.categories || []);
          setExpandedCategories(
            new Set(parsed.categories?.map((c) => c.id) ?? []),
          );
        } catch {
          const seed = makeSeedCategories();
          setCategories(seed);
          setExpandedCategories(new Set(seed.map((c) => c.id)));
          localStorage.setItem(
            "lumina_guest_checklist",
            JSON.stringify({ categories: seed }),
          );
        }
      } else {
        const seed = makeSeedCategories();
        setCategories(seed);
        setExpandedCategories(new Set(seed.map((c) => c.id)));
        localStorage.setItem(
          "lumina_guest_checklist",
          JSON.stringify({ categories: seed }),
        );
      }
      setIsLoading(false);
      return;
    }

    // Authenticated — real-time Firestore
    const ref = getDocRef(user, familyId);
    if (!ref) {
      setIsLoading(false);
      return;
    }

    const currentPath = ref.path;
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as ChecklistDocument;
          setCategories(data.categories || []);
          if (loadedPathRef.current !== currentPath) {
            setExpandedCategories(
              new Set((data.categories || []).map((c) => c.id)),
            );
            loadedPathRef.current = currentPath;
          }
        } else if (loadedPathRef.current !== currentPath) {
          // First time for this user path — check if we have local guest categories to preserve & migrate
          loadedPathRef.current = currentPath;
          let initialCategories: Category[] = [];
          const localRaw =
            typeof window !== "undefined"
              ? localStorage.getItem("lumina_guest_checklist")
              : null;
          if (localRaw) {
            try {
              const parsed = JSON.parse(localRaw) as ChecklistDocument;
              if (
                Array.isArray(parsed.categories) &&
                parsed.categories.length > 0
              ) {
                initialCategories = parsed.categories;
              }
            } catch {
              // ignore parse error
            }
          }

          if (initialCategories.length === 0) {
            initialCategories = makeSeedCategories();
          }

          setCategories(initialCategories);
          setExpandedCategories(new Set(initialCategories.map((c) => c.id)));
          setDoc(
            ref,
            { categories: initialCategories, updatedAt: serverTimestamp() },
            { merge: true },
          ).catch(console.error);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Checklist snapshot error:", err);
        setIsLoading(false);
      },
    );

    return () => unsub();
  }, [user, familyId, isClient, loading]);

  // ── Drag handlers ───────────────────────────────────────────────────────────

  const handleDragStart = (
    e: React.DragEvent,
    itemId: string,
    categoryId: string,
  ) => {
    e.dataTransfer.setData("itemId", itemId);
    e.dataTransfer.setData("categoryId", categoryId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingItem({ itemId, categoryId });
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
    setBagDragTarget(false);
    setLaneDragTarget(null);
  };

  const handleLaneDrop = (
    e: React.DragEvent,
    targetCategoryId: string,
    targetStatus: "pending" | "ready",
  ) => {
    e.preventDefault();
    setLaneDragTarget(null);
    const itemId = e.dataTransfer.getData("itemId");
    const srcCategoryId = e.dataTransfer.getData("categoryId");
    if (!itemId || !srcCategoryId) return;

    mutate((prev) =>
      prev.map((cat) => {
        if (cat.id !== srcCategoryId) return cat;
        return {
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId ? { ...item, status: targetStatus } : item,
          ),
        };
      }),
    );
    setDraggingItem(null);
  };

  const handleBagDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setBagDragTarget(false);
    const itemId = e.dataTransfer.getData("itemId");
    const srcCategoryId = e.dataTransfer.getData("categoryId");
    if (!itemId || !srcCategoryId) return;

    mutate((prev) =>
      prev.map((cat) => {
        if (cat.id !== srcCategoryId) return cat;
        return {
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId ? { ...item, status: "in-bag" } : item,
          ),
        };
      }),
    );
    setDraggingItem(null);
  };

  // Drag chip OUT of bag → set to ready
  const handleBagChipDragStart = (
    e: React.DragEvent,
    itemId: string,
    categoryId: string,
  ) => {
    e.dataTransfer.setData("itemId", itemId);
    e.dataTransfer.setData("categoryId", categoryId);
    e.dataTransfer.setData("fromBag", "1");
    e.dataTransfer.effectAllowed = "move";
    setDraggingItem({ itemId, categoryId });
  };

  // ── Item / category mutations ────────────────────────────────────────────────

  const handleAddItem = (categoryId: string) => {
    const label = (addItemInputs[categoryId] || "").trim();
    if (!label) return;
    mutate((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: [
                ...cat.items,
                {
                  id: makeId(),
                  label,
                  status: "pending",
                  addedBy: userProfile?.displayName || undefined,
                },
              ],
            }
          : cat,
      ),
    );
    setAddItemInputs((prev) => ({ ...prev, [categoryId]: "" }));
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    mutate((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter((i) => i.id !== itemId) }
          : cat,
      ),
    );
  };

  const handleUpdateQuantity = (
    categoryId: string,
    itemId: string,
    newQty: number,
  ) => {
    mutate((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((i) =>
                i.id === itemId ? { ...i, quantity: newQty } : i,
              ),
            }
          : cat,
      ),
    );
  };

  const handleUpdateCost = (
    categoryId: string,
    itemId: string,
    cost: number | undefined,
    costMode: "unit" | "total",
  ) => {
    mutate((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((i) =>
                i.id === itemId ? { ...i, cost, costMode } : i,
              ),
            }
          : cat,
      ),
    );
  };

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    const newCat: Category = {
      id: makeId(),
      name,
      emoji: newCatEmoji || "📦",
      items: [],
    };
    mutate((prev) => [...prev, newCat]);
    setExpandedCategories((prev) => new Set([...prev, newCat.id]));
    setNewCatName("");
    setNewCatEmoji("📦");
  };

  const handleDeleteCategory = (categoryId: string) => {
    mutate((prev) => prev.filter((c) => c.id !== categoryId));
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const triggerAuthModal = () => {
    const dialog = document.querySelector(
      "dialog.auth-dialog",
    ) as HTMLDialogElement;
    if (dialog) dialog.showModal();
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const allInBag = categories.flatMap((cat) =>
    cat.items
      .filter((i) => i.status === "in-bag")
      .map((i) => ({ ...i, categoryId: cat.id })),
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!isClient || isLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">
            Loading checklist…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-40">
      {/* Guest mode banner */}
      {!user && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-xs font-semibold text-amber-400 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <Warning size={18} weight="bold" className="shrink-0" />
            <span>
              Guest Preview: Changes are saved locally and will be cleared on
              logout.
            </span>
          </div>
          <button
            onClick={triggerAuthModal}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold transition-all text-[10px] tracking-wider uppercase cursor-pointer"
          >
            Sync with Cloud
          </button>
        </div>
      )}

      {/* Real-time badge */}
      {user && familyId && (
        <p className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Shared in real-time with your partner
        </p>
      )}

      {/* Overall progress */}
      <OverallProgressBar
        categories={categories}
        onResetSession={() => setShowResetModal(true)}
      />

      {/* Category accordions */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const isExpanded = expandedCategories.has(cat.id);
          const pendingItems = cat.items.filter((i) => i.status === "pending");
          const readyItems = cat.items.filter((i) => i.status === "ready");
          const total = cat.items.length;
          const doneCount = cat.items.filter(
            (i) => i.status === "ready" || i.status === "in-bag",
          ).length;
          const catPct =
            total === 0 ? 0 : Math.round((doneCount / total) * 100);

          return (
            <div
              key={cat.id}
              className="glass-card bg-slate-800/30 border border-slate-700/30 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-600/40"
            >
              {/* Category header container */}
              <div className="w-full flex items-center gap-3 px-5 py-4 group">
                {/* Toggle Clickable Area */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="flex-1 flex items-center gap-3 text-left cursor-pointer min-w-0 focus:outline-none"
                  title={isExpanded ? "Collapse category" : "Expand category"}
                >
                  <span className="text-xl select-none">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white truncate">
                        {cat.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {doneCount}/{total}
                      </span>
                    </div>
                    {/* Category progress bar */}
                    <div className="w-full h-1 rounded-full bg-slate-900/70 mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${catPct}%` }}
                      />
                    </div>
                  </div>
                </button>

                {/* Delete category button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(cat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer focus:opacity-100 focus:outline-none"
                  title="Delete category"
                >
                  <Trash size={12} weight="bold" />
                </button>

                {/* Collapse/Expand Chevron button */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 focus:outline-none"
                  title={isExpanded ? "Collapse category" : "Expand category"}
                >
                  {isExpanded ? (
                    <CaretDown size={14} weight="bold" />
                  ) : (
                    <CaretRight size={14} weight="bold" />
                  )}
                </button>
              </div>

              {/* Expanded content: two-col lanes */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="flex gap-3">
                    {/* NOT READY lane */}
                    <DropLane
                      status="pending"
                      onDrop={(e) => handleLaneDrop(e, cat.id, "pending")}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setLaneDragTarget({
                          categoryId: cat.id,
                          status: "pending",
                        });
                      }}
                      onDragLeave={() => setLaneDragTarget(null)}
                      isDragTarget={
                        !!draggingItem &&
                        laneDragTarget?.categoryId === cat.id &&
                        laneDragTarget?.status === "pending"
                      }
                    >
                      {pendingItems.map((item) => (
                        <DraggableItem
                          key={item.id}
                          item={item}
                          categoryId={cat.id}
                          onDelete={() => handleDeleteItem(cat.id, item.id)}
                          onUpdateQuantity={(newQty) =>
                            handleUpdateQuantity(cat.id, item.id, newQty)
                          }
                          onUpdateCost={(cost, costMode) =>
                            handleUpdateCost(cat.id, item.id, cost, costMode)
                          }
                          onDragStart={(e) =>
                            handleDragStart(e, item.id, cat.id)
                          }
                          userDisplayName={userProfile?.displayName}
                        />
                      ))}
                      {/* Add item input */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <input
                          type="text"
                          placeholder="Add item…"
                          value={addItemInputs[cat.id] || ""}
                          onChange={(e) =>
                            setAddItemInputs((prev) => ({
                              ...prev,
                              [cat.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddItem(cat.id);
                          }}
                          className="flex-1 bg-slate-950/60 border border-slate-800/60 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
                        />
                        <button
                          onClick={() => handleAddItem(cat.id)}
                          className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25 transition-all cursor-pointer"
                          title="Add item"
                        >
                          <Plus size={11} weight="bold" />
                        </button>
                      </div>
                    </DropLane>

                    {/* Divider arrow */}
                    <div className="flex items-center justify-center shrink-0">
                      <ArrowRight
                        size={14}
                        weight="bold"
                        className="text-slate-600"
                      />
                    </div>

                    {/* READY lane */}
                    <DropLane
                      status="ready"
                      onDrop={(e) => handleLaneDrop(e, cat.id, "ready")}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setLaneDragTarget({
                          categoryId: cat.id,
                          status: "ready",
                        });
                      }}
                      onDragLeave={() => setLaneDragTarget(null)}
                      isDragTarget={
                        !!draggingItem &&
                        laneDragTarget?.categoryId === cat.id &&
                        laneDragTarget?.status === "ready"
                      }
                    >
                      {readyItems.map((item) => (
                        <DraggableItem
                          key={item.id}
                          item={item}
                          categoryId={cat.id}
                          onDelete={() => handleDeleteItem(cat.id, item.id)}
                          onUpdateQuantity={(newQty) =>
                            handleUpdateQuantity(cat.id, item.id, newQty)
                          }
                          onUpdateCost={(cost, costMode) =>
                            handleUpdateCost(cat.id, item.id, cost, costMode)
                          }
                          onDragStart={(e) =>
                            handleDragStart(e, item.id, cat.id)
                          }
                          userDisplayName={userProfile?.displayName}
                        />
                      ))}
                    </DropLane>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add custom category */}
      <div className="glass-card p-5 bg-slate-800/20 border border-slate-700/30 border-dashed rounded-2xl">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          Add Custom Category
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Emoji"
            value={newCatEmoji}
            onChange={(e) => setNewCatEmoji(e.target.value)}
            maxLength={2}
            className="w-14 text-center bg-slate-950/60 border border-slate-800/60 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:border-emerald-500/40 transition-colors"
          />
          <input
            type="text"
            placeholder="Category name…"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddCategory();
            }}
            className="flex-1 bg-slate-950/60 border border-slate-800/60 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCatName.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-extrabold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            <Plus size={14} weight="bold" />
          </button>
        </div>
      </div>

      {/* ── Hospital Bag Zone (sticky bottom) ─────────────────────────────────── */}
      <div
        className={`fixed bottom-20 left-4 right-4 max-w-5xl mx-auto z-30 rounded-2xl border shadow-2xl transition-all duration-300
          ${
            bagDragTarget
              ? "border-violet-400/60 bg-violet-900/60 backdrop-blur-md shadow-violet-900/30"
              : "border-slate-700/50 bg-slate-900/80 backdrop-blur-md"
          }`}
        onDrop={handleBagDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setBagDragTarget(true);
        }}
        onDragLeave={(e) => {
          // Only clear if leaving the zone entirely (not entering a child)
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setBagDragTarget(false);
          }
        }}
        onDragEnd={handleDragEnd}
      >
        {/* Bag header */}
        <button
          onClick={() => setBagExpanded((v) => !v)}
          className="w-full flex items-center gap-3 px-5 py-3.5 text-left cursor-pointer"
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              bagDragTarget
                ? "bg-violet-500/30 text-violet-300"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            <BagSimple size={18} weight="fill" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Hospital Bag
            </span>
            {allInBag.length > 0 && (
              <span className="ml-2 text-[10px] font-bold text-violet-400">
                {allInBag.length} item{allInBag.length !== 1 ? "s" : ""} packed
              </span>
            )}
          </div>
          {bagDragTarget && (
            <span className="text-[10px] font-black text-violet-300 animate-pulse">
              Drop here!
            </span>
          )}
          {bagExpanded ? (
            <CaretDown size={13} weight="bold" className="text-slate-400" />
          ) : (
            <CaretRight size={13} weight="bold" className="text-slate-400" />
          )}
        </button>

        {/* Bag contents */}
        {bagExpanded && (
          <div className="px-5 pb-4">
            {allInBag.length === 0 ? (
              <div
                className={`rounded-xl border-2 border-dashed py-5 text-center transition-colors ${
                  bagDragTarget
                    ? "border-violet-400/50 bg-violet-500/5"
                    : "border-slate-700/40"
                }`}
              >
                <BagSimple
                  size={24}
                  className="mx-auto text-slate-600 mb-1.5"
                />
                <p className="text-[10px] font-bold text-slate-500">
                  Drag any item here to add it to your hospital bag
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allInBag.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) =>
                      handleBagChipDragStart(e, item.id, item.categoryId)
                    }
                    onDragEnd={handleDragEnd}
                    className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-[11px] font-bold cursor-grab active:cursor-grabbing select-none hover:border-violet-400/40 transition-all"
                  >
                    <span>{item.label}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Move back to ready
                        mutate((prev) =>
                          prev.map((cat) =>
                            cat.id === item.categoryId
                              ? {
                                  ...cat,
                                  items: cat.items.map((i) =>
                                    i.id === item.id
                                      ? { ...i, status: "ready" }
                                      : i,
                                  ),
                                }
                              : cat,
                          ),
                        );
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-violet-400 hover:text-rose-400 cursor-pointer"
                      title="Remove from bag"
                    >
                      <X size={10} weight="bold" />
                    </button>
                  </div>
                ))}
                {/* Drop-more hint overlay */}
                {bagDragTarget && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/20 border-2 border-dashed border-violet-400/50 text-violet-300 text-[11px] font-bold animate-pulse">
                    + Drop here
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reset Session Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="glass-card max-w-md w-full p-6 bg-slate-900 border border-slate-700/60 rounded-3xl space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowCounterClockwise size={20} className="text-amber-400" />
                <h3 className="text-base font-extrabold text-white">
                  Reset Checklist Session
                </h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Choose how you would like to reset your birth preparation
              checklist.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  mutate((prev) =>
                    prev.map((cat) => ({
                      ...cat,
                      items: cat.items.map((i) => ({
                        ...i,
                        status: "pending",
                      })),
                    })),
                  );
                  setShowResetModal(false);
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 transition-all cursor-pointer group"
              >
                <div className="text-xs font-black text-emerald-400 group-hover:text-emerald-300">
                  Reset Progress Only (Preserve Categories & Items)
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Resets all items to &quot;Not Ready&quot; status. All custom
                  categories (like Consumables, Grooming) and added items are
                  preserved.
                </div>
              </button>

              <button
                onClick={() => {
                  const seed = makeSeedCategories();
                  mutate(() => seed);
                  setExpandedCategories(new Set(seed.map((c) => c.id)));
                  setShowResetModal(false);
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-rose-500/30 transition-all cursor-pointer group"
              >
                <div className="text-xs font-black text-rose-400 group-hover:text-rose-300">
                  Reset to Default Seed Categories
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Replaces current checklist with default initial categories.
                  Custom categories and items will be reset.
                </div>
              </button>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
