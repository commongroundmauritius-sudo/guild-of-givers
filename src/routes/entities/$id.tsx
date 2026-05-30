import { isUUID } from "@/lib/identifiers";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/entities/$id")({
  component: OrganizationProfilePage,
});

function OrganizationProfilePage() {
  const { id } = Route.useParams();
  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization", id],
    queryFn: async () => {
      if (!isUUID(id)) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("*, initiatives(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="p-24">
          <Skeleton className="h-64 w-full" />
        </div>
      </SiteLayout>
    );
  }

  if (!organization) {
    return (
      <SiteLayout>
        <div className="p-24 text-center">Not found</div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-20">
        <h1 className="font-display text-4xl font-bold">{organization.organization_name}</h1>
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {organization.initiatives
            ?.filter((i) => i.is_published)
            .map((i) => (
              <Link
                key={i.id}
                to="/initiatives/$slug"
                params={{ slug: i.slug || i.id }}
                className="block rounded-3xl border border-border/40 p-8 hover:border-primary/40 transition"
              >
                <h3 className="font-display text-2xl font-bold">{i.title}</h3>
                <div className="mt-6 flex items-center justify-between">
                  <span className="font-bold">
                    Rs {Number(i.current_amount_mur).toLocaleString()} raised
                  </span>
                  <ArrowRight className="h-5 w-5" />
                </div>
              </Link>
            ))}
        </div>
      </div>
    </SiteLayout>
  );
}
