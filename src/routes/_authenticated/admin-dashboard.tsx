import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/_authenticated/admin-dashboard")({
  component: AdminDashboardLayout,
});

function AdminDashboardLayout() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || role !== "admin")) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, role, authLoading, navigate]);

  if (authLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-4 py-32 text-center text-muted-foreground">
          Verifying administrative access...
        </div>
      </SiteLayout>
    );
  }

  if (!authLoading && role !== "admin") return null;

  return <Outlet />;
}
