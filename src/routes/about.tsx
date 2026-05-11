import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — CommonGround" },
      {
        name: "description",
        content:
          "CommonGround is a membership-based impact platform building governance-first NGO infrastructure for long-term social change.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="kicker">About</span>
          <h1 className="mt-4 font-display text-5xl font-semibold text-primary sm:text-6xl">
            Trust, transparency, and the long-haul.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            CommonGround was founded on a simple premise: high-impact social work needs
            predictable, multi-year funding — not one-off campaigns. We are building the
            governance, financial, and reporting infrastructure that lets members support
            vetted programs with confidence, and lets NGOs focus on the work.
          </p>
        </div>
      </section>

      <section className="bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            {
              title: "Our mission",
              body: "Channel recurring, transparent funding to long-horizon programs in restoration, education and community resilience.",
            },
            {
              title: "Our principles",
              body: "Governance-first. Treasury clarity. Member-aligned reporting. Every dollar accounted for.",
            },
            {
              title: "Where we started",
              body: "Rooted in Mauritius, growing across regions — partnering with vetted organizations doing systemic, multi-year work.",
            },
          ].map((b) => (
            <div key={b.title} className="rounded-3xl border border-border/40 bg-background p-8">
              <h2 className="font-display text-2xl font-semibold text-primary">{b.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
