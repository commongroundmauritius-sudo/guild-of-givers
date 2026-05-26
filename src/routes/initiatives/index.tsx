import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useMemo } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, Heart } from "lucide-react";
import { InitiativeCard } from "@/components/InitiativeCard";

export const Route = createFileRoute("/initiatives/")({
  head: () => ({
    meta: [
      { title: "Initiatives — CommonGround" },
      {
        name: "description",
        content: "Browse long-term, vetted programs you can support with one monthly membership.",
      },
      { property: "og:title", content: "Vetted Initiatives — CommonGround" },
      { property: "og:description", content: "Explore high-impact social programs making a difference in Mauritius." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: InitiativesPage,
});

function InitiativesPage() {
  const queryKeys = useMemo(() => [["public-initiatives"]], []);
  useRealtimeSync("initiatives", queryKeys);
  const {
    data: initiatives,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-initiatives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*, organizations(organization_name, status)")
        .eq("is_approved", true)
        .eq("is_published", true)
        .or("organization_id.is.null,organizations.status.eq.active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <SiteLayout>
      <section className="bg-background min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              Our Impact
            </span>
            <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-primary sm:text-6xl">
              Vetted Initiatives You Can Support
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
              CommonGround members fund a curated selection of high-impact programs. Each initiative
              is a multi-year commitment to systemic change, not a one-off project.
            </p>
          </div>

          {isLoading ? (
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="space-y-4">
                  <Skeleton className="aspect-[16/10] w-full rounded-3xl" />
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="mt-12 flex flex-col items-center justify-center rounded-[2.5rem] border border-red-100 bg-red-50/30 p-12 text-center">
              <div className="rounded-full bg-red-100 p-3 text-red-600">
                <Info className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-red-900">
                Failed to load initiatives
              </h2>
              <p className="mt-2 text-red-700/80">
                There was an error connecting to the database. Please try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : initiatives && initiatives.length > 0 ? (
            <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {initiatives.map((i) => (
                <InitiativeCard key={i.id} initiative={i} />
              ))}
            </div>
          ) : (
            <div className="mt-16 rounded-[3rem] border border-dashed border-border/60 bg-muted/30 p-12 text-center sm:p-20">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 text-primary">
                <Heart className="h-10 w-10" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-semibold text-primary">
                No active initiatives found
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-muted-foreground leading-relaxed">
                We're currently vetting new high-impact programs. Join our community to be the first
                to know when they go live.
              </p>
              <div className="mt-10">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-10 py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl active:scale-95"
                >
                  Become a Member
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
