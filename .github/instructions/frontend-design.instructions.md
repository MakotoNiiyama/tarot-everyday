---
applyTo: "src/components/**"
---

# Frontend Design — Tarot Everyday

## Theme: Scratch-Art Dark Gold

This app uses a **dark-only** scratch-art aesthetic. Never introduce light mode or neutral grays.

### Color Palette (Tailwind classes)

| Token       | Hex       | Class             | Usage                     |
|-------------|-----------|-------------------|---------------------------|
| gold        | `#CC8F1F` | `text-gold`       | Primary accent, headings  |
| gold-dim    | `#B89A5A` | `text-gold-dim`   | Secondary text, borders   |
| gold-light  | `#E5B85A` | `text-gold-light` | Hover states, highlights  |
| background  | `#130C06` | `bg-background`   | Page background           |
| surface     | `#2A1D0A` | `bg-surface`      | Cards, panels, overlays   |
| cream       | `#F5E6C8` | `text-cream`      | Body text                 |
| terracotta  | `#C75B39` | `text-terracotta` | Error, reversed cards     |

### Typography

- **--font-sans** (Zen Maru Gothic): Body text, UI labels
- **--font-heading** (Kaisei Decol): Page titles, section headers
- **--font-accent** (Caveat): Decorative, handwritten feel

## Component Conventions

- Use `"use client"` only when hooks or browser APIs are needed.
- Bottom sheets use `@base-ui/react` Drawer (NOT Radix Dialog).
- Animations use Framer Motion (`motion.div`, `AnimatePresence`).
- SVG decorative elements go in `src/components/svg/`.

## Accessibility

- Use semantic HTML: `<button>`, `<nav>`, `<main>`, `<h1>`–`<h3>`.
- All interactive elements must be keyboard-accessible.
- Images need descriptive `alt` text (in Japanese).
- Ensure sufficient color contrast — gold on dark bg meets WCAG AA.
- Use `aria-label` for icon-only buttons.

## Responsive Design

- Mobile-first layout. Primary target: smartphone (Pixel 7 viewport).
- Use Tailwind responsive prefixes (`sm:`, `md:`) sparingly — most layouts are single-column.
- Touch targets: minimum 44×44px.
- Bottom nav is fixed; account for its height in page padding.

## Animation Guidelines

- Keep durations short: 200–400ms for transitions, 500ms max for emphasis.
- Use `ease-out` for enters, `ease-in` for exits.
- Respect `prefers-reduced-motion` — wrap animations in media query or Framer Motion's `useReducedMotion`.
- Card flip: `rotateY` on a perspective container.
