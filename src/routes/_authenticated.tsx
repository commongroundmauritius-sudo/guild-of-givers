import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && typeof window !== "undefined") {
      // Use a full navigation so an unauthenticated protected route cannot
      // remain mounted in the authenticated route tree.
      window.location.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [loading, user]);

  if (loading && !user) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-32 text-center text-muted-foreground">
          Loading your account…
        </div>
      </SiteLayout>
    );
  }

  if (!loading && !user) return null;

  return <Outlet />;
}
