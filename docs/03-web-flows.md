# Web Flows

All diagrams use Mermaid. Render in any Markdown viewer that supports it (GitHub, VS Code with Mermaid extension).

## 1. Signup → first contribution

```mermaid
flowchart TD
  A[Guest visits /] --> B[Clicks Become a Member]
  B --> C[/signup: choose monthly amount/]
  C --> D[Enter email + password]
  D --> E[Supabase Auth: create auth.users]
  E --> F[Trigger creates public.users + member_profiles]
  F --> G[Email verification sent]
  G --> H{Email verified?}
  H -- no --> G
  H -- yes --> I[Create subscriptions row pending_payment]
  I --> J[Edge fn peach-create-checkout]
  J --> K[Redirect to Peach hosted page]
  K --> L[User pays]
  L --> M[Peach webhook -> /api/public/peach-webhook]
  M --> N[Verify HMAC; insert payment_events]
  N --> O[Insert payments + payment_breakdowns + receipts]
  O --> P[subscriptions.lifecycle_status = active]
  P --> Q[/dashboard -> /member]
```

## 2. Auth + role routing

```mermaid
flowchart TD
  L[Login page] --> A[Supabase signIn]
  A --> S{Session?}
  S -- no --> L
  S -- yes --> R[Read users.role via auth_user_id]
  R -->|admin| AD[/admin]
  R -->|ngo| NG[/ngo]
  R -->|member| ME[/member]
```

## 3. Monthly billing & allocation

```mermaid
flowchart TD
  CRON[pg_cron / scheduler] --> MB[edge: monthly-billing]
  MB --> SUB[For each active subscription]
  SUB --> CH[Charge via Peach token]
  CH -->|ok| PAY[Insert payments + breakdowns + receipts]
  CH -->|fail| RT[Increment retry_count, set next_retry_at]
  PAY --> POOL[Sum impact_pool_amount of period]
  POOL --> AR[Create allocation_runs row]
  AR --> SNAP[Snapshot active initiative_allocations -> allocation_snapshots]
  SNAP --> CALC[Compute allocation_results per initiative]
  CALC --> LED[Post double-entry ledger_entries]
  LED --> UPD[Update initiatives.current_received_amount]
  UPD --> NOTI[Notify members + NGOs]
```

## 4. NGO onboarding

```mermaid
flowchart TD
  A[NGO signs up via invite or open apply] --> B[Create organizations row pending_review]
  B --> C[Upload docs -> organization_verifications]
  C --> D{Admin reviews}
  D -- reject --> R[Status rejected, NGO notified]
  D -- approve --> V[verification_status = verified]
  V --> I[NGO can create draft initiatives]
  I --> SR[Submit initiative for review]
  SR --> AR{Admin reviews initiative}
  AR -- approve --> AC[initiatives.status = active, listed publicly]
  AR -- reject --> RJ[Back to draft with notes]
```

## 5. Dispute lifecycle

```mermaid
flowchart TD
  M[Member opens dispute on a payment] --> D[disputes row status=open]
  D --> AD[Admin reviews payment + payment_events]
  AD -->|refund| RF[Trigger Peach refund -> webhook -> payments.status=refunded]
  AD -->|reject| RJ[disputes.status=rejected with notes]
  RF --> CL[disputes.status=resolved]
  RJ --> CL
  CL --> AU[Append audit_logs row]
```

## 6. Member updates allocation

```mermaid
flowchart TD
  A[Member opens Allocations] --> B[Load active initiative_allocations]
  B --> C[Adjust sliders]
  C --> D{Sum = 100%?}
  D -- no --> C
  D -- yes --> E[Upsert initiative_allocations rows, deactivate removed]
  E --> F[Toast: applied from next allocation run]
```
