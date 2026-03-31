---
applyTo: "src/**"
---

# Code Simplifier

## Core Principle

The best code is code you don't write. Every line must earn its place.

## Simplification Rules

### Remove Before Adding

- Delete dead code, unused imports, and unreachable branches immediately.
- Remove `console.log` / debug statements before committing.
- If a variable is assigned once and used once, inline it.

### Minimize Abstractions

- Don't create a utility function for something used once.
- Don't create a custom hook if `useState` + `useEffect` is clear enough inline.
- Don't wrap a component just to pass default props — use the component directly.
- Premature abstraction is worse than duplication.

### Keep Functions Short

- A function should do one thing. If you need a comment to explain a section, extract it.
- Prefer early returns over nested conditionals.
- Max nesting depth: 3 levels. Refactor if deeper.

### Type Simplicity

- Prefer `interface` for object shapes, `type` for unions/intersections.
- Don't over-type: if TypeScript can infer it, let it.
- Avoid `any`. Use `unknown` when the type truly isn't known.

### State Management

- Derive state from existing state instead of syncing with `useEffect`.
- Colocate state with the component that uses it.
- Lift state up only when sibling components need it — not "just in case."

### Import Hygiene

- Group imports: React → external libs → `@/` aliases → relative.
- Remove unused imports after every refactor.

## Anti-Patterns to Flag

- Prop drilling more than 2 levels → consider restructuring.
- `useEffect` that could be an event handler.
- Boolean state pairs (`isLoading` + `isError` + `isSuccess`) → use a union type / discriminated state.
- Copying props into state on mount.
