# Information Architecture

**Status:** Initial; route inventory incomplete.

## Verified route evidence

- Root application route: `src/routes/__root.tsx`.
- Initiative detail route: `src/routes/initiatives/$slug.tsx`.
- Authenticated admin finance route: `src/routes/_authenticated/admin-dashboard.finances.tsx` (found by repository code search).

## Preliminary role-oriented sitemap

```text
Public
├── Home / public discovery (exact route inventory pending)
├── Initiative detail: /initiatives/$slug
├── Signup / authentication (exact route inventory pending)
└── Legal/privacy pages (current route existence to verify)

Authenticated
├── Member account and membership (inventory pending)
├── Organization dashboard and initiative management (inventory pending)
└── Admin dashboard
    └── Finance: /_authenticated/admin-dashboard.finances (route-file path; browser URL/guard behavior to verify)
```

This is a working map, not a complete list of routes or proof that every listed area is implemented. Build the canonical sitemap by enumerating every `src/routes` module, route metadata, redirects and guard logic. For each route record browser path, public/protected status, required role, navigation entry point, data dependencies and not-found/error behavior.
