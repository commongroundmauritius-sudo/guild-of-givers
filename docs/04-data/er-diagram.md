# Entity Relationship Diagram

**Status:** Conceptual only. Entity relationships are not fully verified; do not treat this diagram as a schema migration specification.

```mermaid
erDiagram
  AUTH_USERS ||--o| PROFILES : "identity link documented/inferred"
  AUTH_USERS ||--o{ USER_ROLES : "role assignments documented"
  PROFILES ||--o{ SUBSCRIPTIONS : "membership relation to verify"
  SUBSCRIPTIONS ||--o{ PAYMENTS : "payment relation to verify"
  PAYMENTS ||--o{ PAYMENT_EVENTS : "provider-event relation to verify"
  FINANCIAL_ACCOUNTS ||--o{ FINANCIAL_EVENTS : "account/event relation to verify"
  INITIATIVES }o--|| ORGANIZATIONS : "ownership relation to verify"
```

The diagram includes conceptual relationships for investigation, not confirmed cardinalities. Verify every FK, uniqueness rule, nullable link and join path from migrations and generated types before calling this an ER model of the current database.
