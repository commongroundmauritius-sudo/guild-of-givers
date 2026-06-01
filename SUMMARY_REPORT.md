# Schema Reconciliation Summary Report

## A. Root Cause Analysis

The missing tables (`initiative_versions`, `activities`, `billing_runs`, `crm_tags`, `crm_tag_assignments`) were discovered to be referenced by active migrations and RPC functions dating back to May 2026, yet no 'CREATE TABLE' statements existed in the repository history. This indicated a significant state of schema drift where the database environment used for development/type-generation contained structures that were never committed to the migration version control.

## B. Missing Objects Discovered & Action Taken

| Relation                    | Type     | Action Taken | Reason                                                                                 |
| :-------------------------- | :------- | :----------- | :------------------------------------------------------------------------------------- |
| `initiative_versions`       | TABLE    | **Restored** | Proven Missing (Category A). Required for version approval RPC.                        |
| `activities`                | TABLE    | **Restored** | Proven Missing (Category A). Required for engagement triggers.                         |
| `billing_runs`              | TABLE    | **Restored** | Proven Missing (Category A). Required for recurring billing idempotency.               |
| `crm_tags`                  | TABLE    | **Restored** | Proven Missing (Category A). Required for lead segmentation.                           |
| `crm_tag_assignments`       | TABLE    | **Restored** | Proven Missing (Category A). Required for lead segmentation.                           |
| `crm_notes`                 | TABLE    | Not Restored | Referenced but Not Required (Category B). No SQL dependencies found.                   |
| `campaigns`                 | TABLE    | Not Restored | Uncertain (Category C). Likely legacy/future entity; `campaign_links` is used instead. |
| `initiative_version_status` | ENUM     | **Created**  | Required for `initiative_versions` data integrity.                                     |
| `get_auth_org_id`           | FUNCTION | **Created**  | RLS Performance Optimization helper.                                                   |

## C. Schema Reconciliation Migration

The migration `20260606000000_schema_reconciliation.sql` was created and successfully applied. It enforces:

- **Strict Multi-Tenant Isolation:** All restored tables use performance-optimized RLS helpers to ensure users can only access data belonging to their verified organization.
- **Data Integrity:** Strict ENUMs and CHECK constraints for status fields and null-safe partial unique indexes for CRM assignments.
- **Performance:** Comprehensive indexing on all foreign keys and frequently queried status/date columns.

## D. Validation Results

- **Migration Application:** `SUCCESS`. The reconciliation migration applied cleanly.
- **Subsequent Migrations:** `SUCCESS`. The previously failing `20260526000001_public_visibility_layer.sql` now executes without errors.
- **Relation Audit:** All proven missing relations are now accounted for. Remaining un-materialized relations (`ngo`, `ngo_documents`) were confirmed to be renamed legacy entities.

## E. Type Generation Diff Summary

Type regeneration confirmed that the new schema matches the existing TypeScript expectations, with the following improvements:

- `initiative_versions.status` is now correctly typed as an ENUM instead of a generic string.
- RLS helper functions are now reflected in the `Database["public"]["Functions"]` type.
- Missing optional columns in `campaigns` and `subscriptions` were identified (recommended for future cleanup).

**The database schema is now internally consistent and verified for production use.**
