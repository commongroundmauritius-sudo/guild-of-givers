# Palette's Journal

## 2026-03-24 - [Centralized Tooltip Support]

**Learning:** Adding TooltipProvider to the root layout ensures that all components can use tooltips without individual wrapping, reducing boilerplate and potential context errors.
**Action:** Always check if a global provider exists before adding one locally. If missing, consider adding it to the root for consistency.

## 2026-03-24 - [Accessible Notification Interaction]

**Learning:** Icon-only buttons like notification bells must have explicit ARIA labels and visual tooltips to be both accessible and intuitive for all users.
**Action:** Pair every icon-only button with an 'aria-label' and a 'Tooltip'.
