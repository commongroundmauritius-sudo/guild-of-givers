import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SupporterProfile } from "@/components/dashboard/modules/crm/components/SupporterProfile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/admin-dashboard/members/$id")({
  component: MemberDetailPage,
});

function MemberDetailPage() {
  const { id } = Route.useParams();
  const { user, role, loading: authLoading, authDataError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || authDataError) return;
    if (role !== "admin" && role !== "super_admin") {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [authLoading, authDataError, role, navigate]);

  if (authLoading) return <div className="mx-auto max-w-7xl px-4 py-32 text-center">Verifying administrative access...</div>;
  if (authDataError) return <div className="mx-auto max-w-7xl px-4 py-32 text-center">Unable to verify administrative access.</div>;
  if (!user || (role !== "admin" && role !== "super_admin")) return null;

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              className="rounded-xl gap-2 text-muted-foreground hover:text-primary"
              onClick={() => navigate({ to: "/admin-dashboard/members" })}
            >
              <ArrowLeft className="h-4 w-4" /> Back to Members
            </Button>
          </div>

          <SupporterProfile profileId={id} />
        </div>
      </section>
    </SiteLayout>
  );
}
