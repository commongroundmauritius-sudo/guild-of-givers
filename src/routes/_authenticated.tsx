import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we've finished loading and still have no user
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  // Only block the entire layout if we're doing the initial session load
  // and we don't have a user yet. If we have a user, we can render the
  // children (like the dashboard) which can handle their own loading states
  // for specific data.
  if (loading && !user) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-32 text-center text-muted-foreground">
          Loading your account…
        </div>
      </SiteLayout>
    );
  }

  // If loading is false and no user, the useEffect will handle redirection.
  // We return null here to avoid a flash of content.
  if (!loading && !user) return null;

  return <Outlet />;
}
