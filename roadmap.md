# Dashboard database repair

- [x] Check live access: no connected backend or database credentials are available in this chat.
- [x] Save a repair script without editing existing migrations; the migration directory is integration-managed.
- [x] Run isolated database regression tests: reproduced recursion before repair; all eight access-control tests pass after repair, including repeat application.
- [ ] Apply a forward migration to the existing live database and verify the signed-in dashboard. Blocked by missing database connection.