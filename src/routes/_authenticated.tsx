import { createFileRoute, Navigate, Outlet, redirect } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    // Fast client-side gate for protected routes. Supabase persists its
    // session in localStorage; this prevents protected pages from remaining
    // visible while the async auth provider is still hydrating. RLS remains
    // the authoritative backend authorization layer.
    if (typeof window !== "undefined") {
      const hasSupabaseSession = Object.keys(window.localStorage).some((key) =>
        /^sb-.+-auth-token$/.test(key),
      );

      if (!hasSupabaseSession) {
        const current = `${window.location.pathname}${window.location.search}`;
        throw redirect({
          to: "/login",
          search: { redirect: current },
        });
      }
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, sessionReady } = useAuth();

  if (!sessionReady) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-32 text-center text-muted-foreground">
          Checking your account…
        </div>
      </SiteLayout>
    );
  }

  if (!user) {
    const redirectPath =
      typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/";

    return <Navigate to="/login" search={{ redirect: redirectPath }} replace />;
  }

  return <Outlet />;
}
