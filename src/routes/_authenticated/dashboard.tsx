import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRouter,
});

function DashboardRouter() {
  const { role, loading, authDataError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (authDataError) return;
    if (!role) {
      navigate({ to: "/signup", replace: true });
      return;
    }
    if (role === "admin" || role === "super_admin") {
      navigate({ to: "/admin-dashboard", replace: true });
    }
    else if (role === "organization") navigate({ to: "/organization", replace: true });
    else navigate({ to: "/member", replace: true });
  }, [role, loading, navigate]);

  if (authDataError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="text-xl font-semibold text-primary">We could not verify your account role.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please refresh the page. If the problem continues, contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-32 text-center text-muted-foreground">
      Routing you to your dashboard…
    </div>
  );
}
