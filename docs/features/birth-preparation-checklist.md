# Birth Preparation Checklist Feature

A categorized, drag-and-drop todo-list for parents to track items they need to prepare before their baby arrives. Items can be dragged between **Not Ready** and **Ready** columns, and a special **Hospital Bag** drop zone holds items to bring on birth day. It follows the exact same data architecture and UI patterns as the rest of the Lumina Prenatal Suite.

---

## Background

The app already has a similar "organizer" feature — the **Baptism Organizer** (`BaptismOrganizer.tsx`). It uses a dual-storage pattern: `localStorage` for unauthenticated (guest) users and Firestore for authenticated users. **Both solo and family-linked users persist to Firestore** so data is available across devices. The new checklist will follow this same pattern.

---

## Data Architecture

### Firestore Document Structure

The checklist is stored as a **single document** (similar to baptism). Each category is an embedded array within the document. This avoids needing a subcollection for every item.

```
families/{familyId}/checklist/data          ← for linked couples
users/{uid}/checklist/data                  ← for solo authenticated users (future-proof)
```

> **Guest mode** falls back to `localStorage` under the key `lumina_guest_checklist`.

### Firestore Paths

```
families/{familyId}/checklist/data    ← linked couples
users/{uid}/checklist/data            ← solo authenticated users (cross-device)
```

Solo users write to `users/{uid}/checklist/data`. When a user later links with a partner (via invite code), data migration from the personal path to the family path is **out of scope for v1** — the family starts fresh.

### Document Schema

```ts
interface ChecklistDocument {
  categories: Category[];
  updatedAt: Timestamp;
}

interface Category {
  id: string;           // UUID, stable identifier
  name: string;         // e.g. "Nursery & Sleep"
  emoji: string;        // decorative prefix e.g. "🛏️"
  items: ChecklistItem[];
}

interface ChecklistItem {
  id: string;            // UUID
  label: string;
  status: 'pending' | 'ready' | 'in-bag';  // replaces simple boolean
  addedBy?: string;      // uid of user who added it (family attribution)
  note?: string;         // optional free-text note (deferred to v2)
}
```

> `status` drives the drag-and-drop UX:
> - **`pending`** → appears in the "Not Ready" column
> - **`ready`** → appears in the "Ready" column
> - **`in-bag`** → appears in the Hospital Bag drop zone

### Pre-seeded Default Categories

The checklist is pre-populated with sensible defaults on first load. All items start with `status: 'pending'`.

| Category | Emoji | Sample Items |
|---|---|---|
| Nursery & Sleep | 🛏️ | Crib/bassinet, Mattress, Bedding set, Baby monitor |
| Feeding | 🍼 | Breast pump, Bottles, Burp cloths, Nursing pillow |
| Clothing | 👕 | Onesies (newborn/0-3M), Sleepers, Socks, Hats |
| Bath & Hygiene | 🛁 | Baby bathtub, Gentle shampoo/wash, Nail trimmer |
| Health & Safety | 🏥 | Thermometer, Baby first-aid kit, Car seat, Baby-proofing kit |
| Mom Recovery | 💊 | Postpartum pads, Nipple cream, Stool softener, Comfortable PJs |

> **Note:** "Hospital Bag" is no longer a regular category. It is the dedicated **drop zone** — a fixed area at the top/bottom of the page where any item from any category can be dragged to mark it as `in-bag`.

---

## File & Component Plan

### New Files

#### [NEW] `src/components/BirthChecklist.tsx`
The main feature component. Responsibilities:
- Real-time Firestore sync via `onSnapshot` (or `localStorage` for guests)
- Renders categories as collapsible accordion sections with **two column lanes**: "Not Ready" and "Ready"
- **Drag-and-drop** between the two lanes and into the Hospital Bag zone (see UX detail below)
- Add/delete custom items within a category
- Add/delete custom categories
- Progress bar per category + global overall progress
- Shared-editing attribution: small badge showing "added by [partner name]"

#### [NEW] `src/app/trackers/checklist/page.tsx`
Thin route page that wraps `BirthChecklist` in `AppShell`, following the exact same pattern as all other tracker pages.

### Modified Files

#### [MODIFY] `src/components/BottomNav.tsx`
Add a new `checklist` entry to the `allItems` record.

- **Icon**: `Baby` or `ListChecks` from `@phosphor-icons/react`
- **Color**: `text-emerald-400` / `activeColorClass: text-emerald-400`
- **href**: `/trackers/checklist`
- **Mobile priority**: inject into the late-pregnancy priority list (week ≥ 28) alongside contractions

#### [MODIFY] `firestore.rules`
Add rules for the new paths:

```diff
// Under: match /families/{familyId} {
+   match /checklist/{checklistId} {
+     allow read, write: if isFamilyMember(familyId);
+   }

// Under: match /users/{userId} {
+   match /checklist/{checklistId} {
+     allow read, write: if isAuthed() && request.auth.uid == userId;
+   }
```

---

## UX Detail: Drag-and-Drop Design

### Two-Column Lane Layout (per category)

Each category accordion expands to show two horizontal drop lanes:

