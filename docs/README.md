# Technical Documentation Index

**Documentation initiative started:** 2026-10-13  
**Branch:** `docs/repository-audit-and-technical-blueprint`

This directory is being developed as a source-grounded reference for the existing CommonGround application. Claims must be labelled **Verified**, **Assumption / Inferred**, or **Proposed**. Repository documentation is not proof of live production state.

## Reading order

1. [Initial repository audit](06-audit/repository-audit.md) — current verified stack, preliminary product scope, known risks and missing evidence.
2. [Repository inventory](06-audit/repository-inventory.md) — 48 route modules, migration and test-file inventory.
3. [PRD](01-product/PRD.md) — requirements inventory; inferred behavior is labelled.
4. [User stories](01-product/user-stories.md) — stories and acceptance criteria.
5. [Technical requirements](02-technical/TRD.md) and [architecture](02-technical/architecture.md).
6. [API specification](02-technical/api-specification.md) — actual contracts only; unknown contracts stay marked unknown.
7. [Application flows](03-design/app-flows.md), [information architecture](03-design/information-architecture.md), [screen specifications](03-design/screen-specifications.md), and [design system](03-design/design-system.md).
8. [Database schema](04-data/database-schema.md), [data dictionary](04-data/data-dictionary.md), and [ER diagram](04-data/er-diagram.md).
9. [Implementation plan](05-implementation/implementation-plan.md), [task breakdown](05-implementation/task-breakdown.md), and [traceability](05-implementation/requirements-traceability.md).
10. [Technical debt](06-audit/technical-debt.md) and [open decisions](06-audit/open-decisions.md).
11. [Diagrams](diagrams/) — source-controlled Mermaid diagrams.

## Verification status

The first audit is an **initial audit**, not full sign-off. It inspects repository metadata, selected source/config files, code-search excerpts, and existing project documentation. It does not claim to have run the app, tests, production queries, or deployment checks. Database details and API contracts must be expanded by reading the full migration and server implementation inventory.

## Conventions

- **Verified:** supported by a concrete repository artifact.
- **Assumption / Inferred:** plausible but not yet directly verified; include a verification task.
- **Proposed:** new or changed behavior, not claimed to exist.
- Use stable IDs: FR, NFR, US, BR, FLOW, SCR, API, DATA, TASK, TEST.
- Never commit secret values, customer data, payment credentials, or production tokens.
- Do not run destructive migrations or modify production data during documentation work.
