import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    // Sessions are browser-only. On protected client navigation, fail closed
    // immediately when there is no Supabase auth token, then confirm it with
    // Supabase before allowing the route to complete.
    if (typeof window === "undefined") return;

    const hasStoredSession = Object.keys(window.localStorage).some((key) => {
      if (!key.startsWith("sb-") || !key.includes("-auth-token")) return false;
      try {
        const value = JSON.parse(window.localStorage.getItem(key) || "null");
        return Boolean(value?.access_token) || Boolean(value?.refresh_token);
      } catch {
        return true;
      }
    });

    if (!hasStoredSession) {
      throw redirect({
        to: "/login",
        search: { redirect: location.pathname },
        replace: true,
      });
    }

    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.pathname },
        replace: true,
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <SiteLayout>
      <Outlet />
    </SiteLayout>
  );
}
