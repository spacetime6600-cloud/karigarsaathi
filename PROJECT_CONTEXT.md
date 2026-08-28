# KarigarSaathi Project Context & Architectural Rules

This document establishes the permanent technical, architectural, and design constraints for KarigarSaathi.

---

## 1. Core Technology Stack

- **Frontend Framework**: React with TypeScript.
- **Build Tooling**: Vite.
- **Styling**: Tailwind CSS, configured to match the Phase 5 Stitch design system and token taxonomy.
- **Routing & State**: React Router and modular feature-based state management.

---

## 2. Design System & Reference Integrity

- **Authoritative Source**: The Phase 5 Stitch exports located in `design-reference/phase5-stitch/` (Part 1 and Part 2) are the **sole authoritative visual reference**.
- **Immutable References**: All files in `design-reference/phase5-stitch/` are immutable source references. Never modify, reformat, rename, or delete them.
- **Exclusion of Phase 4 and Monotone**: Phase 4 grayscale files and `structural_monotone` designs are strictly excluded and must **never** be used as a visual or functional source.
- **Component Conversion**: Stitch HTML/CSS must be engineered into clean, semantic, reusable React components.
- **Prohibited Practices**:
  - Stitch HTML must **never** be inserted via `<iframe>` tags or raw `dangerouslySetInnerHTML` wrappers.
  - Stitch screenshots (`screen.png`) must **never** be displayed as full-page website images or mockup placeholders.

---

## 3. Product UX & Flow Guidelines

- **Real Responsive Web Application**: The finished product must operate as a fully responsive, production-ready web application across mobile (320px, 360px+), tablet, and desktop viewports, rather than a prototype-screen switcher or slideshow.
- **No Prototype / Meta UI**:
  - Global "12-Step Flow" navigation bars, "Prototype States" selectors, and phase-labelled developer badges are strictly prohibited in user-facing UI.
  - A compact, contextual progress indicator may appear strictly within the product creation flow where appropriate.
- **Artisan Experience & Accessibility**:
  - Multilingual localization (supporting vernacular Indian languages) is a primary requirement.
  - Full keyboard accessibility, screen-reader support, and touch-target compliance (WCAG 2.1 AA) are mandatory.
  - Offline-first resilience, voice-guided interactions, and high-contrast feedback are core product tenets.

---

## 4. Backend, AI & Service Integrations

- **Deferred Integrations**: Firebase, live backend APIs, and external AI services are deferred for subsequent implementation phases.
- **Architecture Readiness**: The codebase structure isolates service interfaces (`src/services/*`, `src/repositories/*`), allowing mock providers and offline sync to function prior to live cloud backend connectivity.
