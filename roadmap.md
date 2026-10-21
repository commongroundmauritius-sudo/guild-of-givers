# Dashboard database repair

- [x] Confirm Website is connected to the existing database.
- [x] Save a repair script without editing existing migrations; the migration directory is integration-managed.
- [x] Run isolated database regression tests: reproduced recursion before repair; all eight access-control tests pass after repair, including repeat application.
- [x] Apply the forward migration and confirm the live policies no longer query their own role table.
- [ ] Correct errors revealed by regenerated database types and verify the preview.
- [ ] Verify the signed-in dashboard through the UI. Blocked: external authentication cannot be restored by the browser test tools.