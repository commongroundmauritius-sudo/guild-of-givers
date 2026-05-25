# Initiative Landing + Attribution System Summary

## Work Summary

### Files Changed / Created
- **Created** `src/lib/slugify.ts`: Centralized slugification and collision handling logic.
- **Created** `src/routes/initiatives/$slug.tsx`: New dedicated landing page for initiatives with session-aware tracking and attribution persistence.
- **Updated** `src/routes/initiatives/$id.tsx`: Redirects legacy ID-based URLs to new slug-based URLs.
- **Updated** `src/routes/signup.tsx`: Implemented attribution detection and auto-assignment logic.
- **Updated** `src/routes/index.tsx`, `src/routes/initiatives/index.tsx`, `src/routes/entities.$id.tsx`: Updated links to use slug-based routes.
- **Updated** `src/routeTree.gen.ts`: Manually added the new slug route for TanStack Router.
- **Created Migration** `20260525000012_initiative_attribution_system.sql`: Added slug, view\_count, conversion\_count to initiatives; created `initiative_events` table; set up triggers for auto-incrementing counters.
- **Created Migration** `20260525000013_update_signup_trigger_for_attribution.sql`: Updated backend signup trigger to handle attribution and auto-assignment.

### Schema Changes
- **Table: initiatives**
  - `slug` (TEXT, UNIQUE, NOT NULL, INDEXED)
  - `view_count` (INTEGER, DEFAULT 0)
  - `conversion_count` (INTEGER, DEFAULT 0)
- **Table: profiles**
  - `source_initiative_id` (UUID, FK to initiatives)
  - `primary_initiative_id` (UUID, FK to initiatives)
- **Table: initiative_events** (New)
  - `id` (UUID, PK)
  - `initiative_id` (UUID, FK)
  - `event_type` (TEXT: 'page_view', 'registration_conversion')
  - `user_id` (UUID, nullable)
  - `session_id` (TEXT, nullable)
  - `metadata` (JSONB)
  - `created_at` (TIMESTAMPTZ)

### Analytics Flow
1. Visitor lands on `/initiatives/:slug`.
2. App records a `page_view` event in `initiative_events` (deduplicated per session).
3. Database trigger increments `initiatives.view_count`.
4. `initiative_id` is stored in `localStorage` as `source_initiative_id`.

### Onboarding Flow
1. Visitor clicks "Become Member" (links to `/signup`).
2. Signup page detects `source_initiative_id` from `localStorage`.
3. User completes signup. `source_initiative_id` is passed in auth metadata.
4. Backend trigger:
   - Sets `source_initiative_id` and `primary_initiative_id` on the user profile.
   - Adds the initiative to `member_preferences`.
5. Frontend records `registration_conversion` event.
6. Database trigger increments `initiatives.conversion_count`.
7. Attribution is cleared from `localStorage`.

## Dictionary

- **source_initiative_id**: The UUID of the initiative through which a user first arrived at the platform.
- **primary_initiative_id**: The user's main initiative, initially set to the source initiative.
- **page_view**: An event recorded when an initiative landing page is viewed.
- **registration_conversion**: An event recorded when an attributed visitor successfully completes signup.
- **slug**: A URL-friendly version of the initiative title (e.g., "tree-planting").
- **attribution flow**: The mechanism that tracks and persists the visitor's source initiative until they become a member.
