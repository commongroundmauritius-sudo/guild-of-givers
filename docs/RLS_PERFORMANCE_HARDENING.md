# RLS / database performance hardening

- Added an index for `payment_intents.source_initiative_id`, the previously reported unindexed foreign key.
- Removed two redundant non-constraint indexes from `member_preferences`; the constraint-backed unique indexes remain authoritative.
- Optimized the ten RLS policies flagged by Supabase's `auth_rls_initplan` advisor by replacing per-row `auth.uid()` evaluation with `(select auth.uid())`.
- Preserved existing member, organization, admin, and super-admin authorization logic; no policy was broadened as part of the optimization.
- The remaining performance-advisor findings are informational unused-index reports and multiple-permissive-policy reports that require semantic consolidation rather than blind removal.
