# Focus App Architecture

## Module Organization
- Centralized import map (`/src/importMap.js`) for all components, hooks, and utils
- Barrel exports for `/src/components`, `/src/hooks`, `/src/utils`
- Themed CSS modules using `/src/styles/tokens.css`

## Data Flow
- Unidirectional data flow via React props and context
- State management with hooks and context providers
- Real-time updates via Supabase subscriptions

## State Management Patterns
- Local state: React useState/useReducer
- Global state: Context API, custom hooks
- Async state: useEffect, useLoadingState, error boundaries

## Integration
- All pages import modules via import map
- Utilities and hooks are modular and reusable

## Diagrams
- [Add diagrams here as needed]

## Accessibility & Theming
- WCAG AA compliance
- Design tokens for colors, spacing, shadows, transitions
- Dark mode, high contrast, reduced motion support

---

_Last updated: November 15, 2025_
