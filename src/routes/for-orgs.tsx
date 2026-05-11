import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/for-orgs")({
  head: () => ({
    meta: [
      { title: "For Organizations — CommonGround" },
      {
        name: "description",
        content:
          "Predictable, recurring funding designed for long-horizon NGO programs.",
      },
    ],
  }),
  component: ForOrgsPage,
});

function ForOrgsPage() {
  return (
    <SiteLayout>
      <section>
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="kicker">For Organizations</span>
          <h1 className="mt-4 font-display text-5xl font-semibold text-primary sm:text-6xl">
            Funding built for long-horizon work.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Spend less time chasing donors and more time on the work itself. CommonGround
            delivers structured, recurring funding designed for multi-year programs —
            restoration, conservation, education — the kind of work that takes years, not
            quarters.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              "Predictable monthly funding cycles",
              "Streamlined impact reporting tools",
              "Direct connection to active members",
            ].map((t) => (
              <div key={t} className="rounded-2xl border border-border/40 bg-card p-5 text-sm">
                {t}
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              to="/partner"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Partner With Us
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
