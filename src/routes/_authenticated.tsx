import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, sessionReady } = useAuth();

  useEffect(() => {
    if (!sessionReady || user || typeof window === "undefined") return;

    const redirectPath = `${window.location.pathname}${window.location.search}`;
    window.location.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }, [sessionReady, user]);

  if (!sessionReady || !user) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-32 text-center text-muted-foreground">
          Checking your account…
        </div>
      </SiteLayout>
    );
  }

  return <Outlet />;
}
