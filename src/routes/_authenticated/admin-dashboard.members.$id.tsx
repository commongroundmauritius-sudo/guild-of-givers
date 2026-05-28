import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SupporterProfile } from "@/components/dashboard/modules/crm/components/SupporterProfile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin-dashboard/members/$id")({
  component: MemberDetailPage,
});

function MemberDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              className="rounded-xl gap-2 text-muted-foreground hover:text-primary"
              onClick={() => navigate({ to: '/admin-dashboard/members' })}
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
