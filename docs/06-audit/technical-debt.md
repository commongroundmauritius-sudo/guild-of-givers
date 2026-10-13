# Technical Debt and Risk Register

**Status:** Initial register; some items come from prior project history or historical docs and require current-head reproduction.

| ID | Item | Evidence/status | Risk | Recommended action |
|---|---|---|---|---|
| TD-001 | Signup E2E/account creation failure | Prior project history; not reproduced in this audit | Core acquisition journey blocked or unstable | Inspect exact CI run trace, Auth responses and worker logs. |
| TD-002 | Remote/local migration history drift | Prior project history; current version diff not measured | Deployment/reset inconsistency | Read-only version inventory; reviewed, non-destructive reconciliation plan. |
| TD-003 | Payment integration readiness mismatch | README says Peach golden flow; production audit says real Peach deferred | False payment success or launch risk | Verify current provider implementation; gate real-money processing. |
| TD-004 | Documentation drift | Multiple audit/gap docs exist | Incorrect engineering decisions | Date and reconcile every document against current code. |
| TD-005 | Authorization coverage unknown | RLS and roles described but not fully inspected | Data exposure or privilege escalation | Build operation matrix and negative tests. |
| TD-006 | Worker build complexity | Custom build script and SSR bundling options present; previous issues reported in project history | CI/production artifact failures | Verify artifact layout and Cloudflare worker entry in a clean CI build. |
| TD-007 | Operational observability unknown | Not inspected | Slow diagnosis/recovery | Inventory logs, alerts, backup and restoration evidence. |
| TD-008 | Design/accessibility consistency unknown | Tokens/components not fully inventoried | UX regressions and accessibility barriers | Audit semantic tokens and key screens. |

## Debt policy

Do not label historical issues as current defects without reproducing them. For each item capture evidence, current commit, reproduction steps, impact, owner, fix, regression test and verification result.
