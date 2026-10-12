# AGENTS.md — KeyLingo Project Conventions

> All AI coding agents working on this project MUST read this file before making changes.
> For detailed specs, see `docs/PRODUCT_SPEC.md`. For architecture, see `docs/ARCHITECTURE.md`.
> For current status, see `docs/PROGRESS.md`.

## Project Overview

**KeyLingo** is a multilingual typing trainer + vocabulary learning web app.
It supports English, Dutch, and Arabic. It combines keyboard practice with language learning.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest (unit), Playwright (e2e)
- **Persistence**: Local-first (localStorage with versioned schema)
- **Package Manager**: pnpm

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & layouts
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home
│   ├── guided/             # Guided learning routes
│   ├── reflex/             # Reflex training routes
│   ├── vocabulary/         # Vocabulary practice routes
│   ├── my-vocabulary/      # Saved vocabulary routes
│   ├── progress/           # Progress/stats routes
│   └── settings/           # Settings routes
├── engine/                 # Typing engine (UI-independent)
│   ├── typing-engine.ts    # Core state machine
│   ├── metrics.ts          # WPM, accuracy calculations
│   ├── text-processing.ts  # Grapheme segmentation, normalization
│   └── __tests__/
├── generators/             # Exercise generators (UI-independent)
│   ├── guided-curriculum.ts
│   ├── reflex-generator.ts
│   └── __tests__/
├── content/                # Static vocabulary/lesson content
│   ├── vocabulary/         # JSON vocabulary data by language
│   ├── lessons/            # Guided lesson definitions
│   └── keyboards/          # Keyboard layout definitions
├── services/               # Service interfaces & implementations
│   ├── translation.ts      # Translation provider interface
│   ├── persistence.ts      # Storage abstraction
│   └── __tests__/
├── components/             # React components
│   ├── ui/                 # Design system primitives
│   ├── keyboard/           # Virtual keyboard
│   ├── typing/             # Typing display components
│   ├── vocabulary/         # Word lookup & translation panel
│   └── layout/             # App shell, nav
├── hooks/                  # React hooks
├── lib/                    # Shared utilities
│   ├── types.ts            # Domain type definitions
│   └── constants.ts
└── styles/                 # Global styles, Tailwind config
```

## Coding Conventions

### TypeScript
- Strict mode always enabled.
- Prefer `interface` for object shapes, `type` for unions/intersections.
- No `any` — use `unknown` and narrow.
- Export types from `src/lib/types.ts` or co-located with their module.
- Use `readonly` for immutable data structures.

### React
- Server Components by default; `'use client'` only when needed.
- Custom hooks for shared stateful logic.
- No class components.
- Props interfaces named `{ComponentName}Props`.

### Styling
- Tailwind utility classes. No CSS modules.
- Design tokens via Tailwind theme extension.
- Support `dir="rtl"` at the layout level for Arabic.

### Testing
- Unit tests co-located in `__tests__/` directories.
- Test file naming: `{module}.test.ts` or `{module}.test.tsx`.
- Engine and generator logic MUST have unit tests.
- Use Playwright for critical user flows only.

### Content & i18n
- Vocabulary content in typed JSON files under `src/content/`.
- UI strings in a simple key-value map per locale. No heavy i18n framework in MVP.
- All text comparisons use Unicode NFC normalization.
- Arabic diacritics: configurable strict vs. lenient matching.

### Git & Workflow
- NEVER auto-commit or auto-push.
- NEVER delete files outside your task scope.
- ALWAYS check `docs/PROGRESS.md` before starting work.
- UPDATE `docs/PROGRESS.md` after completing a milestone.
- Run `pnpm type-check && pnpm test` before declaring work complete.

### Performance
- No unnecessary re-renders in typing view.
- Lazy-load content data.
- Keep bundle size minimal — no heavy libraries.

## Key Architecture Rules

1. The **typing engine** is a pure TypeScript module with no React/DOM dependencies.
2. **Keyboard layouts** are data, not code — defined as typed JSON/TS objects.
3. **Vocabulary content** is static data shipped with the app, not fetched from APIs.
4. **Translation** uses a provider interface — MVP ships with curated offline data only.
5. **Persistence** uses a versioned abstraction — MVP uses localStorage, future can swap to backend.
6. **Exercise generators** are pure functions with deterministic seeded output.
