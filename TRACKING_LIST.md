# Lumina Prenatal Tracker - Development Tracking List

This tracking list serves as a living document to track progress across development cycles. Mark items with `[x]` as they are completed.

---

### 1. ⚙️ Project Initialization (100% Complete)
- [x] Bootstrapped local Next.js environment with Tailwind, TypeScript, and ESLint configurations.
- [x] Set up Git remote origin pointing to `git@github.com:paulfermoreyes/baby-milestone-tracker.git`.
- [x] Initialized and configured Firestore and Authentication services inside the Firebase Console.
- [x] Installed the Firebase SDK (`npm install firebase`) and set up config mappings in `src/lib/firebase.ts`.

---

### 2. 🎨 UI/UX Design System (100% Complete)
- [x] Defined global design token variables (hsl primary palette, accents, custom blur gradients) inside `globals.css`.
- [x] Created reusable `.glass-card` styling configurations.
- [x] Removed Next.js boilerplate layouts and designed the **Lumina** deep dark dashboard theme.

---

### 3. 🧠 Core Features (In Progress - 75% Complete)
- [x] **Caregiver Authentication**: Built a secure global session provider (`AuthContext`) and interactive glassmorphic `<AuthModal>` dialog component.
- [x] **Firestore Database Schema & Models**: Organized user-linked documents with atomic timestamps.
- [x] **Fetal Kick Counter**:
  - [x] Developed prominent "Kick" & "Undo" buttons.
  - [x] Built live real-time Firestore database synchronization (using `onSnapshot` queries).
  - [x] Implemented simulated offline fallback flow for guests.
- [x] **Daily Blood Sugar Logs & Trend Analytics**:
  - [x] Engineered a 3-trend-line SVG chart with custom color-coded mapping for Fasting (`#06b6d4`), Post-Lunch (`#10b981`), and Post-Dinner (`#f43f5e`).
  - [x] Integrated an adjustable chart range selector supporting 7D, 14D, 30D, and All logs.
  - [x] Built custom floating glassmorphic tooltip indicators on node hovers.
  - [x] Developed an interactive historical logbook table filterable by slot type, featuring real-time row deletions.
- [ ] Symptom Tracker Module (Planned)
- [ ] Weight Progress Logger (Planned)
- [ ] Contraction Timer (Planned)
- [ ] Mobile Floating Panel Navigation: Implement a floating action button (FAB) that opens a sleek glassmorphic menu to switch between active dashboard panels on mobile viewports.

---

### 4. 🧪 Testing, Optimization & QA (0% Complete)
- [ ] Write unit tests for vital calculations.
- [ ] Conduct comprehensive accessibility (A11y) audits on form focus inputs.
- [ ] Run Core Web Vitals checks and verify Largest Contentful Paint (LCP) budget (< 2.5s).

---

### 5. 🚀 Production Deploy & Security Audit (0% Complete)
- [ ] Deploy code to staging server (Firebase App Hosting / Vercel).
- [ ] Draft and deploy robust Firestore Row-Level security rule policies.
- [ ] Release production bundle.
