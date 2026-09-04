import { supabase } from "@/integrations/supabase/client";
import { createIsomorphicFn } from "@tanstack/react-start";
import { parseCookie } from "cookie-es";

const getServerRequestContext = createIsomorphicFn()
  .client(() => ({ cookie: "", authorization: "" }))
  .server(async () => {
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const req = getRequest();
      return {
        cookie: req.headers.get("cookie") || "",
        authorization: req.headers.get("authorization") || "",
      };
    } catch (e) {
      return { cookie: "", authorization: "" };
    }
  });

/**
 * Server-side authorization and session helpers.
 */

function applySupabaseBearer(token: string) {
  const authorization = `Bearer ${token}`;

  try {
    const client = supabase as any;
    client.headers = { ...(client.headers ?? {}), Authorization: authorization };

    const restHeaders = client.rest?.headers;
    if (typeof restHeaders?.set === "function") {
      restHeaders.set("Authorization", authorization);
    } else if (restHeaders) {
      restHeaders.Authorization = authorization;
    }
  } catch {
    // ignore header attachment failures; the caller will fail closed
  }
}

/**
 * Robustly retrieves the current user, handling both client and server (TanStack Start) environments.
 */
export async function getSessionUser() {
  try {
    // 1. Try standard getUser (works in client, and if session was already set)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (user && !error) return user;

    // 2. If we're on the server or getUser failed, try to resolve from request context
    const { cookie: cookieHeader, authorization } = await getServerRequestContext();

    // 2a. Prefer Authorization: Bearer <token> attached by attachSupabaseAuth middleware
    if (authorization) {
      const match = authorization.match(/^Bearer\s+(.+)$/i);
      const token = match?.[1];
      if (token) {
        const {
          data: { user: bearerUser },
          error: bearerError,
        } = await supabase.auth.getUser(token);
        if (bearerUser && !bearerError) {
          // CRITICAL: attach the bearer token to the PostgREST client so
          // subsequent RLS-scoped queries (e.g. user_roles lookups in
          // isAdmin) run as this authenticated user instead of `anon`.
          applySupabaseBearer(token);
          return bearerUser;
        }
      }
    }

    if (cookieHeader) {
      const cookies = parseCookie(cookieHeader);

      // Extract project ref dynamically from supabase client URL to avoid hardcoding errors
      const supabaseUrl = (supabase as any).supabaseUrl;
      const projectRef = supabaseUrl
        ? new URL(supabaseUrl).hostname.split(".")[0]
        : "vzsifigcowusabfmnudk";

      // Possible cookie names:
      // - sb-<ref>-auth-token
      // - sb-<ref>-auth-token.0, sb-<ref>-auth-token.1 (chunked)
      // - supabase-auth-token

      let authCookieContent = cookies[`sb-${projectRef}-auth-token`];

      // Handle chunked cookies (Common in Supabase/SSR)
      if (!authCookieContent) {
        let i = 0;
        let chunkedValue = "";
        while (cookies[`sb-${projectRef}-auth-token.${i}`]) {
          chunkedValue += cookies[`sb-${projectRef}-auth-token.${i}`];
          i++;
        }
        if (chunkedValue) {
          authCookieContent = chunkedValue;
        }
      }

      // Fallback to legacy/generic name if needed
      if (!authCookieContent) {
        authCookieContent = cookies["supabase-auth-token"];
      }

      if (authCookieContent) {
        try {
          // Supabase cookies are often URL-encoded JSON or quoted JSON strings
          let decoded = authCookieContent;

          // Safety check for URL encoding
          if (authCookieContent.includes("%")) {
            try {
              decoded = decodeURIComponent(authCookieContent);
            } catch (e) {
              console.warn("getSessionUser: decodeURIComponent failed", e);
            }
          }

          // If the cookie is double-quoted (e.g. "{"access_token":...}")
          if (decoded.startsWith('"') && decoded.endsWith('"')) {
            decoded = decoded.slice(1, -1);
          }

          const parsed = JSON.parse(decoded);
          const accessToken = parsed.access_token;
          const refreshToken = parsed.refresh_token;

          if (accessToken) {
            applySupabaseBearer(accessToken);
            // CRITICAL: We must set the session on the supabase client instance used in the server call
            const {
              data: { user: sessionUser },
              error: sessionError,
            } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });
            if (sessionUser && !sessionError) return sessionUser;
          }
        } catch (e) {
          console.debug("getSessionUser: Auth cookie parsing failed", e);
        }
      }
    }
  } catch (error) {
    console.warn("getSessionUser context warning:", error);
  }

  return null;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "super_admin"])
    .limit(1)
    .maybeSingle();

  if (error || !data) return false;
  return data.role === "admin" || data.role === "super_admin";
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .limit(1)
    .maybeSingle();

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
