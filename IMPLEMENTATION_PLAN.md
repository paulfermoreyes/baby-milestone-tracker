# Lumina Prenatal Tracker - MVP Implementation Plan

## Goal Description

Develop a multi-caregiver prenatal and infant tracking platform. The solution is a mobile-first, high-fidelity web application built with **Next.js** (React) and a real-time cloud backend using **Firebase** (Auth + Firestore). Key features include:
- Caregiver Authentication and shared session context (Firebase Auth)
- Tracking of pregnancy vitals and events (Fetal Kicks, Symptoms, Weight, Contractions)
- Real-time active data synchronization across caregivers' devices (Firestore snapshots)
- Premium dark-theme UI featuring glassmorphism cards, ambient neon glows, and micro-hover lifts.

---

## Technical Architecture

### 1. Frontend Core
- **Framework**: Next.js App Router (React 19)
- **Styling**: Vanilla CSS variable tokens with Tailwind utility layers
- **Design Tokens**: Defined HSL color configurations for a premium, unified theme
- **Custom UI Features**: Glassmorphic layout wrapper, smooth transition states, standard dialogue modas

### 2. Backend Cloud Services
- **Firebase Auth**: Enables sign-in/sign-up flows with automatic profile states
- **Cloud Firestore**: Non-relational real-time storage
  - `kicks` collection – logs baby kicks mapped to `userId` and `createdAt`
  - `symptoms` collection *(planned)* – logs symptoms and severity scales
  - `weight` collection *(planned)* – logs caregiver weights and targets
  - `contractions` collection *(planned)* – logs contraction times, durations, and intervals
- **Firestore Subscriptions**: Live `onSnapshot` queries filter collections by authenticated `userId` to instantly sync views.

---

## Implementation Checklist & Phases

### Phase 1: Project Setup & Base Architecture (Complete)
- [x] Bootstrapped Next.js App with Tailwind & TypeScript configuration
- [x] Created custom design system styling token dictionary inside `globals.css`
- [x] Initialized Git repository, connected to remote origin, and pushed initial codebase:
  - Repository: `git@github.com:paulfermoreyes/baby-milestone-tracker.git`
- [x] Configured Firebase SDK client setup in `src/lib/firebase.ts` and set up environment parameter defaults inside `.env.local`

### Phase 2: Caregiver Authentication (Complete)
- [x] Built global `AuthContext` to manage current login and sync state
- [x] Built responsive `<AuthModal>` dialog component with custom CSS transitions
- [x] Built customized auth-control buttons (Sign In / Join, Sign Out, custom profile badges) inside the dashboard navigation

### Phase 3: Fetal Kick Counter & Real-Time Sync (Complete)
- [x] Built client-side `<KickCounter>` widget
- [x] Integrated real-time snapshot listeners to dynamically sync logged events
- [x] Implemented instant "Undo Last Kick" feature with automatic Firestore document deletion
- [x] Developed guest preview fallback state allowing interactive simulation before logging in

### Phase 4: Additional Tracking Modules (Planned)
- [ ] **Symptom Tracker Diary**: Create glass-card interface with severity dropdown and notes input
- [ ] **Weight Progress Logger**: Build entry modals and trendlines for tracking weekly weight progress
- [ ] **Contraction Timer**: Implement active session timing and log history

### Phase 5: Production Deployment & QA (Planned)
- [ ] Configure deployment on Firebase App Hosting / Vercel
- [ ] Perform comprehensive Row-Level Security Rules setup for Firestore collections
- [ ] Conduct accessibility (A11y) checks and performance LCP audits

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify standard production bundle output.
- Write unit tests for data manipulation utilities.

### Manual Verification
- Test registration/login/logout actions.
- Test active synchronization across multiple device screens simultaneously.
- Verify fallback behavior when offline or signed out as a guest.
