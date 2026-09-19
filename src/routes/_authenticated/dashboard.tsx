import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRouter,
});

function DashboardRouter() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!role) {
      navigate({ to: "/signup", replace: true });
      return;
    }
    if (role === "admin") navigate({ to: "/admin-dashboard", replace: true });
    else if (role === "organization") navigate({ to: "/organization", replace: true });
    else navigate({ to: "/member", replace: true });
  }, [role, loading, navigate]);

  return (
      <div className="mx-auto max-w-3xl px-4 py-32 text-center text-muted-foreground">
        Routing you to your dashboard…
      </div>
    );
}
