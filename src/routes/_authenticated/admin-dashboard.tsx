import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/_authenticated/admin-dashboard")({
  component: AdminDashboardLayout,
});

function AdminDashboardLayout() {
  const { user, role, loading: authLoading, sessionReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionReady || !user || authLoading) return;

    if (role !== "admin" && role !== "super_admin") {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, role, authLoading, sessionReady, navigate]);

  // The _authenticated parent owns unauthenticated -> /login routing.
  if (!sessionReady || authLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-4 py-32 text-center text-muted-foreground">
          Verifying administrative access...
        </div>
      </SiteLayout>
    );
  }

  if (!user) return null;
  if (role !== "admin" && role !== "super_admin") return null;

  return <Outlet />;
}
