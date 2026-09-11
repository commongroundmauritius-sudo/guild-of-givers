import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, sessionReady } = useAuth();

  useEffect(() => {
    if (!sessionReady || user || typeof window === "undefined") return;

    // The auth provider has finished its bounded session lookup. Redirect at
    // the route boundary instead of waiting on profile/role queries that are
    // irrelevant to an unauthenticated visitor.
    window.location.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  }, [sessionReady, user]);

  if (!sessionReady) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-32 text-center text-muted-foreground">
          Checking your account…
        </div>
      </SiteLayout>
    );
  }

  if (!user) return null;

  return <Outlet />;
}
