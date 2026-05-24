# Security Audit: CommonGround Platform

## 1. Overview
This report details the security state of the platform, focusing on Supabase RLS, function permissions, and storage policies.

## 2. Key Findings Summary
* **Current Status:** CRITICAL RISK
* **Open Critical Issues:** 1
* **Open High Issues:** 1

## 3. Detailed Audit Findings

### [SEC-001] SECURITY DEFINER Exposure
* **Description:** Advisor identified several functions that bypass RLS because they are SECURITY DEFINER and have public execute permissions.
* **Status:** Open
* **Severity:** P1
* **Target:** has_role, allocate_payment_funds, activate_membership, etc.
* **Fix:** Revoke EXECUTE on PUBLIC and set search_path.

### [SEC-002] RLS Permission Failures
* **Description:** Recent hardening broke 'anon' access to 'has_role', which is used by public policies.
* **Status:** Open
* **Severity:** P0
* **Fix:** Grant EXECUTE on public.has_role to anon.

## 4. Storage Security
* **Bucket: community-posts** - Public listing enabled (WARN).


### [SEC-003] Missing search_path on SEC-DEF Functions
* **Severity:** P0
* **Status:** Open
* **Description:** Functions like increment_initiative_amount lack search_path=public.
* **Fix:** ALTER FUNCTION ... SET search_path = public.

### [SEC-004] Sensitive RPC Exposure
* **Severity:** P1
* **Status:** Open
* **Description:** allocate_payment_funds is callable by anon.
* **Fix:** Revoke execute from public.
