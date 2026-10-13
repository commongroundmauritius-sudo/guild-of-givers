# User Stories

**Status:** Draft; stories are based on documented product scope and must be checked against the full current route inventory.

- **US-001 — Discover impact:** As a public visitor, I want to browse initiatives so I can understand the organizations and work supported by the platform. Acceptance: public-approved initiatives load; unavailable or unpublished slugs show a safe not-found state.
- **US-002 — Join as a member:** As a prospective member, I want to complete signup so I can access my account. Acceptance: valid data advances through the actual signup steps; Auth errors remain visible and retryable; no success is claimed before server confirmation.
- **US-003 — Manage account:** As a member, I want to view and update permitted profile settings. Acceptance: only the authenticated user's permitted fields can be changed.
- **US-004 — Set preferences:** As a member, I want to select or rank organizations/initiatives according to the approved model. Acceptance: saved preferences persist and the backend enforces allowed values and ownership. Allocation math remains unverified.
- **US-005 — View membership status:** As a member, I want to see the status and next billing information of my membership. Acceptance: status is sourced from trusted records, not browser-only state.
- **US-006 — Organization management:** As an organization representative, I want to maintain my organization's permitted profile and initiative data. Acceptance: ownership checks prevent cross-organization changes.
- **US-007 — Administrative review:** As an administrator, I want to review submitted organizations and initiatives. Acceptance: only authorized administrators can approve, reject or moderate content, with an audit trail where supported.
- **US-008 — Financial audit:** As an authorized administrator, I want to inspect financial events. Acceptance: financial records have stable references and access controls; member access is restricted to permitted own-account data.
- **US-009 — Payment event processing:** As the platform, I want to process valid provider events idempotently. Acceptance: invalid signatures/references/amounts/currency and duplicate events cannot activate a subscription twice.
- **US-010 — Privacy choices:** As a visitor, I want privacy/cookie information and meaningful consent controls. Acceptance: optional processing respects consent and preferences can be changed as specified by the approved policy.
- **US-011 — Recover from failure:** As a user, I want clear errors and retry paths when network, validation or server operations fail. Acceptance: errors are accessible and do not discard entered data unnecessarily.
