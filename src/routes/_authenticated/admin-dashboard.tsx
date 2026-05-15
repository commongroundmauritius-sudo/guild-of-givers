import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/_authenticated/admin-dashboard")({
  component: AdminDashboardLayout,
});

function AdminDashboardLayout() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      navigate({ to: "/dashboard" });
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-4 py-32 text-center text-muted-foreground">
          Verifying administrative access...
        </div>
      </SiteLayout>
    );
  }

  if (role !== "admin") return null;

  return <Outlet />;
}
