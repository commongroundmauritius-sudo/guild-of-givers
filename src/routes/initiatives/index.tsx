import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useMemo } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Info, Heart } from "lucide-react";
import { getJoinedField } from "@/lib/utils";

export const Route = createFileRoute("/initiatives/")({
  head: () => ({
    meta: [
      { title: "Initiatives — CommonGround" },
      {
        name: "description",
        content: "Browse long-term, vetted programs you can support with one monthly membership.",
      },
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
        .select("*, ngos!inner(name, status)")
        .eq("is_approved", true)
        .eq("is_published", true)
        .eq("ngos.status", "active")
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
              {initiatives.map((i) => {
                const goal = Math.max(1, Number(i.goal_amount_mur) || 0);
                const current = Number(i.current_amount_mur) || 0;
                const progress = Math.min(100, Math.round((current / goal) * 100));

                const ngoName = getJoinedField(i.ngos, "name");

                return (
                  <Link
                    key={i.id}
                    to="/initiatives/$id"
                    params={{ id: i.id }}
                    className="group flex flex-col overflow-hidden rounded-[2.5rem] border border-border/40 bg-card transition-all duration-300 hover:-translate-y-2 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {i.image_url ? (
                        <img
                          src={i.image_url}
                          alt={i.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                          <Heart className="h-12 w-12 text-primary/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>

                    <div className="flex flex-1 flex-col p-8">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                          {ngoName || "NGO Partner"}
                        </span>
                      </div>

                      <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-primary transition-colors group-hover:text-primary/80">
                        {i.title}
                      </h2>

                      {i.caption && (
                        <p className="mt-2 text-sm font-semibold text-teal-600">{i.caption}</p>
                      )}

                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {i.summary ||
                          i.description ||
                          "Join us in supporting this vital initiative for the community."}
                      </p>

                      <div className="mt-auto pt-8">
                        <div className="mb-4 space-y-2">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <span>Funding Progress</span>
                            <span className="text-primary">{progress}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary transition-all duration-1000 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-primary">
                              Rs {current.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-medium uppercase text-muted-foreground">
                              raised of Rs {goal.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20">
                            <ArrowRight className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
