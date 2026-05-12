import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/ngo")({
  component: NgoDashboard,
});

function NgoDashboard() {
  const { user, signOut } = useAuth();

  const { data: initiatives } = useQuery({
    queryKey: ["ngo-initiatives", user?.id],
    queryFn: async () => {
      // In a real scenario, we'd first find the NGO linked to this user
      // For now, we fetch initiatives (assuming this NGO has some)
      const { data } = await supabase
        .from("initiatives")
        .select("*, ngos(name)")
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <SiteLayout>
      <section>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="kicker">Organization</span>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary sm:text-5xl">
                NGO Dashboard
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage your initiatives, funding cycles, and member updates.
              </p>
            </div>
            <button
              onClick={signOut}
              className="rounded-full border border-input bg-background px-5 py-2.5 text-sm hover:bg-muted"
            >
              Sign out
            </button>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { title: "Total Funding", value: "Rs 0" },
              { title: "Active Initiatives", value: initiatives?.length ?? 0 },
              { title: "Impact Score", value: "—" },
            ].map((c) => (
              <div key={c.title} className="rounded-3xl border border-border/40 bg-card p-6">
                <p className="text-sm text-muted-foreground">{c.title}</p>
                <p className="mt-3 font-display text-3xl text-primary">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-primary">Your Initiatives</h2>
              <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                New Initiative
              </button>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {initiatives && initiatives.length > 0 ? (
                initiatives.map((i) => (
                  <div
                    key={i.id}
                    className="group overflow-hidden rounded-3xl border border-border/40 bg-card transition hover:border-primary/40"
                  >
                    <div className="aspect-video bg-muted" />
                    <div className="p-6">
                      <h3 className="font-display text-lg font-semibold text-primary">{i.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {i.description}
                      </p>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span>Progress</span>
                          <span>
                            {(
                              (Number(i.current_amount_mur) / Number(i.goal_amount_mur)) *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${(Number(i.current_amount_mur) / Number(i.goal_amount_mur)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                  <p className="text-muted-foreground">You haven't created any initiatives yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
