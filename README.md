# CommonGround — Social Contribution & Transparency Platform

CommonGround is a social infrastructure platform designed to bridge the gap between members and NGOs through transparency, secure contributions, and impact tracking.

## 1. Project Overview
CommonGround is more than a donation site; it is a comprehensive ecosystem:
- **Membership Platform:** Recurring subscriptions for long-term support.
- **NGO Discovery:** Vetted organizations and impactful initiatives.
- **Transparency Platform:** Public reports and allocation tracking.
- **Contribution Management:** Fintech-grade ledger for all transactions.
- **Governance System:** Admin-moderated workflows for NGOs and initiatives.

## 2. Core Architecture

The system is built with a **Backend as the Source of Truth** philosophy.

### Layer 1: Frontend (React + Tailwind)
- Handles UI, dashboards, and user interaction.
- Communicates with Supabase for data and authentication.
- Does not contain critical business logic or trust client-side state for sensitive operations.

### Layer 2: Backend / Supabase
- **Authentication:** Supabase Auth handles identities.
- **Database:** PostgreSQL with Row Level Security (RLS) enforcing strict access controls.
- **Triggers:** Automatic initialization of profiles and roles on signup.
- **Logic:** RLS and Database Functions ensure data integrity and security.

### Layer 3: External Services (Peach Payments)
- **Payments:** Secure recurring credit card processing.
- **Webhooks:** The **ONLY** trusted source for payment confirmation.
- **Ledger:** Every webhook event is archived in `payment_events` for auditing.

## 3. Data Flow & Actors

### Actors
1. **Members:** Subscribe to plans, select allocation preferences, and track impact via receipts.
2. **NGOs:** Manage profiles, publish initiatives, and upload transparency reports.
3. **Admins:** The platform "Control Center." They vet NGOs, moderate reports, and monitor financial health.
4. **Payment Processor:** Processes money movement and informs the backend via webhooks.

### The "Golden Flow"
1. User creates account -> Trigger creates `profile` + `member` role.
2. User selects subscription -> Frontend initiates Peach checkout.
3. User pays -> Peach sends **Webhook** to backend.
4. Backend validates Webhook -> Updates `subscriptions` + Creates `payments` + Generates `receipt`.
5. Dashboard reflects the new state automatically.

## 4. Database Schema

The platform is centered around a robust relational model:
- `profiles`: User identity (extended from `auth.users`).
- `user_roles`: Role-based access control (`member`, `ngo`, `admin`).
- `ngos`: Organization details and verification status.
- `initiatives`: Specific projects requiring support (Admin approved).
- `subscriptions`: Recurring contribution agreements.
- `payments`: Historical ledger of actual money movement.
- `receipts`: User-facing proof of contribution.
- `payment_events`: Raw audit trail of all webhook activity.
- `reports`: NGO transparency and impact documentation.
- `allocations`: Granular tracking of how funds reach initiatives.

## 5. Security & Governance (RLS)
Security is enforced at the database level:
- Members only see their own receipts and payments.
- NGOs only manage their own initiatives.
- Admins have full oversight but cannot modify immutable financial history.
- **Suspension System:** Admins can deactivate NGOs or Users, which immediately restricts their visibility and access platform-wide.

## 6. Development Process
The project followed an **Infrastructure-First** approach:
1. **Foundation:** Established core tables, triggers, and RLS.
2. **Member Experience:** Built the "Become a Member" flow with optional 3.5% fee cover.
3. **Governance Layer:** Implemented Admin/NGO interaction loops.
4. **Synchronization:** Local migrations are managed via the Supabase CLI and synced with the live project (`vzsifigcowusabfmnudk`).

## 7. Tech Stack
- **Frontend:** React, TanStack Start/Router/Query, Tailwind CSS.
- **Backend:** Supabase (PostgreSQL, Auth, RLS).
- **Icons:** Lucide React.
- **Charts:** Recharts.

---
*CommonGround: Building trust through infrastructure.*

## Manual Operational Tasks
For detailed instructions on setting up Storage Buckets, SMTP, and Peach Payments webhooks, refer to [MANUAL_WORK.md](./MANUAL_WORK.md).
