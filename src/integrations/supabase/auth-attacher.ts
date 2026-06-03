import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

/**
 * Client-side function middleware that attaches the current Supabase
 * access token to every server function call as an Authorization header.
 *
 * Required because this project stores sessions in localStorage (not cookies),
 * so server functions cannot otherwise discover the signed-in user.
 */
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        return next({ headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (e) {
      // fall through unauthenticated
    }
    return next();
  },
);