```
┌─────────────────────────────────────────────┐
│ 🛏️ Nursery & Sleep          [progress bar]  │
├──────────────────┬──────────────────────────┤
│  ⬜ NOT READY    │  ✅ READY                │
│  ┌────────────┐  │  ┌────────────┐          │
│  │ Crib       │  │  │ Mattress ✓ │          │
│  │ Bedding    │  │  └────────────┘          │
│  └────────────┘  │                          │
└──────────────────┴──────────────────────────┘
```

Dragging an item from **Not Ready → Ready** sets `status: 'ready'`.  
Dragging an item from **Ready → Not Ready** reverts it to `status: 'pending'`.  
Dragging any item into the **Hospital Bag zone** sets `status: 'in-bag'`.

### Hospital Bag Drop Zone

A **fixed, pinned panel** at the bottom of the page (above the bottom nav) or as a collapsible sticky footer section. It has a prominent bag icon (`BagSimple` or `ShoppingBag` from Phosphor Icons) and a drop target area.

```
┌──────────────────────────────────────────────────┐
│  👜  Hospital Bag  •  3 items packed             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ ID docs  │ │ Outfit   │ │ Birth    │  + more  │
│  └──────────┘ └──────────┘ │ plan     │          │
│                             └──────────┘          │
│            [ Drop items here ]                    │
└──────────────────────────────────────────────────┘
```

- Items in the bag show as small chips/pills
- Dragging a chip out of the bag returns it to its source category's "Ready" lane
- The bag zone is always visible (sticky) so users can drag from any category without scrolling back

### Drag-and-Drop Implementation

Use the **native HTML5 Drag and Drop API** (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) — no external library needed, keeping the bundle lean. Each draggable item carries a `data-item-id` and `data-category-id` payload via `event.dataTransfer.setData`.

---

## Component Architecture

```
BirthChecklist.tsx
├── <OverallProgressBar />         ← (ready + in-bag) / total items
├── {categories.map(cat => (
│     <CategoryAccordion key={cat.id}>
│       ├── <CategoryHeader />     ← name, emoji, category progress, collapse toggle
│       ├── <div class="two-col">
│       │     <DropLane status="pending">   ← NOT READY lane
│       │       {pendingItems.map(<DraggableItem />)}
│       │       <AddItemRow />
│       │     </DropLane>
│       │     <DropLane status="ready">     ← READY lane
│       │       {readyItems.map(<DraggableItem />)}
│       │     </DropLane>
│       │   </div>
│     </CategoryAccordion>
│   ))}
├── <AddCategoryRow />             ← input to create a new category
└── <HospitalBagZone />            ← sticky drop zone at bottom
      ├── Bag icon + count badge
      ├── {inBagItems.map(<BagChip />)}
      └── Drop target overlay (active on drag)
```

### State Management

All state is local to the component:
- `categories: Category[]` — the full checklist state
- `expandedCategories: Set<string>` — which accordions are open
- `draggingItem: { itemId, categoryId } | null` — active drag payload
- `isLoading: boolean` — for initial Firestore fetch

Mutations (status change, add/delete item, add/delete category) write **optimistically** to local state and persist via `setDoc` with `{ merge: true }` to Firestore or `localStorage`.

---

## Firestore Write Strategy

The entire `ChecklistDocument` is written as a **single `setDoc` with `{merge: true}`** on every mutation. Since the document is a single object and edits are infrequent (not a high-frequency stream like kicks/contractions), this is safe and simple.

> **No separate subcollection per item needed.** This mirrors how `BaptismOrganizer` stores its event + invitees in one document.

---

## Security Rules Changes

```diff
// Under: match /families/{familyId} {
+   match /checklist/{checklistId} {
+     allow read, write: if isFamilyMember(familyId);
+   }

// Under: match /users/{userId} {
+   match /checklist/{checklistId} {
+     allow read, write: if isAuthed() && request.auth.uid == userId;
+   }
```

---

## Open Questions

> [!NOTE]
> **Q1: Custom category limits** — Should there be a cap on the number of custom categories a family can create (e.g. max 20), to avoid runaway Firestore document size? Recommended: soft cap at 15 total categories.

> [!NOTE]
> **Q2: Notes field** — Each item has an optional `note` field in the schema. Should this be visible in v1 (e.g. inline text under the chip) or deferred to v2?

---

## Verification Plan

### Manual Verification
1. Visit `/trackers/checklist` — confirm the page loads with pre-seeded categories.
2. Toggle checkboxes — confirm items persist across page refreshes.
3. Add a new item to an existing category — verify it appears and persists.
4. Add a new category — verify it appears with the correct name/emoji.
5. Delete an item — verify it disappears and persists.
6. **Guest mode**: confirm all operations fall back to `localStorage` without Firestore errors.
7. **Linked partners**: confirm changes made by one partner appear in real-time on the other's session (via `onSnapshot`).
8. **Firestore rules**: confirm unauthenticated access is rejected.
9. Check bottom nav on mobile and desktop — confirm the new Checklist link appears and highlights correctly on the active route.
