import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/initiatives")({
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
  const { data: initiatives } = useQuery({
    queryKey: ["public-initiatives"],
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("*, ngos!inner(name, status)")
        .eq("is_approved", true)
        .eq("is_published", true)
        .eq("ngos.status", "active");
      return data;
    },
  });

  return (
    <SiteLayout>
      <section>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="kicker">Initiatives</span>
          <h1 className="mt-4 font-display text-5xl font-semibold text-primary sm:text-6xl">
            Long-term Programs You Can Support
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Starting with a vetted set of partners and expanding continuously. Each program is a
            multi-year commitment — restoration, education, community resilience — not a one-off
            project.
          </p>

          {initiatives && initiatives.length > 0 ? (
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {initiatives.map((i) => (
                <div
                  key={i.id}
                  className="group overflow-hidden rounded-3xl border border-border/40 bg-card transition hover:border-primary/40"
                >
                  <div className="aspect-video bg-muted" />
                  <div className="p-8">
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      {(i.ngos as any)?.name}
                    </span>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-primary">
                      {i.title}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {i.description}
                    </p>
                    <div className="mt-8 flex items-center justify-between">
                      <div className="text-xs font-medium text-primary">
                        Rs {Number(i.current_amount_mur).toLocaleString()} / Rs{" "}
                        {Number(i.goal_amount_mur).toLocaleString()}
                      </div>
                      <Link
                        to="/signup"
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        Support →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-16 text-center">
              <h2 className="font-display text-2xl text-primary">No initiatives available yet.</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Partner organizations are being onboarded. Become a member to be the first to
                support new initiatives as they launch.
              </p>
              <div className="mt-6">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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
