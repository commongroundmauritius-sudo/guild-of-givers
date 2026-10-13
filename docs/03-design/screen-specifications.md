# Screen Specifications

**Status:** Inventory in progress; only a few route files have been identified so far.

| ID | Screen / route | Audience | Evidence | Remaining verification |
|---|---|---|---|---|
| SCR-001 | Root shell / route outlet | All roles | `src/routes/__root.tsx` | Providers, global navigation, consent UI, metadata, error handling and responsive behavior. |
| SCR-002 | Initiative detail `/initiatives/$slug` | Public/member, subject to publication policy | `src/routes/initiatives/$slug.tsx` | Loader, displayed fields, loading/error/empty states, CTA behavior, view attribution and access rules. |
| SCR-003 | Admin finance route module | Admin | `src/routes/_authenticated/admin-dashboard.finances.tsx` discovered by search | Actual browser URL, guard, query fields, filters, exports, sensitive data and empty/error states. |
| SCR-004 | Signup journey | Prospective member | `tests/e2e-signup-journey.spec.ts` referenced by workflow | Full form, steps, validations, focus/error behavior, server/Auth interactions and failure recovery. |

## Required per-screen checklist

For each discovered route document: purpose; target role; browser URL; component hierarchy; query/server operations; displayed data; form constraints; state transitions; loading/empty/error/success/disabled states; responsive behavior; keyboard and screen-reader behavior; outgoing navigation; authorization; known defects; and linked tests. Do not mark a state as implemented until confirmed in code or a test.
