# Design System

**Status:** No complete design system has been verified in this audit.

## Existing evidence

- `@tailwindcss/vite` and Radix UI packages are declared.
- Lucide React is declared for icons.
- Root route uses utility classes such as semantic tokens `bg-background`, `text-primary`, `text-foreground`, `border-input`, and `text-muted-foreground`.
- Font packages for Fraunces and Inter are declared.

These facts indicate use of utility styling and reusable UI primitives, but do not by themselves establish the full token values, typography scale, component variants or responsive breakpoints.

## Inventory required

1. Inspect `src/styles.css`, Tailwind configuration and all shared UI components.
2. Extract CSS variables/colors, font families/sizes/weights, spacing/radius/shadows and breakpoints.
3. Inventory buttons, inputs, alerts, cards, tables, dialogs, navigation, badges and empty/error states.
4. Check keyboard focus, reduced motion, semantic HTML, accessible names, contrast and zoom/responsive behavior.

## Proposed documentation format

For each token record name, literal value, usage, source file and verification status. Keep proposed tokens in a separate section and avoid inventing values before source inspection.
