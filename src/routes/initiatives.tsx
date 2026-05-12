import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

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

          <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-16 text-center">
            <h2 className="font-display text-2xl text-primary">No initiatives available yet.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Partner organizations are being onboarded. Become a member to be the first to support
              new initiatives as they launch.
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
        </div>
      </section>
    </SiteLayout>
  );
}
