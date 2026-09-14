import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, sessionReady } = useAuth();

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
