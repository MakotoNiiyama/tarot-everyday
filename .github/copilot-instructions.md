# Copilot Workspace Instructions — Tarot Everyday

## Thinking & Planning (superpowers)

Before writing code, think step-by-step:

1. **Understand**: Restate the goal in your own words. Identify constraints and edge cases.
2. **Plan**: Break work into small, testable steps. List files to create/modify. Consider impact on existing tests.
3. **Verify assumptions**: Read relevant source files before modifying. Never guess at API shapes or component props.
4. **Implement**: One logical change at a time. Run type checks and tests after each step.
5. **Review**: After completing, re-read the diff mentally. Ask: "Did I introduce regressions? Did I over-engineer?"

### Decision Quality Checks

- **Before creating a new file**: Is there an existing file this belongs in?
- **Before adding a dependency**: Can this be done with what's already installed?
- **Before abstracting**: Is this used in more than one place right now?
- **Before adding error handling**: Can this actually fail in practice?

## Project Context

- **Framework**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **UI**: shadcn/ui backed by @base-ui/react (NOT Radix). Framer Motion for animation.
- **Theme**: Scratch-art dark gold — always dark mode, no light mode. Colors: gold `#CC8F1F`, background `#130C06`, surface `#2A1D0A`, cream `#F5E6C8`, terracotta `#C75B39`.
- **Fonts**: Zen Maru Gothic (--font-sans), Kaisei Decol (--font-heading), Caveat (--font-accent)
- **Path alias**: `@/*` → `./src/*`
- **Testing**: Vitest + @testing-library/react (unit), Playwright (E2E on port 3100)
- **Language**: UI text and test names in Japanese. Code identifiers in English.

## Code Style

- Prefer `"use client"` only when hooks or browser APIs are needed.
- Server Components by default for pages.
- Keep components in `src/components/`, logic in `src/lib/`, data in `src/data/`.
- Use Tailwind utility classes. Reference theme colors as `text-gold`, `bg-surface`, `text-cream`, `text-terracotta`, `bg-background`.
- SVG decorations go in `src/components/svg/`.
