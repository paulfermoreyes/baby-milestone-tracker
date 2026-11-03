<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Baby Milestone Tracker - Agent Guidelines & Project Overview

> **CRITICAL REMINDER FOR ALL AGENTS**: Maintain and update this `AGENTS.md` file whenever high-level changes are made to the project structure, tools, stack versions, test setups, or coding standards/rules. Keep this documentation synchronized with the codebase state!

---

## 1. Project Overview & Architecture
This project is a **Baby Milestone Tracker** application built with modern web technologies and Firebase for backend services.

### Monorepo Structure
- `apps/web/`: Next.js web application
  - `src/app/`: Next.js App Router pages and API routes.
  - `src/components/`: Modular React components.
  - `src/context/`: React context providers (e.g., AuthContext, BabyContext, ThemeContext).
  - `src/lib/`: Library initialization (e.g., Firebase client setup, WHO growth calculators, gestational calculations, baby helpers).
  - `src/__tests__/`: Unit/integration tests powered by Vitest.
  - `tests/`: End-to-end (E2E) testing powered by Playwright.
- `apps/mobile/`: React Native / Expo mobile application.
- `packages/shared-firebase/`: Shared Firebase configuration and helpers.
- `packages/shared-types/`: Shared TypeScript interfaces and domain types.

---

## 2. Tools & Stack Overview
- **Framework & Core**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, PostCSS
- **Backend / Services**: Firebase SDK v12 (Auth, Firestore, Cloud Storage)
- **Icons**: `@phosphor-icons/react`
- **Unit Testing**: Vitest, React Testing Library, `jsdom`
- **E2E Testing**: Playwright (`@playwright/test`) with Allure report (`allure-playwright`), published to GitHub Pages at `/playwright/report` by `.github/workflows/playwright.yml`
- **Linting & Formatting**: ESLint, Prettier, `lint-staged`
- **CI/CD**: GitHub Actions (workflows for Vitest unit tests and Playwright E2E tests)

---

## 3. Key Commands & Scripts
- `npm run dev`: Launch local development server
- `npm run build`: Build production web bundle
- `npm run lint`: Run ESLint checks
- `npm run test`: Run unit and integration tests via Vitest
- `npm run test:ui`: Run E2E UI test suites via Playwright

---

## 4. Coding Standards & Conventions
- **TypeScript**: Use strict types; avoid `any`.
- **Components**: Functional components with TypeScript interface definitions for props.
- **State & Context**: Wrap components that depend on Auth/Global context inside their respective providers (or mock `useAuth` when unit testing).
- **Styling**: Use utility classes from Tailwind CSS v4; maintain consistent spacing and responsive design.
- **Testing**:
  - Keep unit tests inside `apps/web/src/__tests__/`.
  - Ensure component tests wrap renders with necessary Context Providers (e.g., `AuthProvider`).
  - Keep E2E tests inside `apps/web/tests/`.

---

## 5. Maintenance Checklist for Agents
When making updates to this codebase, ensure you:
1. Run `npm run test` and `npm run lint` before completing tasks to guarantee stability.
2. Update this `AGENTS.md` file if introducing new tools, architectural layers, directory structures, or team conventions.
