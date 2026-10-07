import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getSessionUser } from "@/lib/security/auth";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const user = await getSessionUser();
    if (!user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.pathname },
        replace: true,
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <SiteLayout>
      <Outlet />
    </SiteLayout>
  );
}
