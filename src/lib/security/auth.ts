import { supabase } from "@/integrations/supabase/client";
import { getRequest } from "@tanstack/react-start/server";
import { parseCookie } from "cookie-es";

/**
 * Server-side authorization and session helpers.
 */

/**
 * Robustly retrieves the current user, handling both client and server (TanStack Start) environments.
 */
export async function getSessionUser() {
  try {
    // 1. Try standard getUser (works in client, and in server if headers are automatically forwarded)
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user && !error) return user;

    // 2. If we're on the server and getUser failed, try to manually resolve from cookies
    const request = getRequest();
    if (request) {
      const cookies = parseCookie(request.headers.get("cookie") || "");

      // Look for Supabase auth cookies
      // The naming pattern is usually sb-<project-ref>-auth-token
      const projectRef = "vzsifigcowusabfmnudk";
      const authCookie = cookies[`sb-${projectRef}-auth-token`];

      if (authCookie) {
        try {
          const parsed = JSON.parse(authCookie);
          const accessToken = parsed.access_token;
          const refreshToken = parsed.refresh_token;

          if (accessToken) {
            const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });
            if (sessionUser && !sessionError) return sessionUser;
          }
        } catch (e) {
          console.error("Failed to parse auth cookie:", e);
        }
      }
    }
  } catch (error) {
    // getRequest might throw if called outside of a request context
    console.warn("getSessionUser context warning:", error);
  }

  return null;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !data) return false;
  return data.role === "admin" || data.role === "super_admin";
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !data) return false;
  return data.role === "super_admin";
}

export async function ensureAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized: Authentication required");

  const authorized = await isAdmin(user.id);
  if (!authorized) {
    throw new Error("Unauthorized: Admin access required");
  }
  return user;
}

export async function ensureSuperAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized: Authentication required");

  const authorized = await isSuperAdmin(user.id);
  if (!authorized) {
    throw new Error("Unauthorized: Super Admin access required");
  }
  return user;
}

export async function ensureAuthenticated() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized: Authentication required");
  }
  return user;
}
