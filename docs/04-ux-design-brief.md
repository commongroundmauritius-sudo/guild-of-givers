# UX Design Brief

## 1. Brand

| | |
|---|---|
| Personality | Trustworthy, transparent, calm, civic, modern |
| Voice | Plain, direct, never salesy. "Here is exactly what happens with your money." |
| Don't | Saviour language, urgency tactics, generic NGO stock photography |

## 2. Visual language

### Public site (already implemented direction — keep)
- **Background**: warm cream `oklch ~ #F7F3EC`.
- **Primary**: deep forest green `#0F3D2E`.
- **Cards**: ivory `#FBF7F0`, subtle borders.
- **Display font**: Fraunces (semi-serif).
- **Body font**: Inter.
- **CTAs**: rounded-full pills.
- **Hero**: layered card frames around photography.
- **Section rhythm**: small uppercase kicker → large display heading → body → grid.

### Authenticated dashboards
Switch register: denser, fintech-style (Stripe / Linear inspired), still on cream.
- Left sidebar (desktop) / bottom nav (mobile).
- Top bar with user menu, notifications, sign out.
- Cards with subtle shadow, 16px radius.
- Tables with zebra rows, sticky headers.
- Numbers right-aligned, monospaced tabular figures (`font-variant-numeric: tabular-nums`).
- Inter throughout (Fraunces only on page H1s for continuity).

### Color tokens (semantic, in `src/styles.css`)
Already defined: `--background`, `--foreground`, `--primary`, `--card`, `--muted`, `--border`, `--accent`, `--cream-deep`, `--forest-soft`. Add as we build:
- `--success` (green), `--warning` (amber), `--danger` (red), `--info` (blue).
- `--surface-1`, `--surface-2`, `--surface-3` for dashboard layering.

## 3. Information architecture

```
Public
  /                  Home (hero, process, why, initiatives, NGOs, FAQ, CTA)
  /about
  /initiatives       Browse list
  /initiatives/$id   Initiative detail (public)
  /transparency      Public stats + ledger summary
  /for-orgs          Pitch for NGOs
  /partner           NGO application
  /faq
  /legal
Auth
  /login
  /signup            Multi-step (amount -> account -> payment)
  /reset-password
Authenticated (role-routed via /dashboard)
  /member
    /member          Overview
    /member/contributions
    /member/receipts
    /member/allocations
    /member/profile
    /member/settings
  /ngo
    /ngo             Org overview
    /ngo/initiatives
    /ngo/initiatives/$id
    /ngo/reports
    /ngo/funding
    /ngo/profile
  /admin
    /admin           Treasury overview
    /admin/vetting
    /admin/payments
    /admin/initiatives
    /admin/users
    /admin/disputes
    /admin/audit
```

## 4. Component inventory (mapped to shadcn primitives)

| Need | Primitive |
|---|---|
| Buttons (pill) | `Button` with `rounded-full` variant |
| Forms | `Form`, `Input`, `Label`, `Textarea`, `Select`, `Checkbox`, `RadioGroup` |
| Money input | Custom `MoneyInput` wrapping `Input` |
| Tables | `Table` + TanStack Table |
| Tabs | `Tabs` |
| Dialogs | `Dialog`, `AlertDialog` |
| Sidebar | `Sidebar` |
| Toasts | `sonner` (already wired) |
| Charts | `Chart` (recharts) — used sparingly on transparency page |

Custom: `KpiCard`, `BreakdownBar` (visualizes `payment_breakdowns`), `AllocationSliderGroup`, `StatusBadge` (driven by enum), `ReceiptRow`.

## 5. State conventions

- **Loading**: skeletons matching final layout (no spinners on first paint).
- **Empty**: illustration + one-sentence explanation + primary action.
- **Error**: inline card with retry; never a blank page.
- **Success**: toast for transient, inline confirmation for destructive flows.
- **Optimistic**: only for low-stakes UI (toggle notifications). Never for money.

## 6. Money & numbers
- All amounts displayed as `Rs 1 234,56` via `Intl.NumberFormat('en-MU', { style: 'currency', currency: 'MUR' })`.
- Tabular figures everywhere amounts appear in lists/tables.
- Show fee breakdown on every payment detail page (transparency-first principle).

## 7. Responsive
- Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`.
- Public pages: mobile-first, single column < md.
- Dashboards: sidebar collapses to bottom nav < md.

## 8. Accessibility
- Focus visible on every interactive element.
- All form inputs have associated `<label>`.
- Color is never the only signal (status badges include text + icon).
- Hit targets ≥ 44px on mobile.
