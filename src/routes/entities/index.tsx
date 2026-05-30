import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/entities/")({
  component: EntitiesListPage,
});

function EntitiesListPage() {
  const { data: organizations, isLoading } = useQuery({
    queryKey: ["public-organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, organization_name, description")
        .order("organization_name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-20">
        <h1 className="font-display text-5xl font-bold">Partner Organizations</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          The incredible NGOs and charities making an impact on the ground.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [1, 2, 3].map((n) => <Skeleton key={n} className="h-48 rounded-3xl" />)
            : organizations?.map((org) => (
                <Link
                  key={org.id}
                  to="/entities/$id"
                  params={{ id: org.id }}
                  className="group p-8 rounded-3xl border border-border/40 hover:border-primary/40 transition-all bg-card"
                >
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                    {org.organization_name}
                  </h3>
                  <p className="mt-4 text-muted-foreground line-clamp-2">{org.description}</p>
                </Link>
              ))}
        </div>
      </div>
    </SiteLayout>
  );
}
